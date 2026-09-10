import { View, Text, StyleSheet } from "react-native";
import { colors, radius, shadow, spacing } from "../theme/tokens";

type Props = {
  label: string;
  value: string;
  icon?: string;
};

export function StatCard({ label, value, icon = "●" }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.md,
    ...shadow.card,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  icon: { color: colors.primary, fontWeight: "700" },
  value: { fontSize: 22, fontWeight: "700", color: colors.textPrimary },
  label: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
});
