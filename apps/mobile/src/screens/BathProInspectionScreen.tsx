import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { colors, radius, spacing, shadow, font } from "../theme/tokens";
import { hp, moderateScale } from "../theme/responsive";
import { ThreeStateToggle, ItemState } from "../components/ThreeStateToggle";
import {
  getItemsForSession,
  updateItemState,
  updateItemRepairInfo,
  completeSession,
  insertMedia,
  LocalItem,
} from "../lib/db";
import { syncPendingSessions } from "../lib/sync";
import { uploadPendingMedia } from "../lib/mediaSync";

// FR-INSP-04 연계: BATH PRO 12개 구역 정밀 점검.
// 주의/긴급 항목은 작업 전/중/후 사진(스키마상 BEFORE/GENERAL/AFTER로 매핑)과
// 수리 자재/비용/재방문일 입력을 받는다 (서버 sync 시 IssueTicket 생성 근거 데이터).
type Props = {
  sessionId: string;
  roomLabel: string;
  hotelName: string;
  onDone: () => void;
};

const PHOTO_STAGES: { key: "BEFORE" | "GENERAL" | "AFTER"; label: string }[] = [
  { key: "BEFORE", label: "작업 전" },
  { key: "GENERAL", label: "작업 중" },
  { key: "AFTER", label: "작업 후" },
];

