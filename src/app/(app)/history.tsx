/**
 * src/app/(app)/history.tsx
 */

import { router } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AnalysisHistoryCard from "../../components/AnalysisHistoryCard";
import AppButton from "../../components/AppButton";
import FloatingHomeButton from "../../components/FloatingHomeButton";
import { listUserAnalyses } from "../../services/analysis.service"; // ← FIX
import { AnalysisWithSignedUrl } from "../../types/database";
import styles from "./history.styles";

export default function HistoryScreen() {
  const [items, setItems] = useState<AnalysisWithSignedUrl[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadHistory = async (mode: "initial" | "refresh" = "initial") => {
    if (mode === "initial") setIsLoading(true);
    else setIsRefreshing(true);

    setErrorMessage(null);

    try {
      const analyses = await listUserAnalyses();
      setItems(analyses);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo cargar el historial de análisis."
      );
    } finally {
      if (mode === "initial") setIsLoading(false);
      else setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void loadHistory();
  }, []);

  const handleOpenAnalysis = (analysisId: string) => {
    router.push({
      pathname: "/(app)/result",
      params: { analysisId },
    });
  };

  const renderHeader = () => (
    <View style={styles.headerCard}>
      <Text style={styles.eyebrow}>HISTORIAL</Text>
      <Text style={styles.title}>Análisis guardados</Text>
      <Text style={styles.subtitle}>
        Aquí se muestran los resultados almacenados para el usuario autenticado.
        Cada registro incluye su imagen, predicción, confianza y fecha.
      </Text>

      <View style={styles.chipRow}>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{items.length} registros</Text>
        </View>
        <View style={styles.chip}>
          <Text style={styles.chipText}>Supabase</Text>
        </View>
        <View style={styles.chip}>
          <Text style={styles.chipText}>Storage privado</Text>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <FloatingHomeButton />
        <View style={styles.listContent}>
          <View style={styles.container}>
            {renderHeader()}
            <View style={styles.statusCard}>
              <Text style={styles.statusTitle}>Cargando historial</Text>
              <Text style={styles.statusText}>
                Estamos consultando los análisis guardados en tu cuenta.
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (errorMessage) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <FloatingHomeButton />
        <View style={styles.listContent}>
          <View style={styles.container}>
            {renderHeader()}
            <View style={styles.statusCard}>
              <Text style={styles.errorTitle}>No se pudo cargar</Text>
              <Text style={styles.statusText}>{errorMessage}</Text>
              <AppButton
                title="Intentar de nuevo"
                onPress={() => { void loadHistory(); }}
              />
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FloatingHomeButton />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => { void loadHistory("refresh"); }}
          />
        }
        ListHeaderComponent={
          <View style={styles.container}>{renderHeader()}</View>
        }
        ListEmptyComponent={
          <View style={styles.container}>
            <View style={styles.statusCard}>
              <Text style={styles.statusTitle}>Todavía no hay análisis</Text>
              <Text style={styles.statusText}>
                Cuando captures o subas una imagen y el análisis se guarde en
                Supabase, aparecerá aquí automáticamente.
              </Text>
              <AppButton
                title="Actualizar historial"
                onPress={() => { void loadHistory(); }}
              />
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.container}>
            <AnalysisHistoryCard
              item={item}
              onPress={() => handleOpenAnalysis(item.id)}
            />
          </View>
        )}
      />
    </SafeAreaView>
  );
}
