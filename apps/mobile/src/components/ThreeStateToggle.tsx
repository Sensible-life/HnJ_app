import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors, radius } from "../theme/tokens";

export type ItemState = "UNSET" | "NORMAL" | "CAUTION" | "URGENT";

const OPTIONS: { state: ItemState; label: string }[] = [
  { state: "NORMAL", label: "정상" },
  { state: "CAUTION", label: "주의" },
  { state: "URGENT", label: "긴급" },
];

const ACTIVE_COLOR: Record<Exclude<ItemState, "UNSET">, string> = {
  NORMAL: colors.statusSuccess,
  CAUTION: colors.statusCaution,
  URGENT: colors.statusUrgent,
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
  row: { flexDirection: "row", gap: 8, marginTop: 8 },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.input,
    backgroundColor: colors.backgroundSubtle,
    alignItems: "center",
  },
  label: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
  labelActive: { color: "#FFFFFF" },
});
