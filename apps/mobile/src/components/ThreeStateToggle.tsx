import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors, radius, font } from "../theme/tokens";
import { moderateScale } from "../theme/responsive";

export type ItemState = "UNSET" | "NORMAL" | "CAUTION" | "URGENT" | "NOT_APPLICABLE";

const OPTIONS: { state: ItemState; label: string }[] = [
  { state: "NORMAL", label: "정상" },
  { state: "CAUTION", label: "주의" },
  { state: "URGENT", label: "긴급" },
  { state: "NOT_APPLICABLE", label: "해당없음" },
];

const ACTIVE_COLOR: Record<Exclude<ItemState, "UNSET">, string> = {
  NORMAL: colors.statusSuccess,
  CAUTION: colors.statusCaution,
  URGENT: colors.statusUrgent,
  NOT_APPLICABLE: colors.textSecondary,
};

export function ThreeStateToggle({
  value,
  onChange,
}: {
  value: ItemState;
  onChange: (state: ItemState) => void;
}) {
  return (
    <View style={styles.row}>
      {OPTIONS.map((opt) => {
        const active = value === opt.state;
        return (
          <TouchableOpacity
            key={opt.state}
            style={[
              styles.button,
              active && { backgroundColor: ACTIVE_COLOR[opt.state as Exclude<ItemState, "UNSET">] },
            ]}
            onPress={() => onChange(opt.state)}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: moderateScale(8), marginTop: moderateScale(8) },
  button: {
    flex: 1,
    paddingVertical: moderateScale(10),
    borderRadius: radius.input,
    backgroundColor: colors.backgroundSubtle,
    alignItems: "center",
  },
  label: { fontSize: font.sm, fontWeight: "600", color: colors.textSecondary },
  labelActive: { color: "#FFFFFF" },
});