export function BathProInspectionScreen({ sessionId, roomLabel, hotelName, onDone }: Props) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<LocalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const rows = await getItemsForSession(sessionId);
    setItems(rows);
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  const completedCount = items.filter((i) => i.state !== "UNSET").length;
  const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  async function handleStateChange(item: LocalItem, state: ItemState) {
    await updateItemState(item.id, state);
    await load();
  }

  async function handleCapturePhoto(item: LocalItem, stage: "BEFORE" | "GENERAL" | "AFTER") {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("카메라 권한 필요", "증빙 사진 촬영을 위해 카메라 권한이 필요합니다.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (result.canceled) return;
    const asset = result.assets[0];
    await insertMedia({
      id: `media_${Date.now()}`,
      item_id: item.id,
      session_id: sessionId,
      local_uri: asset.uri,
      media_type: stage,
      hotel_name: hotelName,
      room_label: roomLabel,
      captured_at: new Date().toISOString(),
    });
    const newPhotoCount = item.photo_count + 1;
    await updateItemState(item.id, item.state, newPhotoCount);
    await load();
  }

  async function handleRepairInfoChange(
    item: LocalItem,
    field: "repair_material" | "repair_cost" | "revisit_date",
    value: string,
  ) {
    const next = {
      repairMaterial: field === "repair_material" ? value || null : item.repair_material,
      repairCost:
        field === "repair_cost" ? (value ? Number(value.replace(/[^0-9]/g, "")) : null) : item.repair_cost,
      revisitDate: field === "revisit_date" ? value || null : item.revisit_date,
    };
    setItems((prev) =>
      prev.map((it) =>
        it.id === item.id
          ? {
              ...it,
              repair_material: next.repairMaterial,
              repair_cost: next.repairCost,
              revisit_date: next.revisitDate,
            }
          : it,
      ),
    );
    await updateItemRepairInfo(item.id, next);
  }

  async function handleComplete() {
    if (completedCount < items.length) {
      Alert.alert("점검 미완료", "12개 구역을 모두 점검해주세요.");
      return;
    }
    setSaving(true);
    try {
      await completeSession(sessionId, new Date().toISOString());
      const [result] = await Promise.all([syncPendingSessions(), uploadPendingMedia()]);
      if (result.synced > 0) {
        Alert.alert("완료", "BATH PRO 정밀 점검이 완료되어 서버에 반영되었습니다.");
      } else {
        Alert.alert("완료 (오프라인)", "네트워크 연결 시 자동으로 서버에 동기화됩니다.");
      }
      onDone();
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <View style={styles.screen} />;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + hp(17) },
        ]}
      >
        <TouchableOpacity onPress={onDone}>
          <Text style={styles.back}>{"< ROOM PRO로 돌아가기"}</Text>
        </TouchableOpacity>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🛁 BATH PRO</Text>
        </View>
        <Text style={styles.header}>{roomLabel} 화장실 정밀 점검</Text>
        <Text style={styles.subheader}>
          {completedCount}/{items.length} · {progress}% 완료
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        {items.map((item, idx) => {
          const needsRepairInfo = item.state === "CAUTION" || item.state === "URGENT";
          return (
            <View key={item.id} style={styles.itemCard}>
              <Text style={styles.itemTitle}>
                {idx + 1}. {item.item_name}
              </Text>
              <ThreeStateToggle value={item.state} onChange={(state) => handleStateChange(item, state)} />

              {needsRepairInfo && (
                <View style={styles.repairBlock}>
                  <Text style={styles.repairLabel}>증빙 사진 (작업 전/중/후)</Text>
                  <View style={styles.photoRow}>
                    {PHOTO_STAGES.map((stage) => (
                      <TouchableOpacity
                        key={stage.key}
                        style={styles.photoButton}
                        onPress={() => handleCapturePhoto(item, stage.key)}
                      >
                        <Text style={styles.photoButtonText}>📷 {stage.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {item.photo_count > 0 && (
                    <Text style={styles.photoHint}>사진 {item.photo_count}장 등록됨</Text>
                  )}

                  <Text style={styles.repairLabel}>수리 자재</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="예: 실리콘 코킹재"
                    placeholderTextColor={colors.textSecondary}
                    value={item.repair_material ?? ""}
                    onChangeText={(v) => handleRepairInfoChange(item, "repair_material", v)}
                  />

                  <Text style={styles.repairLabel}>예상 비용 (원)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="예: 50000"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="number-pad"
                    value={item.repair_cost != null ? String(item.repair_cost) : ""}
                    onChangeText={(v) => handleRepairInfoChange(item, "repair_cost", v)}
                  />

                  <Text style={styles.repairLabel}>재방문일 (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="예: 2026-09-20"
                    placeholderTextColor={colors.textSecondary}
                    value={item.revisit_date ?? ""}
                    onChangeText={(v) => handleRepairInfoChange(item, "revisit_date", v)}
                  />
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <TouchableOpacity style={styles.completeButton} onPress={handleComplete} disabled={saving}>
          <Text style={styles.completeButtonText}>{saving ? "처리 중..." : "BATH PRO 점검 완료"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg },
  back: { color: colors.primary, fontSize: font.base, marginBottom: spacing.md },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: moderateScale(4),
    marginBottom: spacing.sm,
  },
  badgeText: { color: colors.primary, fontWeight: "700", fontSize: font.xs },
  header: { fontSize: font.xxl, fontWeight: "700", color: colors.textPrimary },
  subheader: { fontSize: font.sm, color: colors.textSecondary, marginTop: moderateScale(4), marginBottom: spacing.sm },
  progressTrack: {
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: colors.backgroundSubtle,
    overflow: "hidden",
    marginBottom: spacing.lg,
  },
  progressFill: { height: "100%", backgroundColor: colors.primary },
  itemCard: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  itemTitle: { fontSize: font.base, fontWeight: "600", color: colors.textPrimary },
  repairBlock: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.backgroundSubtle,
  },
  repairLabel: {
    fontSize: font.xs,
    fontWeight: "600",
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: moderateScale(4),
  },
  photoRow: { flexDirection: "row", gap: moderateScale(8) },
  photoButton: {
    flex: 1,
    paddingVertical: moderateScale(10),
    borderRadius: radius.input,
    backgroundColor: colors.backgroundSubtle,
    alignItems: "center",
  },
  photoButtonText: { fontSize: font.xs, fontWeight: "600", color: colors.textPrimary },
  photoHint: { marginTop: spacing.xs, fontSize: font.xs, color: colors.statusUrgent },
  input: {
    borderWidth: 1,
    borderColor: colors.backgroundSubtle,
    backgroundColor: colors.backgroundSubtle,
    borderRadius: radius.input,
    paddingHorizontal: spacing.sm,
    paddingVertical: Platform.OS === "ios" ? moderateScale(10) : moderateScale(6),
    fontSize: font.sm,
    color: colors.textPrimary,
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.backgroundSubtle,
  },
  completeButton: {
    paddingVertical: moderateScale(14),
    borderRadius: radius.pill,
    backgroundColor: colors.navActiveBg,
    alignItems: "center",
  },
  completeButtonText: { fontWeight: "700", color: "#FFFFFF" },
});
