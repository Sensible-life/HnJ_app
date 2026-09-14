import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBadge } from "../components/StatusBadge";
import { colors, layout, radius, spacing, shadow, font } from "../theme/tokens";
import { hp, moderateScale, wp } from "../theme/responsive";

const SUMMARY = [
  { label: "남은 객실", value: "8", meta: "12개 중", tone: "primary" as const },
  { label: "진행 중", value: "1", meta: "804호", tone: "amber" as const },
  {
    label: "동기화 대기",
    value: "2",
    meta: "오프라인 저장",
    tone: "coral" as const,
  },
];

const ALERTS = [
  {
    title: "804호 욕실 항목 긴급",
    detail: "증빙 사진 1장 등록됨 · 승인 대기",
    tone: "urgent" as const,
  },
  {
    title: "701호 점검 기록 동기화 대기",
    detail: "네트워크 연결 시 자동 전송",
    tone: "caution" as const,
  },
];

const ROOM_QUEUE = [
  {
    room: "804호",
    floor: "8F",
    time: "09:20",
    status: "진행 중",
    tone: "caution" as const,
  },
  {
    room: "805호",
    floor: "8F",
    time: "다음",
    status: "예정",
    tone: "caution" as const,
  },
  {
    room: "806호",
    floor: "8F",
    time: "10:10",
    status: "예정",
    tone: "caution" as const,
  },
  {
    room: "701호",
    floor: "7F",
    time: "완료",
    status: "저장됨",
    tone: "success" as const,
  },
];

