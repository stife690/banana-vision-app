import { StyleSheet } from "react-native";
import { theme } from "../constants/theme";

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
    marginTop: 18,
  },
  headerRow: {
    marginBottom: 16,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.9,
    color: theme.colors.primary,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    color: theme.colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.textSoft,
  },
  predictionBox: {
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.radius.lg,
    padding: 16,
    marginBottom: 16,
  },
  predictionLabel: {
    fontSize: 13,
    color: theme.colors.textSoft,
    marginBottom: 6,
    fontWeight: "600",
  },
  predictionValue: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.text,
    textTransform: "capitalize",
    marginBottom: 4,
  },
  confidenceText: {
    fontSize: 15,
    color: theme.colors.textSoft,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.text,
    marginBottom: 12,
  },
  probabilityRow: {
    marginBottom: 12,
  },
  probabilityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  probabilityLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
    textTransform: "capitalize",
  },
  probabilityValue: {
    fontSize: 14,
    color: theme.colors.textSoft,
    fontWeight: "600",
  },
  track: {
    height: 10,
    borderRadius: theme.radius.full,
    backgroundColor: "#E8ECE7",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primary,
  },
  gradcamBox: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    backgroundColor: "#FAFCF8",
    overflow: "hidden",
    marginTop: 6,
  },
  // ── Grad-CAM: proporción cuadrada, sin recorte ───────────────────────
  gradcamImage: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#EEF4ED",
  },
  gradcamPlaceholder: {
    minHeight: 140,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  gradcamPlaceholderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 6,
  },
  gradcamPlaceholderText: {
    fontSize: 14,
    lineHeight: 22,
    color: theme.colors.textSoft,
    textAlign: "center",
  },
  footer: {
    marginTop: 16,
  },
});

export default styles;