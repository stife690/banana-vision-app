/**
 * src/app/(app)/result.tsx
 */

import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AnalysisSummaryCard from "../../components/AnalysisSummaryCard";
import AppButton from "../../components/AppButton";
import { theme } from "../../constants/theme";
import {
  getAnalysisById,
  mapAnalysisToPrediction,
} from "../../services/analysis.service"; // ← FIX: todo desde analysis.service
import { PredictionResult } from "../../types/prediction";
import styles from "./result.styles";

export default function ResultScreen() {
  const params = useLocalSearchParams<{
    uri?: string | string[];
    result?: string | string[];
    analysisId?: string | string[];
  }>();

  const uriParam = Array.isArray(params.uri) ? params.uri[0] : params.uri;
  const resultParam = Array.isArray(params.result)
    ? params.result[0]
    : params.result;
  const analysisId = Array.isArray(params.analysisId)
    ? params.analysisId[0]
    : params.analysisId;

  // Resultado precargado que viene de index.tsx via params (camino más común)
  const preloadedResult = useMemo<PredictionResult | null>(() => {
    if (!resultParam) return null;
    try {
      return JSON.parse(decodeURIComponent(resultParam)) as PredictionResult;
    } catch {
      return null;
    }
  }, [resultParam]);

  const [loading, setLoading]           = useState(Boolean(analysisId) && !preloadedResult);
  const [result, setResult]             = useState<PredictionResult | null>(preloadedResult);
  const [displayUri, setDisplayUri]     = useState<string>(uriParam ?? preloadedResult?.imageUri ?? "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      // Caso A: viene con analysisId (desde el historial)
      if (analysisId) {
        setLoading(true);
        setErrorMessage(null);

        try {
          const analysis = await getAnalysisById(analysisId);
          const mapped   = mapAnalysisToPrediction(analysis);

          setResult(mapped);
          setDisplayUri(analysis.signed_image_url ?? analysis.image_url);
        } catch (error) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "No se pudo cargar el análisis seleccionado."
          );
        } finally {
          setLoading(false);
        }
        return;
      }

      // Caso B: viene con resultado precargado (desde index.tsx)
      if (preloadedResult) {
        setLoading(false);
        setResult(preloadedResult);
        setDisplayUri(uriParam ?? preloadedResult.imageUri);
        return;
      }

      // Caso C: no hay datos suficientes
      setLoading(false);
      setErrorMessage("No se encontraron datos para mostrar este análisis.");
    };

    void run();
  }, [analysisId, preloadedResult, uriParam]);

  if (errorMessage) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.container}>
            <View style={styles.headerCard}>
              <Text style={styles.title}>Resultado no disponible</Text>
              <Text style={styles.subtitle}>{errorMessage}</Text>
              <AppButton
                title="Volver al inicio"
                onPress={() => router.replace("/")}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <View style={styles.headerCard}>
            <Text style={styles.eyebrow}>RESULTADO COMPLETO</Text>
            <Text style={styles.title}>Diagnóstico de hoja de banano</Text>
            <Text style={styles.subtitle}>
              Imagen original, clase predicha, probabilidades y mapa Grad-CAM.
            </Text>

            {displayUri ? (
              <View style={styles.imageFrame}>
                <Image
                  source={{ uri: displayUri }}
                  style={styles.image}
                  resizeMode="cover"
                />
              </View>
            ) : null}
          </View>

          {loading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingTitle}>Cargando análisis</Text>
              <Text style={styles.loadingText}>
                Recuperando el diagnóstico guardado en tu historial.
              </Text>
            </View>
          ) : result ? (
            <AnalysisSummaryCard result={result} />
          ) : null}

          <View style={styles.footer}>
            <AppButton
              title="Analizar otra imagen"
              onPress={() => router.replace("/")}
              style={styles.buttonSpacing}
            />
            <AppButton
              title="Volver"
              variant="outline"
              onPress={() => router.back()}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
