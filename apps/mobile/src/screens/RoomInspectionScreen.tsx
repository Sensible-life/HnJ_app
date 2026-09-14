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
  updateItemRepairInfo,
  updateItemProblemInfo,
  updateItemIssueType,
  updateSessionOpinion,
  updateSessionOperationsInfo,
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
import { fetchCleaningTeams, ApiCleaningTeam } from "../lib/api";

// FR: docs/FEATURE_SCOPE.md 우선순위 B — 곰팡이/누수/악취 등 문제 유형별 통계
const ISSUE_TYPES = ["곰팡이", "누수", "악취", "파손", "기타"];
// FR: docs/FEATURE_SCOPE.md 우선순위 B — 객실 유형 기록
const ROOM_TYPES = ["스탠다드 더블", "스탠다드 트윈", "디럭스", "스위트"];

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

  // FR: docs/FEATURE_SCOPE.md 우선순위 B — 객실 유형/청소 담당팀·완료시간/분실물
  const [cleaningTeams, setCleaningTeams] = useState<ApiCleaningTeam[]>([]);
  const [roomType, setRoomType] = useState<string | null>(null);
  const [cleaningTeam, setCleaningTeam] = useState<string | null>(null);
  const [cleaningCompletedAt, setCleaningCompletedAt] = useState<string | null>(null);
  const [lostItemFound, setLostItemFound] = useState(false);
  const [lostItemLocation, setLostItemLocation] = useState("");

  const load = useCallback(async () => {
    const [rows, sessionRow] = await Promise.all([getItemsForSession(sessionId), getSession(sessionId)]);
    setItems(rows);
    if (sessionRow) {
      setSession(sessionRow);
      setOpinion((prev) => prev || sessionRow.inspector_opinion || "");
      setRoomType((prev) => prev ?? sessionRow.room_type);
      setCleaningTeam((prev) => prev ?? sessionRow.cleaning_team);
      setCleaningCompletedAt((prev) => prev ?? sessionRow.cleaning_completed_at);
      setLostItemFound((prev) => prev || sessionRow.lost_item_found === 1);
      setLostItemLocation((prev) => prev || sessionRow.lost_item_location || "");
    }
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    load();
    fetchCleaningTeams()
      .then(setCleaningTeams)
      .catch(() => {
        // 서버 미접속 시에도 점검 자체는 계속 진행 가능해야 하므로 조용히 무시
      });
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
        media_kind: "IMAGE",
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
      room_type: session?.room_type ?? null,
      cleaning_team: session?.cleaning_team ?? null,
      cleaning_completed_at: null,
      lost_item_found: 0,
      lost_item_location: null,
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
        issue_type: null,
      })),
    );
    setBathSheetVisible(false);
    setBathSession({ id: bathSessionId });
  }

  // FR: docs/FEATURE_SCOPE.md 우선순위 A/B — 문제 내용/조치 내용/호텔 승인 필요 여부/문제 유형
  async function handleProblemInfoChange(
    item: LocalItem,
    patch: Partial<{
      problem_description: string | null;
      action_description: string | null;
      requires_hotel_approval: number;
      issue_type: string | null;
    }>,
  ) {
    if (patch.issue_type !== undefined) {
      setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, issue_type: patch.issue_type! } : it)));
      await updateItemIssueType(item.id, patch.issue_type);
      return;
    }
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

  // FR: ROOM PRO에서 생긴 문제도 BATH PRO와 동일하게 수리 자재/비용/재방문일을 입력해서
  // "조치 완료" 상태로 넘어갈 수 있도록 한다 (이전에는 이 입력 UI가 BATH PRO 화면에만 있었음).
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

  function handleOpinionChange(text: string) {
    setOpinion(text);
    updateSessionOpinion(sessionId, text || null);
  }

  // FR: docs/FEATURE_SCOPE.md 우선순위 B — 객실 유형/청소 담당팀·완료시간/분실물 저장
  function persistOperationsInfo(patch: {
    roomType?: string | null;
    cleaningTeam?: string | null;
    cleaningCompletedAt?: string | null;
    lostItemFound?: boolean;
    lostItemLocation?: string;
  }) {
    const next = {
      roomType: patch.roomType !== undefined ? patch.roomType : roomType,
      cleaningTeam: patch.cleaningTeam !== undefined ? patch.cleaningTeam : cleaningTeam,
      cleaningCompletedAt: patch.cleaningCompletedAt !== undefined ? patch.cleaningCompletedAt : cleaningCompletedAt,
      lostItemFound: patch.lostItemFound !== undefined ? patch.lostItemFound : lostItemFound,
      lostItemLocation: patch.lostItemLocation !== undefined ? patch.lostItemLocation : lostItemLocation,
    };
    updateSessionOperationsInfo(sessionId, {
      roomType: next.roomType,
      cleaningTeam: next.cleaningTeam,
      cleaningCompletedAt: next.cleaningCompletedAt,
      lostItemFound: next.lostItemFound,
      lostItemLocation: next.lostItemLocation || null,
    });
  }

  function handleRoomTypeSelect(t: string) {
    const next = roomType === t ? null : t;
    setRoomType(next);
    persistOperationsInfo({ roomType: next });
  }

  function handleCleaningTeamSelect(name: string) {
    const next = cleaningTeam === name ? null : name;
    setCleaningTeam(next);
    persistOperationsInfo({ cleaningTeam: next });
  }

  function handleToggleCleaningCompleted() {
    const next = cleaningCompletedAt ? null : new Date().toISOString();
    setCleaningCompletedAt(next);
    persistOperationsInfo({ cleaningCompletedAt: next });
  }

  function handleToggleLostItem() {
    const next = !lostItemFound;
    setLostItemFound(next);
    persistOperationsInfo({ lostItemFound: next });
  }

  function handleLostItemLocationChange(text: string) {
    setLostItemLocation(text);
    persistOperationsInfo({ lostItemLocation: text });
  }

  // FR-IA: 점검 항목은 조작하는 즉시 로컬 SQLite에 저장되므로, "임시 저장"은 사실상
  // "저장하고 체크인 화면으로 나가기"다. 예전에는 알림만 띄우고 화면에 그대로 남아있어
  // 체크인으로 돌아갈 방법이 없었다 — 확인을 누르면 실제로 체크인 화면으로 돌아가도록 수정.
  function handleSaveDraft() {
    Alert.alert(
      "임시 저장됨",
      "점검 내용이 기기에 저장되었습니다. 나중에 홈 화면의 '오늘 객실'에서 이어서 진행할 수 있어요.",
      [{ text: "확인", onPress: onDone }],
    );
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
        <TouchableOpacity onPress={handleSaveDraft}>
          <Text style={styles.back}>{"< 임시 저장하고 체크인으로 돌아가기"}</Text>
        </TouchableOpacity>
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
                  <Text style={styles.problemLabel}>문제 유형</Text>
                  <View style={styles.issueTypeRow}>
                    {ISSUE_TYPES.map((t) => (
                      <TouchableOpacity
                        key={t}
                        style={[styles.issueTypeChip, item.issue_type === t && styles.issueTypeChipActive]}
                        onPress={() => handleProblemInfoChange(item, { issue_type: item.issue_type === t ? null : t })}
                      >
                        <Text
                          style={[
                            styles.issueTypeChipText,
                            item.issue_type === t && styles.issueTypeChipTextActive,
                          ]}
                        >
                          {t}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.problemLabel}>수리 자재</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="예: 벽지, 실리콘 코킹재"
                    placeholderTextColor={colors.textSecondary}
                    value={item.repair_material ?? ""}
                    onChangeText={(v) => handleRepairInfoChange(item, "repair_material", v)}
                  />

                  <Text style={styles.problemLabel}>예상 비용 (원)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="예: 50000"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="number-pad"
                    value={item.repair_cost != null ? String(item.repair_cost) : ""}
                    onChangeText={(v) => handleRepairInfoChange(item, "repair_cost", v)}
                  />

                  <Text style={styles.problemLabel}>재방문일 (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="예: 2026-09-20"
                    placeholderTextColor={colors.textSecondary}
                    value={item.revisit_date ?? ""}
                    onChangeText={(v) => handleRepairInfoChange(item, "revisit_date", v)}
                  />

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
          <Text style={styles.problemLabel}>객실 유형</Text>
          <View style={styles.issueTypeRow}>
            {ROOM_TYPES.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.issueTypeChip, roomType === t && styles.issueTypeChipActive]}
                onPress={() => handleRoomTypeSelect(t)}
              >
                <Text style={[styles.issueTypeChipText, roomType === t && styles.issueTypeChipTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {cleaningTeams.length > 0 && (
            <>
              <Text style={styles.problemLabel}>청소 담당팀</Text>
              <View style={styles.issueTypeRow}>
                {cleaningTeams.map((team) => (
                  <TouchableOpacity
                    key={team.id}
                    style={[styles.issueTypeChip, cleaningTeam === team.name && styles.issueTypeChipActive]}
                    onPress={() => handleCleaningTeamSelect(team.name)}
                  >
                    <Text
                      style={[styles.issueTypeChipText, cleaningTeam === team.name && styles.issueTypeChipTextActive]}
                    >
                      {team.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <TouchableOpacity
            style={[styles.approvalToggle, cleaningCompletedAt && styles.approvalToggleActive]}
            onPress={handleToggleCleaningCompleted}
          >
            <Text style={[styles.approvalToggleText, cleaningCompletedAt && styles.approvalToggleTextActive]}>
              {cleaningCompletedAt
                ? `✓ 청소 완료 (${new Date(cleaningCompletedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })})`
                : "청소 완료로 표시"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.approvalToggle, lostItemFound && styles.approvalToggleActive]}
            onPress={handleToggleLostItem}
          >
            <Text style={[styles.approvalToggleText, lostItemFound && styles.approvalToggleTextActive]}>
              {lostItemFound ? "✓ 분실물 발견됨" : "분실물 발견 시 표시"}
            </Text>
          </TouchableOpacity>
          {lostItemFound && (
            <TextInput
              style={styles.input}
              placeholder="보관 장소 (예: 프론트 보관함)"
              placeholderTextColor={colors.textSecondary}
              value={lostItemLocation}
              onChangeText={handleLostItemLocationChange}
            />
          )}

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
  issueTypeRow: { flexDirection: "row", flexWrap: "wrap", gap: moderateScale(6) },
  issueTypeChip: {
    paddingVertical: moderateScale(6),
    paddingHorizontal: moderateScale(12),
    borderRadius: radius.pill,
    backgroundColor: colors.backgroundSubtle,
  },
  issueTypeChipActive: { backgroundColor: colors.primary },
  issueTypeChipText: { fontSize: font.xs, fontWeight: "600", color: colors.textSecondary },
  issueTypeChipTextActive: { color: "#FFFFFF" },
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
  back: { color: colors.primary, fontSize: font.base, marginBottom: spacing.md },
});
