import { View, Text, StyleSheet } from "react-native";
import { colors, radius, font } from "../theme/tokens";
import { moderateScale } from "../theme/responsive";

export type StatusTone = "success" | "caution" | "urgent";

const TONE_MAP: Record<StatusTone, { bg: string; fg: string }> = {
  success: { bg: colors.statusSuccessBg, fg: colors.statusSuccess },
  caution: { bg: colors.statusCautionBg, fg: colors.statusCaution },
  urgent: { bg: colors.statusUrgentBg, fg: colors.statusUrgent },
};

export function StatusBadge({ label, tone }: { label: string; tone: StatusTone }) {
  const { bg, fg } = TONE_MAP[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(4),
    borderRadius: radius.pill,
  },
  text: { fontSize: font.xs, fontWeight: "600" },
});
