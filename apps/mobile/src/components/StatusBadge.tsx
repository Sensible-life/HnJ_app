import { View, Text, StyleSheet } from "react-native";
import { colors, radius } from "../theme/tokens";

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
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.pill },
  text: { fontSize: 12, fontWeight: "600" },
});
