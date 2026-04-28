import { StyleSheet } from "react-native";
import { theme } from "../../constants/theme";

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  container: {
    width: "100%",
    maxWidth: 700,
    alignSelf: "center",
  },
  headerCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: 22,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: theme.colors.primary,
    marginBottom: 8,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
    color: theme.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.textSoft,
    marginBottom: 18,
  },
  imageFrame: {
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "#EEF4ED",
  },
  // ── Imagen principal: proporción 4:3, sin recorte ────────────────────
  image: {
    width: "100%",
    aspectRatio: 4 / 3,
  },
  loadingCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: 22,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: 18,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 180,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.text,
    marginTop: 14,
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.textSoft,
    textAlign: "center",
  },
  footer: {
    marginTop: 18,
  },
  buttonSpacing: {
    marginBottom: 12,
  },
});
 
export default styles;