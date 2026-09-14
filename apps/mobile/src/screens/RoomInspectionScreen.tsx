import { useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, TextInput, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { colors, radius, spacing, shadow, font } from "../theme/tokens";
import { hp, moderateScale } from "../theme/responsive";
import { ThreeStateToggle, ItemState } from "../components/ThreeStateToggle";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getItemsForSession,
  updateItemState,
  updateItemProblemInfo,
  updateSessionOpinion,
  completeSession,
  insertMedia,
  createSession,
  insertItems,
  getSession,
  LocalItem,
  LocalSession,
} from "../lib/db";
import { BathProSheet } from "../components/BathProSheet";
import { BathProInspectionScreen } from "./BathProInspectionScreen";
import { BATH_PRO_ITEMS } from "../data/inspectionItems";
import { syncPendingSessions } from "../lib/sync";
import { uploadPendingMedia } from "../lib/mediaSync";

type Props = {
  sessionId: string;
  roomLabel: string;
  hotelName: string;
  onDone: () => void;
};

export function RoomInspectionScreen({ sessionId, roomLabel, hotelName, onDone }: Props) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<LocalItem[]>([]);
  const [session, setSession] = useState<LocalSession | null>(null);
  const [opinion, setOpinion] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bathSheetVisible, setBathSheetVisible] = useState(false);
  const [bathSession, setBathSession] = useState<{ id: string } | null>(null);

  const load = useCallback(async () => {
    const [rows, sessionRow] = await Promise.all([getItemsForSession(sessionId), getSession(sessionId)]);
    setItems(rows);
    if (sessionRow) {
      setSession(sessionRow);
      setOpinion((prev) => prev || sessionRow.inspector_opinion || "");
    }
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  const completedCount = items.filter((i) => i.state !== "UNSET").length;

  async function handleStateChange(item: LocalItem, state: ItemState) {
    if (state === "URGENT") {
      // FR-INSP-03: 긴급 선택 시 카메라 자동 호출, 최소 1장 등록 강제
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("카메라 권한 필요", "긴급 항목은 증빙 사진이 필수입니다.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
      if (result.canceled) {
        Alert.alert("사진 필요", "긴급 항목은 최소 1장의 사진이 필요합니다.");
        return;
      }
      const asset = result.assets[0];
      await insertMedia({
        id: `media_${Date.now()}`,
        item_id: item.id,
        session_id: sessionId,
        local_uri: asset.uri,
        media_type: "GENERAL",
        hotel_name: hotelName,
        room_label: roomLabel,
        captured_at: new Date().toISOString(),
      });
      const newPhotoCount = item.photo_count + 1;
      await updateItemState(item.id, state, newPhotoCount);
    } else {
      await updateItemState(item.id, state);
    }
    await load();

    // FR-INSP-04: '화장실' 항목(room-03)이 주의/긴급으로 표시되면 BATH PRO 진입 시트를 띄운다.
    if (item.item_def_id === "room-03" && (state === "CAUTION" || state === "URGENT")) {
      setBathSheetVisible(true);
    }
  }

  async function handleOpenBathPro() {
    const bathSessionId = `sess_${Date.now()}_bath`;
    const now = new Date().toISOString();
    await createSession({
      id: bathSessionId,
      parent_session_id: sessionId,
      hotel_name: hotelName,
      room_label: roomLabel,
      type: "BATH_PRO",
      status: "IN_PROGRESS",
      checkin_method: "MANUAL",
      gps_lat: null,
      gps_lng: null,
      started_at: now,
      completed_at: null,
      inspector_name: session?.inspector_name ?? null,
      service_type: session?.service_type ?? null,
      inspector_opinion: null,
    });
    await insertItems(
      BATH_PRO_ITEMS.map((def) => ({
        id: `${bathSessionId}_${def.id}`,
        session_id: bathSessionId,
        item_def_id: def.id,
        item_name: def.name,
        state: "UNSET",
        comment: null,
        photo_count: 0,
        repair_material: null,
        repair_cost: null,
        revisit_date: null,
        problem_description: null,
        action_description: null,
        requires_hotel_approval: 0,
      })),
    );
    setBathSheetVisible(false);
    setBathSession({ id: bathSessionId });
  }

  // FR: docs/FEATURE_SCOPE.md 우선순위 A — 문제 내용/조치 내용/호텔 승인 필요 여부
  async function handleProblemInfoChange(
    item: LocalItem,
    patch: Partial<{ problem_description: string | null; action_description: string | null; requires_hotel_approval: number }>,
  ) {
    const next = {
      problemDescription: patch.problem_description !== undefined ? patch.problem_description : item.problem_description,
      actionDescription: patch.action_description !== undefined ? patch.action_description : item.action_description,
      requiresHotelApproval:
        patch.requires_hotel_approval !== undefined ? patch.requires_hotel_approval === 1 : item.requires_hotel_approval === 1,
    };
    setItems((prev) =>
      prev.map((it) =>
        it.id === item.id
          ? {
              ...it,
              problem_description: next.problemDescription,
              action_description: next.actionDescription,
              requires_hotel_approval: next.requiresHotelApproval ? 1 : 0,
            }
          : it,
      ),
    );
    await updateItemProblemInfo(item.id, next);
  }

  function handleOpinionChange(text: string) {
    setOpinion(text);
    updateSessionOpinion(sessionId, text || null);
  }

  async function handleSaveDraft() {
    Alert.alert("임시 저장됨", "점검 내용이 기기에 저장되었습니다. 네트워크 연결 시 자동 동기화됩니다.");
  }

  async function handleComplete() {
    if (completedCount < items.length) {
      Alert.alert("점검 미완료", "모든 항목을 점검해주세요.");
      return;
    }
    setSaving(true);
    try {
      await updateSessionOpinion(sessionId, opinion || null);
      await completeSession(sessionId, new Date().toISOString());
      const [result] = await Promise.all([syncPendingSessions(), uploadPendingMedia()]);
      if (result.synced > 0) {
        Alert.alert("완료", "점검이 완료되어 서버에 리포트가 생성되었습니다.");
      } else {
        Alert.alert("완료 (오프라인)", "네트워크 연결 시 자동으로 서버에 동기화됩니다.");
      }
      onDone();
    } finally {
      setSaving(false);
    }
  }

  if (bathSession) {
    return (
      <BathProInspectionScreen
        sessionId={bathSession.id}
        roomLabel={roomLabel}
        hotelName={hotelName}
        onDone={() => setBathSession(null)}
      />
    );
  }

  if (loading) return <View style={styles.screen} />;

  const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + hp(17) },
        ]}
      >
        <Text style={styles.header}>{roomLabel} 점검 진행 중</Text>
        <Text style={styles.subheader}>
          {completedCount}/{items.length} · {progress}% 완료
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        {items.map((item, idx) => {
          const needsProblemInfo = item.state === "CAUTION" || item.state === "URGENT";
          return (
            <View key={item.id} style={styles.itemCard}>
              <Text style={styles.itemTitle}>
                {idx + 1}. {item.item_name}
              </Text>
              <ThreeStateToggle
                value={item.state}
                onChange={(state) => handleStateChange(item, state)}
              />
              {item.state === "URGENT" && (
                <Text style={styles.photoHint}>📷 사진 {item.photo_count}장 등록됨</Text>
              )}

              {needsProblemInfo && (
                <View style={styles.problemBlock}>
                  <Text style={styles.problemLabel}>문제 내용</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="예: 벽지 오염 발견"
                    placeholderTextColor={colors.textSecondary}
                    value={item.problem_description ?? ""}
                    onChangeText={(v) => handleProblemInfoChange(item, { problem_description: v || null })}
                  />

                  <Text style={styles.problemLabel}>조치 내용</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="예: 도배 재시공 예정"
                    placeholderTextColor={colors.textSecondary}
                    value={item.action_description ?? ""}
                    onChangeText={(v) => handleProblemInfoChange(item, { action_description: v || null })}
                  />

                  <TouchableOpacity
                    style={[styles.approvalToggle, item.requires_hotel_approval === 1 && styles.approvalToggleActive]}
                    onPress={() =>
                      handleProblemInfoChange(item, {
                        requires_hotel_approval: item.requires_hotel_approval === 1 ? 0 : 1,
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.approvalToggleText,
                        item.requires_hotel_approval === 1 && styles.approvalToggleTextActive,
                      ]}
                    >
                      {item.requires_hotel_approval === 1 ? "✓ 호텔 승인 필요" : "호텔 승인 필요로 표시"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}

        <View style={styles.opinionBlock}>
          <Text style={styles.problemLabel}>담당자 의견 (선택)</Text>
          <TextInput
            style={[styles.input, styles.opinionInput]}
            placeholder="점검 총평이나 특이사항을 입력하세요"
            placeholderTextColor={colors.textSecondary}
            value={opinion}
            onChangeText={handleOpinionChange}
            multiline
          />
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <TouchableOpacity style={styles.draftButton} onPress={handleSaveDraft}>
          <Text style={styles.draftButtonText}>임시 저장</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.completeButton} onPress={handleComplete} disabled={saving}>
          <Text style={styles.completeButtonText}>{saving ? "처리 중..." : "리포트 생성 및 완료"}</Text>
        </TouchableOpacity>
      </View>

      <BathProSheet
        visible={bathSheetVisible}
        roomLabel={roomLabel}
        onExecute={handleOpenBathPro}
        onClose={() => setBathSheetVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg },
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
  photoHint: { marginTop: spacing.sm, fontSize: font.xs, color: colors.statusUrgent },
  problemBlock: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.backgroundSubtle,
  },
  problemLabel: {
    fontSize: font.xs,
    fontWeight: "600",
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: moderateScale(4),
  },
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
  approvalToggle: {
    marginTop: spacing.sm,
    paddingVertical: moderateScale(10),
    borderRadius: radius.input,
    backgroundColor: colors.backgroundSubtle,
    alignItems: "center",
  },
  approvalToggleActive: { backgroundColor: colors.statusUrgentBg },
  approvalToggleText: { fontSize: font.xs, fontWeight: "600", color: colors.textSecondary },
  approvalToggleTextActive: { color: colors.statusUrgent },
  opinionBlock: { marginBottom: spacing.md },
  opinionInput: { minHeight: moderateScale(80), textAlignVertical: "top" },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.backgroundSubtle,
  },
  draftButton: {
    flex: 1,
    paddingVertical: moderateScale(14),
    borderRadius: radius.pill,
    backgroundColor: colors.backgroundSubtle,
    alignItems: "center",
  },
  draftButtonText: { fontWeight: "700", color: colors.textPrimary },
  completeButton: {
    flex: 2,
    paddingVertical: moderateScale(14),
    borderRadius: radius.pill,
    backgroundColor: colors.navActiveBg,
    alignItems: "center",
  },
  completeButtonText: { fontWeight: "700", color: "#FFFFFF" },
});
