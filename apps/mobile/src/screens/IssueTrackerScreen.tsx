import { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing, shadow, font } from "../theme/tokens";
import { moderateScale } from "../theme/responsive";
import { getIssueItems, IssueItemRow } from "../lib/db";

// IA "이슈 트래커": 주의/긴급 항목의 수리·조치 상태를 진행중/완료/미완료로 추적.
// 서버 DB(Prisma) 연동 전까지는 로컬 SQLite에 쌓인 항목을 기준으로 상태를 근사한다:
//  - 미완료: 수리 정보(자재/비용) 미입력
//  - 진행중: 수리 정보는 있으나 재방문일 미확정
//  - 완료: 수리 정보 + 재방문일까지 모두 입력됨
type TrackStatus = "미완료" | "진행중" | "완료";

function deriveStatus(item: IssueItemRow): TrackStatus {
  const hasRepairInfo = Boolean(item.repair_material || item.repair_cost);
  if (!hasRepairInfo) return "미완료";
  if (!item.revisit_date) return "진행중";
  return "완료";
}

const STATUS_COLOR: Record<TrackStatus, { fg: string; bg: string }> = {
  미완료: { fg: colors.statusUrgent, bg: colors.statusUrgentBg },
  진행중: { fg: colors.statusCaution, bg: colors.statusCautionBg },
  완료: { fg: colors.statusSuccess, bg: colors.statusSuccessBg },
};

export function IssueTrackerScreen() {
  const insets = useSafeAreaInsets();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- 탭 내비게이터 params 타입은 InspectionFlow에서 관리
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<IssueItemRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const rows = await getIssueItems();
    setItems(rows);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xl },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListHeaderComponent={
          <>
            <Text style={styles.header}>이슈 트래커</Text>
            <Text style={styles.subheader}>주의/긴급 항목의 조치 상태를 확인하세요</Text>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>주의/긴급으로 표시된 항목이 없어요</Text>
          </View>
        }
        renderItem={({ item }) => {
          const status = deriveStatus(item);
          const color = STATUS_COLOR[status];
          // FR-이슈트래커: 항목을 탭하면 그 항목이 속한 점검 세션(ROOM PRO/BATH PRO)을 이어서 열어
          // 문제/조치 내용, 수리 정보, 호텔 승인 필요 여부 등을 바로 수정할 수 있게 한다.
          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.7}
              onPress={() =>
                navigation.navigate("Inspection", {
                  resume: {
                    id: item.session_id,
                    roomLabel: item.room_label,
                    hotelName: item.hotel_name,
                    type: item.session_type,
                  },
                })
              }
            >
              <View style={styles.cardTop}>
                <Text style={styles.roomLabel}>
                  {item.hotel_name} · {item.room_label}
                  {item.session_type === "BATH_PRO" ? " (BATH PRO)" : ""}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: color.bg }]}>
                  <Text style={[styles.statusBadgeText, { color: color.fg }]}>{status}</Text>
                </View>
              </View>
              <View style={styles.itemNameRow}>
                <Text style={styles.itemName}>{item.item_name}</Text>
                {item.requires_hotel_approval === 1 && (
                  <View style={styles.approvalBadge}>
                    <Text style={styles.approvalBadgeText}>호텔 승인 필요</Text>
                  </View>
                )}
              </View>
              <Text style={styles.stateHint}>
                {item.state === "URGENT" ? "🚨 긴급" : item.state === "CAUTION" ? "⚠️ 주의" : item.state} · 사진{" "}
                {item.photo_count}장
              </Text>
              {(item.problem_description || item.action_description || item.issue_type) && (
                <View style={styles.repairRow}>
                  {item.issue_type && <Text style={styles.repairText}>유형: {item.issue_type}</Text>}
                  {item.problem_description && (
                    <Text style={styles.repairText}>문제: {item.problem_description}</Text>
                  )}
                  {item.action_description && <Text style={styles.repairText}>조치: {item.action_description}</Text>}
                </View>
              )}
              {(item.repair_material || item.repair_cost || item.revisit_date) && (
                <View style={styles.repairRow}>
                  {item.repair_material && <Text style={styles.repairText}>자재: {item.repair_material}</Text>}
                  {item.repair_cost != null && (
                    <Text style={styles.repairText}>비용: {item.repair_cost.toLocaleString("ko-KR")}원</Text>
                  )}
                  {item.revisit_date && <Text style={styles.repairText}>재방문: {item.revisit_date}</Text>}
                </View>
              )}
              <Text style={styles.openHint}>점검 이어서 열기 ›</Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg },
  header: { fontSize: font.xxl, fontWeight: "700", color: colors.textPrimary },
  subheader: { fontSize: font.sm, color: colors.textSecondary, marginTop: moderateScale(4), marginBottom: spacing.lg },
  emptyBox: { paddingVertical: spacing.xl, alignItems: "center" },
  emptyText: { color: colors.textSecondary, fontSize: font.sm },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  roomLabel: { fontSize: font.xs, color: colors.textSecondary, fontWeight: "600" },
  statusBadge: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: moderateScale(3) },
  statusBadgeText: { fontSize: font.xs, fontWeight: "700" },
  itemNameRow: { flexDirection: "row", alignItems: "center", gap: moderateScale(6), marginTop: moderateScale(6) },
  itemName: { fontSize: font.base, fontWeight: "700", color: colors.textPrimary },
  approvalBadge: {
    backgroundColor: colors.statusUrgentBg,
    borderRadius: radius.pill,
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(2),
  },
  approvalBadgeText: { fontSize: font.xs, fontWeight: "700", color: colors.statusUrgent },
  stateHint: { fontSize: font.xs, color: colors.textSecondary, marginTop: moderateScale(4) },
  repairRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.backgroundSubtle,
    gap: moderateScale(2),
  },
  repairText: { fontSize: font.xs, color: colors.textPrimary },
  openHint: { fontSize: font.xs, color: colors.primary, fontWeight: "600", marginTop: spacing.sm, textAlign: "right" },
});
