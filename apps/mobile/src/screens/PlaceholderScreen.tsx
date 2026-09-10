import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/tokens";

export function PlaceholderScreen({ title }: { title: string }) {
  return (
    <View style={styles.screen}>
      <Text style={styles.text}>{title} 화면 준비 중</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" },
  text: { color: colors.textSecondary, fontSize: 15 },
});
