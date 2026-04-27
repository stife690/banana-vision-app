/**
 * src/app/(app)/index.tsx
 *
 * Pantalla principal. Cambios respecto al mock:
 *   - predictLeafMock → predictLeaf  (llamada real a Render)
 *   - saveAnalysisResult recibe el resultado con gradcamUrl incluido
 *   - Estados de UI más granulares: analizando / guardando / ok / error
 */

import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../auth/auth-context";
import AnalysisSummaryCard from "../../components/AnalysisSummaryCard";
import AppButton from "../../components/AppButton";
import { theme } from "../../constants/theme";
import { saveAnalysisResult } from "../../services/analysis.service";
import { predictLeaf } from "../../services/prediction.service";
import { PredictionResult } from "../../types/prediction";
import styles from "./home.styles";

type ImageSourceLabel = "Cámara" | "Galería" | null;

// Estados posibles del pipeline de análisis
type AnalysisPhase =
  | "idle"          // sin imagen o sin analizar
  | "predicting"    // POST /predict en curso
  | "saving"        // subida a Storage + INSERT en DB
  | "done"          // todo correcto
  | "predict_error" // falló la llamada al modelo
  | "save_error";   // falló el guardado en Supabase

export default function HomeScreen() {
  const { signOut } = useAuth();

  const params = useLocalSearchParams<{
    capturedUri?: string | string[];
    source?: string | string[];
  }>();

  const incomingUri = Array.isArray(params.capturedUri)
    ? params.capturedUri[0]
    : params.capturedUri;

  const incomingSourceParam = Array.isArray(params.source)
    ? params.source[0]
    : params.source;

  const handledUriRef = useRef<string | null>(null);
  const requestIdRef  = useRef(0);

  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [selectedSource,   setSelectedSource]   = useState<ImageSourceLabel>(null);
  const [analysisResult,   setAnalysisResult]   = useState<PredictionResult | null>(null);
  const [phase,            setPhase]            = useState<AnalysisPhase>("idle");
  const [errorMessage,     setErrorMessage]     = useState<string | null>(null);

  // ── Helpers de fase ────────────────────────────────────────────────
  const isAnalyzing = phase === "predicting";
  const isSaving    = phase === "saving";

  // ── Navegar al detalle completo ────────────────────────────────────
  const openFullResult = () => {
    if (!selectedImageUri || !analysisResult) return;

    router.push({
      pathname: "/(app)/result",
      params: {
        uri: selectedImageUri,
        result: encodeURIComponent(JSON.stringify(analysisResult)),
      },
    });
  };

  // ── Pipeline principal ─────────────────────────────────────────────
  const runAnalysis = async (uri: string) => {
    const currentRequestId = ++requestIdRef.current;

    setPhase("predicting");
    setAnalysisResult(null);
    setErrorMessage(null);

    // ── Paso 1: llamar al modelo en Render ───────────────────────────
    let result: PredictionResult;

    try {
      result = await predictLeaf(uri);
    } catch (err) {
      if (requestIdRef.current !== currentRequestId) return;

      setPhase("predict_error");
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "No se pudo completar el análisis."
      );
      return;
    }

    if (requestIdRef.current !== currentRequestId) return;

    // Mostrar resultado inmediatamente — el guardado es secundario
    setAnalysisResult(result);
    setPhase("saving");

    // ── Paso 2: guardar en Supabase Storage + DB ─────────────────────
    // analysis.service.ts ya sube la imagen y hace el INSERT.
    // gradcamUrl viene incluido en result — el servicio lo persiste en gradcam_url.
    try {
      await saveAnalysisResult(result);

      if (requestIdRef.current !== currentRequestId) return;
      setPhase("done");
    } catch (saveErr) {
      if (requestIdRef.current !== currentRequestId) return;

      setPhase("save_error");
      setErrorMessage(
        saveErr instanceof Error
          ? saveErr.message
          : "No se pudo guardar el análisis en la base de datos."
      );
    }
  };

  // ── Handlers de selección de imagen ───────────────────────────────
  const handleImageSelected = async (
    uri: string,
    source: Exclude<ImageSourceLabel, null>
  ) => {
    setSelectedImageUri(uri);
    setSelectedSource(source);
    await runAnalysis(uri);
  };

  // Imagen entrante desde la pantalla de cámara
  useEffect(() => {
    if (!incomingUri) return;
    if (handledUriRef.current === incomingUri) return;

    handledUriRef.current = incomingUri;

    const source: Exclude<ImageSourceLabel, null> =
      incomingSourceParam === "camera" ? "Cámara" : "Galería";

    void handleImageSelected(incomingUri, source);
  }, [incomingUri, incomingSourceParam]);

  const handleTakePhoto = () => {
    router.push("/(app)/camera");
  };

  const handlePickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permiso requerido",
        "Debes habilitar la galería para subir una imagen."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      await handleImageSelected(result.assets[0].uri, "Galería");
    }
  };

  const handleOpenPreview = () => {
    if (!selectedImageUri) return;
    router.push({
      pathname: "/(app)/preview",
      params: { uri: selectedImageUri },
    });
  };

  const handleReanalyze = async () => {
    if (!selectedImageUri) return;
    await runAnalysis(selectedImageUri);
  };

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>

          {/* ── Hero ──────────────────────────────────────────────── */}
          <View style={styles.heroCard}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>ANÁLISIS FOLIAR</Text>
            </View>

            <Text style={styles.title}>Banana Vision</Text>
            <Text style={styles.subtitle}>
              Captura o sube una hoja para identificar la clase detectada y
              visualizar el mapa Grad-CAM generado por el modelo.
            </Text>

            <View style={styles.infoRow}>
              <View style={styles.infoChip}>
                <Text style={styles.infoChipText}>4 clases</Text>
              </View>
              <View style={styles.infoChip}>
                <Text style={styles.infoChipText}>Grad-CAM</Text>
              </View>
              <View style={styles.infoChip}>
                <Text style={styles.infoChipText}>MobileNetV2</Text>
              </View>
            </View>
          </View>

          {/* ── Acciones principales ──────────────────────────────── */}
          <View style={styles.actions}>
            <AppButton
              title="Tomar foto"
              onPress={handleTakePhoto}
              style={styles.actionButton}
              disabled={isAnalyzing || isSaving}
            />

            <AppButton
              title="Subir desde galería"
              variant="dark"
              onPress={handlePickFromGallery}
              style={styles.actionButton}
              disabled={isAnalyzing || isSaving}
            />

            <AppButton
              title="Ver historial"
              variant="outline"
              onPress={() => router.push("/(app)/history")}
              style={styles.actionButton}
            />

            <AppButton
              title="Perfil"
              variant="outline"
              onPress={() => router.push("/(app)/profile")}
            />
          </View>

          {/* ── Vista previa de imagen seleccionada ───────────────── */}
          {selectedImageUri ? (
            <View style={styles.selectedCard}>
              <Text style={styles.selectedEyebrow}>IMAGEN SELECCIONADA</Text>
              <Text style={styles.selectedTitle}>Hoja lista para analizar</Text>
              <Text style={styles.selectedSubtitle}>
                La imagen fue cargada correctamente y el sistema está generando
                el diagnóstico.
              </Text>

              <View style={styles.imageFrame}>
                <Image
                  source={{ uri: selectedImageUri }}
                  style={styles.selectedImage}
                  resizeMode="cover"
                />
              </View>

              <View style={styles.imageMetaRow}>
                {selectedSource ? (
                  <View style={styles.metaChip}>
                    <Text style={styles.metaChipText}>{selectedSource}</Text>
                  </View>
                ) : null}

                <View style={styles.metaChip}>
                  <Text style={styles.metaChipText}>MobileNetV2</Text>
                </View>

                <View style={styles.metaChip}>
                  <Text style={styles.metaChipText}>4 clases</Text>
                </View>
              </View>

              <View style={styles.selectedActions}>
                <AppButton
                  title="Ver vista previa"
                  variant="outline"
                  onPress={handleOpenPreview}
                  style={styles.actionButton}
                />

                <AppButton
                  title="Analizar de nuevo"
                  onPress={handleReanalyze}
                  loading={isAnalyzing}
                  disabled={isSaving}
                />
              </View>
            </View>
          ) : null}

          {/* ── Estado: analizando (llamada al modelo) ────────────── */}
          {phase === "predicting" ? (
            <View style={styles.analysisLoadingBox}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.analysisLoadingTitle}>
                Analizando la hoja
              </Text>
              <Text style={styles.analysisLoadingText}>
                El modelo está procesando la imagen y generando el mapa
                Grad-CAM. Esto puede tardar unos segundos.
              </Text>
            </View>
          ) : null}

          {/* ── Resultado del análisis ────────────────────────────── */}
          {analysisResult ? (
            <AnalysisSummaryCard
              result={analysisResult}
              onOpenDetail={openFullResult}
            />
          ) : null}

          {/* ── Estado: guardando en Supabase ─────────────────────── */}
          {isSaving ? (
            <View style={styles.saveStatusCard}>
              <Text style={styles.saveStatusTitle}>Guardando análisis…</Text>
              <Text style={styles.saveStatusText}>
                Subiendo la imagen a Supabase Storage y registrando el
                resultado en tu historial.
              </Text>
            </View>
          ) : null}

          {/* ── Estado: guardado correctamente ────────────────────── */}
          {phase === "done" ? (
            <View style={styles.saveStatusCard}>
              <Text style={styles.saveStatusTitle}>✓ Análisis guardado</Text>
              <Text style={styles.saveStatusText}>
                El diagnóstico fue registrado en tu historial. Puedes verlo en
                la sección "Ver historial".
              </Text>
            </View>
          ) : null}

          {/* ── Estado: error en el modelo ────────────────────────── */}
          {phase === "predict_error" ? (
            <View style={styles.saveStatusCard}>
              <Text style={styles.saveStatusErrorTitle}>
                Error en el análisis
              </Text>
              <Text style={styles.saveStatusText}>
                {errorMessage ?? "No se pudo conectar con el servidor."}
              </Text>
              <AppButton
                title="Reintentar análisis"
                onPress={handleReanalyze}
                style={{ marginTop: 12 }}
              />
            </View>
          ) : null}

          {/* ── Estado: error al guardar ──────────────────────────── */}
          {phase === "save_error" ? (
            <View style={styles.saveStatusCard}>
              <Text style={styles.saveStatusErrorTitle}>
                No se pudo guardar
              </Text>
              <Text style={styles.saveStatusText}>
                {errorMessage ??
                  "El análisis fue correcto pero no se pudo registrar en la base de datos."}
              </Text>
            </View>
          ) : null}

          {/* ── Footer ───────────────────────────────────────────── */}
          <View style={styles.footer}>
            <AppButton
              title="Cerrar sesión"
              variant="danger"
              onPress={signOut}
            />
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
