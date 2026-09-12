import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { colors, radius, shadow, layout, font } from "../theme/tokens";
import { moderateScale } from "../theme/responsive";

const ICONS: Record<string, string> = {
  Home: "⌂",
  Inspection: "☰",
  Reports: "▤",
  Profile: "◐",
};

export function PillTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: insets.bottom + moderateScale(12) }]}>
      <View style={styles.pillContainer}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const { options } = descriptors[route.key];
          const label = (options.title ?? route.name) as string;

          const onPress = () => {
            const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={[styles.tab, isFocused && styles.tabActive]}
            >
              <Text style={[styles.icon, isFocused && styles.iconActive]}>
                {ICONS[route.name] ?? "•"}
              </Text>
              {isFocused && <Text style={styles.labelActive}>{label}</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: layout.bottomNavSideMargin,
    right: layout.bottomNavSideMargin,
    bottom: 0,
  },
  pillContainer: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    padding: moderateScale(6),
    justifyContent: "space-between",
    ...shadow.card,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(14),
    borderRadius: radius.pill,
    flex: 1,
  },
  tabActive: { backgroundColor: colors.navActiveBg },
  icon: { fontSize: font.lg, color: colors.textSecondary },
  iconActive: { color: "#FFFFFF" },
  labelActive: { color: "#FFFFFF", marginLeft: moderateScale(6), fontWeight: "600", fontSize: font.sm },
});
