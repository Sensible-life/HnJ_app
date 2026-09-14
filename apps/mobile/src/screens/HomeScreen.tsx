import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBadge, StatusTone } from "../components/StatusBadge";
import { colors, layout, radius, spacing, font } from "../theme/tokens";
import { hp, moderateScale, wp } from "../theme/responsive";
import { getIssueItems, IssueItemRow, listTodaySessions, LocalSession } from "../lib/db";
import { syncPendingSessions } from "../lib/sync";
import { uploadPendingMedia } from "../lib/mediaSync";

type NavigateFn = (name: string, params?: object) => void;

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
}

// FR-홈: "주의 필요" 섹션 — 오늘의 목업 데이터 대신 실제 주의/긴급 항목(getIssueItems)을 보여준다.
function issueTitle(item: IssueItemRow) {
  return `${item.hotel_name} ${item.room_label} · ${item.item_name}`;
}

function issueDetail(item: IssueItemRow) {
  if (item.problem_description) return item.problem_description;
  if (item.photo_count > 0) return `증빙 사진 ${item.photo_count}장 등록됨`;
  return item.state === "URGENT" ? "긴급 확인 필요" : "주의 확인 필요";
}

// FR-홈: "오늘 객실" 섹션 — 오늘 시작된 로컬 세션(listTodaySessions)을 상태별로 표시.
function sessionStatusLabel(session: LocalSession): { label: string; tone: StatusTone } {
  if (session.status === "IN_PROGRESS") return { label: "진행 중", tone: "caution" };
  if (session.synced === 0) return { label: "동기화 대기", tone: "urgent" };
  return { label: "완료", tone: "success" };
}

