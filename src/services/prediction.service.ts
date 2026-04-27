/**
 * prediction.service.ts
 *
 * Llama al endpoint POST /predict del backend en Render.
 * Reemplaza prediction.mock.ts — la firma es idéntica para
 * que index.tsx no necesite cambios de tipos.
 *
 * FIX 422: se lee la imagen como Blob via fetch(localUri) antes de
 * adjuntarla al FormData. Adjuntar { uri, name, type } directamente
 * funciona en Metro nativo pero en Expo Web (y en cualquier entorno
 * que no sea el bundler nativo) se serializa como "[object Object]",
 * haciendo que FastAPI reciba un string en lugar de un archivo.
 */

import { DiseaseClass, PredictionResult } from "../types/prediction";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL?.trim() ?? "";

if (!API_BASE_URL) {
  console.warn(
    "[prediction.service] EXPO_PUBLIC_API_URL no está definida en .env"
  );
}

type ApiPredictResponse = {
  clase_predicha: DiseaseClass;
  confianza: number;
  probabilidades: Record<DiseaseClass, number>;
  gradcam_b64: string; // "data:image/png;base64,..."
};

export async function predictLeaf(imageUri: string): Promise<PredictionResult> {
  if (!API_BASE_URL) {
    throw new Error(
      "La URL de la API no está configurada. " +
        "Agrega EXPO_PUBLIC_API_URL en tu archivo .env"
    );
  }

  // ── 1. Leer la imagen local como Blob ──────────────────────────────
  // fetch() sobre una URI local (file://, content://, blob:) devuelve
  // la imagen como Blob real — garantiza que FormData siempre recibe
  // bytes binarios independientemente de la plataforma.
  let fileBlob: Blob;

  try {
    const localResponse = await fetch(imageUri);

    if (!localResponse.ok) {
      throw new Error("No se pudo leer el archivo de imagen local.");
    }

    fileBlob = await localResponse.blob();
  } catch (readError) {
    throw new Error(
      readError instanceof Error
        ? readError.message
        : "No se pudo preparar la imagen para enviarla al servidor."
    );
  }

  // ── 2. Construir FormData con un File real ──────────────────────────
  // File extiende Blob y añade el nombre del archivo.
  // FastAPI / python-multipart lo requieren para reconocer el campo
  // como UploadFile en lugar de un campo de texto.
  const ext  = fileBlob.type.includes("png") ? "png" : "jpg";
  const mime = fileBlob.type || "image/jpeg";
  const file = new File([fileBlob], `leaf.${ext}`, { type: mime });

  const formData = new FormData();
  formData.append("file", file);

  // ── 3. Llamar al endpoint /predict ─────────────────────────────────
  // NO se pone Content-Type manualmente — fetch lo setea solo con el
  // boundary correcto cuando el body es FormData.
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/predict`, {
      method: "POST",
      body: formData,
    });
  } catch {
    throw new Error(
      "No se pudo conectar con el servidor de análisis. " +
        "Verifica tu conexión a Internet y que la API esté activa."
    );
  }

  // ── 4. Manejar errores HTTP ─────────────────────────────────────────
  if (!response.ok) {
    let detail = `Error ${response.status}`;

    try {
      const body = (await response.json()) as { detail?: string | unknown[] };
      if (typeof body.detail === "string") {
        detail = body.detail;
      } else if (Array.isArray(body.detail)) {
        // FastAPI devuelve un array de errores de validación — tomar el primero
        const first = body.detail[0] as { msg?: string } | undefined;
        if (first?.msg) detail = first.msg;
      }
    } catch {
      // respuesta no-JSON, usamos el status
    }

    throw new Error(`El servidor respondió con un error: ${detail}`);
  }

  // ── 5. Parsear respuesta ────────────────────────────────────────────
  let apiResult: ApiPredictResponse;

  try {
    apiResult = (await response.json()) as ApiPredictResponse;
  } catch {
    throw new Error("La respuesta del servidor no tiene el formato esperado.");
  }

  // ── 6. Normalizar al tipo PredictionResult de la app ───────────────
  return {
    prediction:    apiResult.clase_predicha,
    confidence:    apiResult.confianza,
    probabilities: apiResult.probabilidades,
    imageUri,
    gradcamUrl:    apiResult.gradcam_b64,  // data-URI directo — Image lo renderiza sin conversión
    gradcamBase64: undefined,
    modelName:     "MobileNetV2",
    createdAt:     new Date().toISOString(),
  };
}