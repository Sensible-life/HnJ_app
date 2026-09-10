import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { StatCard } from "../components/StatCard";
import { StatusBadge } from "../components/StatusBadge";
import { colors, radius, spacing, shadow, font } from "../theme/tokens";
import { hp, moderateScale } from "../theme/responsive";

const TASKS = [
  { room: "804호", hotel: "그랜드 워커힐", status: "urgent" as const, label: "긴급" },
  { room: "1005호", hotel: "롯데 서울", status: "caution" as const, label: "주의" },
  { room: "302호", hotel: "신라 부산", status: "success" as const, label: "완료" },
];

export function HomeScreen({ navigation }: { navigation: { navigate: (name: string) => void } }) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.header}>오늘의 할 일</Text>
      <Text style={styles.subheader}>2026년 9월 10일 · 목요일</Text>

      <View style={styles.statRow}>
        <StatCard label="점검 예정" value="8건" icon="◷" />
        <StatCard label="완료" value="3건" icon="✓" />
        <StatCard label="긴급" value="1건" icon="!" />
      </View>

      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("Inspection")}>
        <Text style={styles.cardTitle}>퀵 체크인 →</Text>
        <Text style={styles.cardHint}>QR 스캔 또는 NFC 태깅으로 바로 시작하세요</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>진행 중 / 최근 점검</Text>
      <View style={styles.card}>
        {TASKS.map((t, i) => (
          <View key={i} style={[styles.taskRow, i > 0 && styles.taskRowBorder]}>
            <View>
              <Text style={styles.taskRoom}>{t.hotel} · {t.room}</Text>
              <Text style={styles.taskHint}>ROOM PRO 점검</Text>
            </View>
            <StatusBadge label={t.label} tone={t.status} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: hp(15) },
  header: { fontSize: font.display, fontWeight: "700", color: colors.textPrimary },
  subheader: { fontSize: font.base, color: colors.textSecondary, marginTop: moderateScale(2), marginBottom: spacing.lg },
  statRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  cardTitle: { fontSize: font.lg, fontWeight: "700", color: colors.textPrimary },
  cardHint: { fontSize: font.sm, color: colors.textSecondary, marginTop: moderateScale(4) },
  sectionTitle: { fontSize: font.xl, fontWeight: "700", color: colors.textPrimary, marginBottom: spacing.sm },
  taskRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: moderateScale(12) },
  taskRowBorder: { borderTopWidth: 1, borderTopColor: colors.backgroundSubtle },
  taskRoom: { fontSize: font.base, fontWeight: "600", color: colors.textPrimary },
  taskHint: { fontSize: font.xs, color: colors.textSecondary, marginTop: moderateScale(2) },
});