export function HomeScreen({ navigation }: { navigation: { navigate: NavigateFn } }) {
  const insets = useSafeAreaInsets();
  const [todaySessions, setTodaySessions] = useState<LocalSession[]>([]);
  const [issues, setIssues] = useState<IssueItemRow[]>([]);
  const [syncing, setSyncing] = useState(false);

  const today = new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date());

  const load = useCallback(async () => {
    const [sessions, issueRows] = await Promise.all([listTodaySessions(), getIssueItems()]);
    setTodaySessions(sessions);
    setIssues(issueRows);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleSync() {
    setSyncing(true);
    try {
      const [sessionResult, mediaResult] = await Promise.all([syncPendingSessions(), uploadPendingMedia()]);
      await load();
      if (sessionResult.synced === 0 && mediaResult.uploaded === 0) {
        Alert.alert("동기화", "동기화할 새 항목이 없어요.");
      } else {
        Alert.alert(
          "동기화 완료",
          `점검 ${sessionResult.synced}건, 사진/동영상 ${mediaResult.uploaded}건을 서버로 전송했어요.`,
        );
      }
    } catch {
      Alert.alert("동기화 실패", "네트워크 연결을 확인한 뒤 다시 시도해주세요.");
    } finally {
      setSyncing(false);
    }
  }

  function handleResumeSession(session: LocalSession) {
    if (session.status !== "IN_PROGRESS") {
      Alert.alert(
        session.synced === 0 ? "동기화 대기" : "점검 완료됨",
        session.synced === 0
          ? "이미 완료된 점검이에요. 네트워크 연결 시 자동으로 서버에 전송돼요."
          : "이미 완료되어 서버에 전송된 점검이에요.",
      );
      return;
    }
    navigation.navigate("Inspection", {
      resume: {
        id: session.id,
        roomLabel: session.room_label,
        hotelName: session.hotel_name,
        type: session.type,
      },
    });
  }

  const completedCount = todaySessions.filter((s) => s.status === "COMPLETED").length;
  const inProgress = todaySessions.filter((s) => s.status === "IN_PROGRESS");
  const pendingSyncCount = todaySessions.filter((s) => s.status === "COMPLETED" && s.synced === 0).length;
  const progressPercent = todaySessions.length > 0 ? Math.round((completedCount / todaySessions.length) * 100) : 0;

  const summary = [
    { label: "완료 객실", value: String(completedCount), meta: `${todaySessions.length}개 중`, tone: "primary" as const },
    {
      label: "진행 중",
      value: String(inProgress.length),
      meta: inProgress[0]?.room_label ?? "-",
      tone: "amber" as const,
    },
    { label: "동기화 대기", value: String(pendingSyncCount), meta: "오프라인 저장", tone: "coral" as const },
  ];

  const sortedIssues = [...issues].sort((a, b) => (a.state === b.state ? 0 : a.state === "URGENT" ? -1 : 1));
  const topIssues = sortedIssues.slice(0, 3);

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
          <Text style={styles.subheader}>{today}</Text>
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
            <Text style={styles.progressValue}>
              {completedCount} / {todaySessions.length}
            </Text>
          </View>
          <Text style={styles.progressPercent}>{progressPercent}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>
        <View style={styles.summaryRow}>
          {summary.map((item) => (
            <View key={item.label} style={styles.summaryItem}>
              <View style={[styles.summaryMarker, styles[`${item.tone}Marker`]]} />
              <Text style={styles.summaryValue}>{item.value}</Text>
              <Text style={styles.summaryLabel}>{item.label}</Text>
              <Text style={styles.summaryMeta}>{item.meta}</Text>
            </View>
          ))}
        </View>
      </View>

      {inProgress[0] ? (
        <TouchableOpacity style={styles.nextCard} onPress={() => handleResumeSession(inProgress[0])}>
          <View style={styles.nextCopy}>
            <Text style={styles.nextLabel}>진행 중인 점검</Text>
            <Text style={styles.nextRoom}>{inProgress[0].room_label}</Text>
            <Text style={styles.nextMeta}>
              {inProgress[0].hotel_name} · {inProgress[0].type === "BATH_PRO" ? "BATH PRO" : "ROOM PRO"}
            </Text>
          </View>
          <View style={styles.startButton}>
            <Text style={styles.startButtonText}>이어하기</Text>
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.nextCard} onPress={() => navigation.navigate("Inspection")}>
          <View style={styles.nextCopy}>
            <Text style={styles.nextLabel}>새 점검</Text>
            <Text style={styles.nextRoom}>체크인하기</Text>
            <Text style={styles.nextMeta}>QR 스캔 또는 수동 선택으로 시작</Text>
          </View>
          <View style={styles.startButton}>
            <Text style={styles.startButtonText}>시작</Text>
          </View>
        </TouchableOpacity>
      )}

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate("Inspection")}>
          <Text style={styles.quickIcon}>QR</Text>
          <Text style={styles.quickTitle}>체크인</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction} onPress={() => Alert.alert("NFC", "NFC 체크인은 준비 중이에요.")}>
          <Text style={styles.quickIcon}>NF</Text>
          <Text style={styles.quickTitle}>NFC</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction} onPress={handleSync} disabled={syncing}>
          <Text style={styles.quickIcon}>UP</Text>
          <Text style={styles.quickTitle}>{syncing ? "동기화 중..." : "동기화"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>주의 필요</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Reports")}>
          <Text style={styles.sectionCount}>{issues.length}건</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.alertList}>
        {topIssues.length === 0 ? (
          <View style={styles.alertEmpty}>
            <Text style={styles.alertEmptyText}>주의/긴급으로 표시된 항목이 없어요</Text>
          </View>
        ) : (
          topIssues.map((issue, i) => (
            <TouchableOpacity
              key={issue.id}
              style={[styles.alertRow, i > 0 && styles.rowBorder]}
              onPress={() => navigation.navigate("Reports")}
            >
              <View style={[styles.alertBar, issue.state === "URGENT" ? styles.alertUrgent : styles.alertCaution]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.alertTitle}>{issueTitle(issue)}</Text>
                <Text style={styles.alertDetail}>{issueDetail(issue)}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>오늘 객실</Text>
        <Text style={styles.sectionLink}>{todaySessions.length}건 · 아래에 전체 표시</Text>
      </View>
      <View style={styles.roomList}>
        {todaySessions.length === 0 ? (
          <View style={styles.alertEmpty}>
            <Text style={styles.alertEmptyText}>오늘 시작한 점검이 아직 없어요</Text>
          </View>
        ) : (
          todaySessions.map((session, i) => {
            const status = sessionStatusLabel(session);
            return (
              <TouchableOpacity
                key={session.id}
                style={[styles.roomRow, i > 0 && styles.rowBorder]}
                onPress={() => handleResumeSession(session)}
              >
                <View style={styles.roomLead}>
                  <View style={styles.roomTime}>
                    <Text style={styles.roomTimeText}>{formatTime(session.started_at)}</Text>
                  </View>
                  <View>
                    <Text style={styles.roomTitle}>
                      {session.hotel_name} · {session.room_label}
                    </Text>
                    <Text style={styles.roomMeta}>{session.type === "BATH_PRO" ? "BATH PRO" : "ROOM PRO"} 점검</Text>
                  </View>
                </View>
                <StatusBadge label={status.label} tone={status.tone} />
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.backgroundSubtle },
  content: { paddingHorizontal: layout.screenPaddingH },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  eyebrow: {
    fontSize: font.xs,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: moderateScale(3),
  },
  header: {
    fontSize: font.xxl,
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
    backgroundColor: colors.card,
    paddingHorizontal: moderateScale(9),
    paddingVertical: moderateScale(6),
    borderRadius: radius.pill,
  },
  syncDot: {
    width: moderateScale(7),
    height: moderateScale(7),
    borderRadius: moderateScale(4),
    backgroundColor: colors.statusSuccess,
  },
  syncText: { fontSize: font.xs, fontWeight: "600", color: colors.textPrimary },
  progressCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  progressTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  progressLabel: {
    fontSize: font.sm,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  progressValue: {
    fontSize: font.xxl,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: moderateScale(2),
  },
  progressPercent: {
    fontSize: font.lg,
    fontWeight: "700",
    color: colors.primary,
  },
  progressTrack: {
    height: moderateScale(7),
    borderRadius: radius.pill,
    backgroundColor: colors.backgroundSubtle,
    overflow: "hidden",
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  progressFill: {
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
    fontSize: font.xl,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  summaryLabel: {
    fontSize: font.xs,
    fontWeight: "600",
    color: colors.textPrimary,
    marginTop: moderateScale(2),
  },
  summaryMeta: {
    fontSize: font.xs,
    color: colors.textSecondary,
    marginTop: moderateScale(2),
  },
  nextCard: {
    minHeight: moderateScale(104),
    backgroundColor: colors.navActiveBg,
    borderWidth: 1,
    borderColor: colors.navActiveBg,
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  nextCopy: { flex: 1, minWidth: 0 },
  nextLabel: { fontSize: font.sm, fontWeight: "600", color: "#CBD5E1" },
  nextRoom: {
    fontSize: font.display,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: moderateScale(2),
  },
  nextMeta: {
    fontSize: font.sm,
    color: "#CBD5E1",
    marginTop: moderateScale(4),
  },
  startButton: {
    width: wp(18),
    maxWidth: moderateScale(76),
    minWidth: moderateScale(62),
    height: moderateScale(40),
    borderRadius: radius.pill,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  startButtonText: {
    fontSize: font.base,
    fontWeight: "700",
    color: colors.navActiveBg,
  },
  quickActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  quickAction: {
    flex: 1,
    minHeight: moderateScale(60),
    borderRadius: radius.card,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    gap: moderateScale(5),
  },
  quickIcon: { fontSize: font.xs, fontWeight: "700", color: colors.primary },
  quickTitle: {
    fontSize: font.sm,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: font.lg,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  sectionCount: {
    fontSize: font.sm,
    fontWeight: "700",
    color: colors.statusUrgent,
  },
  sectionLink: { fontSize: font.sm, fontWeight: "600", color: colors.primary },
  alertList: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  alertEmpty: {
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  alertEmptyText: {
    fontSize: font.sm,
    color: colors.textSecondary,
  },
  alertRow: {
    minHeight: moderateScale(62),
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  alertBar: {
    width: moderateScale(4),
    height: moderateScale(34),
    borderRadius: radius.pill,
  },
  alertUrgent: { backgroundColor: colors.statusUrgent },
  alertCaution: { backgroundColor: colors.accentAmber },
  alertTitle: {
    fontSize: font.base,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  alertDetail: {
    fontSize: font.xs,
    color: colors.textSecondary,
    marginTop: moderateScale(3),
  },
  roomList: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    paddingHorizontal: spacing.md,
  },
  roomRow: {
    minHeight: moderateScale(64),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.borderSubtle },
  roomLead: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  roomTime: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: radius.input,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  roomTimeText: { fontSize: font.xs, fontWeight: "700", color: colors.primary },
  roomTitle: {
    fontSize: font.base,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  roomMeta: {
    fontSize: font.xs,
    color: colors.textSecondary,
    marginTop: moderateScale(2),
  },
});
