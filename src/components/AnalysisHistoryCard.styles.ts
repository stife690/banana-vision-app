import { StyleSheet } from "react-native";
import { theme } from "../constants/theme";

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
    marginBottom: 14,
    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  // ── Imagen: proporción fija, sin recorte ─────────────────────────────
  image: {
    width: "100%",
    aspectRatio: 4 / 3,
    backgroundColor: "#EEF4ED",
  },
  placeholder: {
    width: "100%",
    aspectRatio: 4 / 3,
    backgroundColor: "#EEF4ED",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  placeholderText: {
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.textSoft,
    textAlign: "center",
  },
  content: {
    padding: 16,
  },
  rowTop: {
    marginBottom: 10,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: theme.colors.primary,
    marginBottom: 6,
  },
  prediction: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
    color: theme.colors.text,
    textTransform: "capitalize",
    marginBottom: 4,
  },
  confidence: {
    fontSize: 14,
    color: theme.colors.textSoft,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
    marginBottom: 2,
  },
  chip: {
    backgroundColor: "#F7FAF7",
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  chipText: {
    color: theme.colors.text,
    fontWeight: "600",
    fontSize: 13,
  },
});

export default styles;