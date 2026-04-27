/**
 * src/components/AnalysisHistoryCard.tsx
 */

import React from "react";
import { Image, Pressable, Text, View } from "react-native";

import { AnalysisWithSignedUrl } from "../types/database";
import styles from "./AnalysisHistoryCard.styles";

type Props = {
  item: AnalysisWithSignedUrl;
  onPress: () => void;
};

function formatConfidence(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "Confianza no disponible";
  }
  return `Confianza: ${(value * 100).toFixed(1)}%`;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function AnalysisHistoryCard({ item, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      {item.signed_image_url ? (
        <Image
          source={{ uri: item.signed_image_url }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            No se pudo cargar la vista previa de esta imagen.
          </Text>
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.rowTop}>
          <Text style={styles.eyebrow}>ANÁLISIS GUARDADO</Text>
          {/* FIX: clase_predicha en lugar de prediction */}
          <Text style={styles.prediction}>{item.clase_predicha}</Text>
          {/* FIX: confianza en lugar de confidence */}
          <Text style={styles.confidence}>
            {formatConfidence(item.confianza)}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{formatDate(item.created_at)}</Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>MobileNetV2</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
