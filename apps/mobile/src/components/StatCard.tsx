import { View, Text, StyleSheet } from "react-native";
import { colors, radius, spacing, font } from "../theme/tokens";
import { moderateScale } from "../theme/responsive";

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

const ICON_SIZE = moderateScale(40);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
  },
  iconWrap: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  icon: { color: colors.primary, fontWeight: "700" },
  value: { fontSize: font.xxl, fontWeight: "700", color: colors.textPrimary },
  label: { fontSize: font.sm, color: colors.textSecondary, marginTop: moderateScale(2) },
});