export function HomeScreen({
  navigation,
}: {
  navigation: { navigate: (name: string) => void };
}) {
  const insets = useSafeAreaInsets();
  const today = new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date());

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + spacing.lg,
          paddingBottom: insets.bottom + hp(15),
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.eyebrow}>ROOM PRO</Text>
          <Text style={styles.header}>오늘의 점검</Text>
          <Text style={styles.subheader}>{today} · 그랜드 워커힐 8F</Text>
        </View>
        <View style={styles.syncBadge}>
          <View style={styles.syncDot} />
          <Text style={styles.syncText}>온라인</Text>
        </View>
      </View>

      <View style={styles.progressCard}>
        <View style={styles.progressTop}>
          <View>
            <Text style={styles.progressLabel}>오늘 진행률</Text>
            <Text style={styles.progressValue}>4 / 12</Text>
          </View>
          <Text style={styles.progressPercent}>33%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>
        <View style={styles.summaryRow}>
          {SUMMARY.map((item) => (
            <View key={item.label} style={styles.summaryItem}>
              <View
                style={[styles.summaryMarker, styles[`${item.tone}Marker`]]}
              />
              <Text style={styles.summaryValue}>{item.value}</Text>
              <Text style={styles.summaryLabel}>{item.label}</Text>
              <Text style={styles.summaryMeta}>{item.meta}</Text>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={styles.nextCard}
        onPress={() => navigation.navigate("Inspection")}
      >
        <View style={styles.nextCopy}>
          <Text style={styles.nextLabel}>다음 점검</Text>
          <Text style={styles.nextRoom}>805호</Text>
          <Text style={styles.nextMeta}>8F · ROOM PRO · 예상 7분</Text>
        </View>
        <View style={styles.startButton}>
          <Text style={styles.startButtonText}>시작</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => navigation.navigate("Inspection")}
        >
          <Text style={styles.quickIcon}>QR</Text>
          <Text style={styles.quickTitle}>체크인</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <Text style={styles.quickIcon}>NF</Text>
          <Text style={styles.quickTitle}>NFC</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <Text style={styles.quickIcon}>UP</Text>
          <Text style={styles.quickTitle}>동기화</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>주의 필요</Text>
        <Text style={styles.sectionCount}>2건</Text>
      </View>
      <View style={styles.alertList}>
        {ALERTS.map((alert, i) => (
          <TouchableOpacity
            key={alert.title}
            style={[styles.alertRow, i > 0 && styles.rowBorder]}
          >
            <View
              style={[
                styles.alertBar,
                alert.tone === "urgent"
                  ? styles.alertUrgent
                  : styles.alertCaution,
              ]}
            />
            <View>
              <Text style={styles.alertTitle}>{alert.title}</Text>
              <Text style={styles.alertDetail}>{alert.detail}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>오늘 객실</Text>
        <TouchableOpacity>
          <Text style={styles.sectionLink}>전체 보기</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.roomList}>
        {ROOM_QUEUE.map((room, i) => (
          <TouchableOpacity
            key={`${room.floor}-${room.room}`}
            style={[styles.roomRow, i > 0 && styles.rowBorder]}
          >
            <View style={styles.roomLead}>
              <View style={styles.roomTime}>
                <Text style={styles.roomTimeText}>{room.time}</Text>
              </View>
              <View>
                <Text style={styles.roomTitle}>
                  {room.floor} · {room.room}
                </Text>
                <Text style={styles.roomMeta}>ROOM PRO 점검</Text>
              </View>
            </View>
            <StatusBadge label={room.status} tone={room.tone} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: layout.screenPaddingH },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  eyebrow: {
    fontSize: font.xs,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: moderateScale(3),
  },
  header: {
    fontSize: font.display,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  subheader: {
    fontSize: font.base,
    color: colors.textSecondary,
    marginTop: moderateScale(3),
  },
  syncBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
    backgroundColor: colors.backgroundSubtle,
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(7),
    borderRadius: radius.pill,
  },
  syncDot: {
    width: moderateScale(7),
    height: moderateScale(7),
    borderRadius: moderateScale(4),
    backgroundColor: colors.statusSuccess,
  },
  syncText: { fontSize: font.xs, fontWeight: "700", color: colors.textPrimary },
  progressCard: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  progressTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  progressLabel: {
    fontSize: font.sm,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  progressValue: {
    fontSize: font.display,
    fontWeight: "800",
    color: colors.textPrimary,
    marginTop: moderateScale(2),
  },
  progressPercent: {
    fontSize: font.xl,
    fontWeight: "800",
    color: colors.primary,
  },
  progressTrack: {
    height: moderateScale(9),
    borderRadius: radius.pill,
    backgroundColor: colors.backgroundSubtle,
    overflow: "hidden",
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  progressFill: {
    width: "33%",
    height: "100%",
    backgroundColor: colors.primary,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  summaryItem: { flex: 1, minWidth: 0 },
  summaryMarker: {
    width: moderateScale(18),
    height: moderateScale(4),
    borderRadius: radius.pill,
    marginBottom: moderateScale(7),
  },
  primaryMarker: { backgroundColor: colors.primary },
  amberMarker: { backgroundColor: colors.accentAmber },
  coralMarker: { backgroundColor: colors.accentCoral },
  summaryValue: {
    fontSize: font.xxl,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  summaryLabel: {
    fontSize: font.xs,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: moderateScale(2),
  },
  summaryMeta: {
    fontSize: font.xs,
    color: colors.textSecondary,
    marginTop: moderateScale(2),
  },
  nextCard: {
    minHeight: hp(15),
    backgroundColor: colors.navActiveBg,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    ...shadow.card,
  },
  nextCopy: { flex: 1, minWidth: 0 },
  nextLabel: { fontSize: font.sm, fontWeight: "700", color: "#CBD5E1" },
  nextRoom: {
    fontSize: moderateScale(34),
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: moderateScale(2),
  },
  nextMeta: {
    fontSize: font.sm,
    color: "#CBD5E1",
    marginTop: moderateScale(4),
  },
  startButton: {
    width: wp(20),
    maxWidth: moderateScale(86),
    minWidth: moderateScale(68),
    height: moderateScale(46),
    borderRadius: radius.pill,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  startButtonText: {
    fontSize: font.md,
    fontWeight: "800",
    color: colors.navActiveBg,
  },
  quickActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  quickAction: {
    flex: 1,
    minHeight: moderateScale(74),
    borderRadius: radius.card,
    backgroundColor: colors.backgroundSubtle,
    alignItems: "center",
    justifyContent: "center",
    gap: moderateScale(5),
  },
  quickIcon: { fontSize: font.xs, fontWeight: "800", color: colors.primary },
  quickTitle: {
    fontSize: font.sm,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: font.xl,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  sectionCount: {
    fontSize: font.sm,
    fontWeight: "800",
    color: colors.statusUrgent,
  },
  sectionLink: { fontSize: font.sm, fontWeight: "700", color: colors.primary },
  alertList: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  alertRow: {
    minHeight: moderateScale(70),
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  alertBar: {
    width: moderateScale(5),
    height: moderateScale(42),
    borderRadius: radius.pill,
  },
  alertUrgent: { backgroundColor: colors.statusUrgent },
  alertCaution: { backgroundColor: colors.accentAmber },
  alertTitle: {
    fontSize: font.base,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  alertDetail: {
    fontSize: font.xs,
    color: colors.textSecondary,
    marginTop: moderateScale(3),
  },
  roomList: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    paddingHorizontal: spacing.md,
    ...shadow.card,
  },
  roomRow: {
    minHeight: moderateScale(72),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.backgroundSubtle },
  roomLead: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  roomTime: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(16),
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  roomTimeText: { fontSize: font.xs, fontWeight: "800", color: colors.primary },
  roomTitle: {
    fontSize: font.base,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  roomMeta: {
    fontSize: font.xs,
    color: colors.textSecondary,
    marginTop: moderateScale(2),
  },
});
