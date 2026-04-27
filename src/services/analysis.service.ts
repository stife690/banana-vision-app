/**
 * src/services/analysis.service.ts
 */

import { supabase } from "../lib/supabase";
import {
  AnalysisInsert,
  AnalysisRecord,
  AnalysisWithSignedUrl
} from "../types/database";
import { PredictionResult } from "../types/prediction";

const BUCKET_NAME = "leaf-images";
const SIGNED_URL_EXPIRY = 3600; // segundos

// ── Helpers internos ───────────────────────────────────────────────────────

async function getAuthenticatedUserOrThrow() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("No se pudo identificar al usuario autenticado.");
  }

  return user;
}

/** Lee una URI local y devuelve ArrayBuffer + contentType para el upload */
async function readLocalImage(uri: string) {
  const response = await fetch(uri);

  if (!response.ok) {
    throw new Error("No se pudo leer la imagen local para subirla.");
  }

  const blob        = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();

  // Derivar extensión y mime type
  const mime      = blob.type || "image/jpeg";
  const extension = mime.includes("png") ? "png" : "jpg";

  return { arrayBuffer, contentType: mime, extension };
}

/** Sube imagen a Storage y devuelve su storage path */
async function uploadImageToStorage(
  uri: string,
  userId: string
): Promise<string> {
  const { arrayBuffer, contentType, extension } = await readLocalImage(uri);

  const fileName   = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;
  const storagePath = `${userId}/${fileName}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, arrayBuffer, { contentType, upsert: false });

  if (error) {
    throw new Error(`No se pudo subir la imagen: ${error.message}`);
  }

  return storagePath;
}

/** Genera una signed URL válida por SIGNED_URL_EXPIRY segundos */
export async function getSignedImageUrl(
  imagePath: string,
  expiresInSeconds = SIGNED_URL_EXPIRY
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(imagePath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw new Error("No se pudo generar la URL temporal de la imagen.");
  }

  return data.signedUrl;
}

/** Adjunta la signed URL a un registro de análisis */
async function attachSignedUrl(
  record: AnalysisRecord
): Promise<AnalysisWithSignedUrl> {
  // image_url almacena el storage path (ej: "uuid/filename.jpg")
  // Intentamos generar la signed URL a partir de ese path.
  // Si falla (p.ej. URL ya es pública o rota), devolvemos null.
  try {
    const signedUrl = await getSignedImageUrl(record.image_url);
    return { ...record, signed_image_url: signedUrl };
  } catch {
    return { ...record, signed_image_url: null };
  }
}

// ── Exports públicos ───────────────────────────────────────────────────────

/**
 * Guarda un análisis completo:
 * 1. Sube la imagen a Storage
 * 2. Hace INSERT en la tabla analyses con las columnas correctas
 *
 * Si el INSERT falla, elimina la imagen ya subida para no dejar basura.
 */
export async function saveAnalysisResult(
  result: PredictionResult
): Promise<AnalysisRecord> {
  const user = await getAuthenticatedUserOrThrow();

  // Paso 1: subir imagen
  const storagePath = await uploadImageToStorage(result.imageUri, user.id);

  // Paso 2: preparar payload alineado con la tabla
  // gradcam_url es NOT NULL → si por alguna razón llega undefined usamos ""
  // (en la práctica siempre viene de la API)
  const payload: AnalysisInsert = {
    user_id:        user.id,
    clase_predicha: result.prediction,      // ← nombre correcto en DB
    confianza:      result.confidence,      // ← nombre correcto en DB
    probabilidades: result.probabilities,   // ← nombre correcto en DB
    image_url:      storagePath,            // ← storage path (NOT NULL)
    gradcam_url:    result.gradcamUrl ?? "", // ← data-URI base64 (NOT NULL)
  };

  const { data, error: insertError } = await supabase
    .from("analyses")
    .insert(payload)
    .select("*")
    .single();

  if (insertError) {
    // Limpiar la imagen subida si el INSERT falla
    await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
    throw new Error(`No se pudo guardar el análisis: ${insertError.message}`);
  }

  return data as AnalysisRecord;
}

/**
 * Lista todos los análisis del usuario autenticado,
 * ordenados del más reciente al más antiguo.
 * Adjunta signed URL a cada registro para poder mostrar la imagen.
 */
export async function listUserAnalyses(): Promise<AnalysisWithSignedUrl[]> {
  const user = await getAuthenticatedUserOrThrow();

  const { data, error } = await supabase
    .from("analyses")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`No se pudo cargar el historial: ${error.message}`);
  }

  const records = (data ?? []) as AnalysisRecord[];
  return Promise.all(records.map(attachSignedUrl));
}

/**
 * Carga un análisis específico por ID (solo del usuario autenticado).
 */
export async function getAnalysisById(
  analysisId: string
): Promise<AnalysisWithSignedUrl> {
  const user = await getAuthenticatedUserOrThrow();

  const { data, error } = await supabase
    .from("analyses")
    .select("*")
    .eq("id", analysisId)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    throw new Error("No se pudo cargar el análisis seleccionado.");
  }

  return attachSignedUrl(data as AnalysisRecord);
}

/**
 * Actualiza el rating de un análisis (1-5).
 */
export async function rateAnalysis(
  analysisId: string,
  rating: number
): Promise<void> {
  const { error } = await supabase
    .from("analyses")
    .update({ rating })
    .eq("id", analysisId);

  if (error) {
    throw new Error(`No se pudo guardar la calificación: ${error.message}`);
  }
}

/**
 * Convierte un AnalysisWithSignedUrl (de Supabase) al tipo PredictionResult
 * que usan los componentes de la app. Centralizado aquí para no duplicarlo.
 */
export function mapAnalysisToPrediction(
  analysis: AnalysisWithSignedUrl
): PredictionResult {
  return {
    prediction:    analysis.clase_predicha,
    confidence:    analysis.confianza,
    probabilities: analysis.probabilidades,
    imageUri:      analysis.signed_image_url ?? analysis.image_url,
    gradcamUrl:    analysis.gradcam_url || undefined,
    gradcamBase64: undefined,
    modelName:     "MobileNetV2",
    createdAt:     analysis.created_at,
  };
}