import { useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { colors, radius, spacing, shadow } from "../theme/tokens";
import { ThreeStateToggle, ItemState } from "../components/ThreeStateToggle";
import { getItemsForSession, updateItemState, completeSession, LocalItem } from "../lib/db";
import { syncPendingSessions } from "../lib/sync";

type Props = {
  sessionId: string;
  roomLabel: string;
  onDone: () => void;
};

export function RoomInspectionScreen({ sessionId, roomLabel, onDone }: Props) {
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
      const newPhotoCount = item.photo_count + 1;
      await updateItemState(item.id, state, newPhotoCount);
    } else {
      await updateItemState(item.id, state);
    }
    await load();
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
      await completeSession(sessionId, new Date().toISOString());
      const result = await syncPendingSessions();
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

  if (loading) return <View style={styles.screen} />;

  const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>{roomLabel} 점검 진행 중</Text>
        <Text style={styles.subheader}>
          {completedCount}/{items.length} · {progress}% 완료
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        {items.map((item, idx) => (
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
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.draftButton} onPress={handleSaveDraft}>
          <Text style={styles.draftButtonText}>임시 저장</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.completeButton} onPress={handleComplete} disabled={saving}>
          <Text style={styles.completeButtonText}>{saving ? "처리 중..." : "리포트 생성 및 완료"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 140 },
  header: { fontSize: 22, fontWeight: "700", color: colors.textPrimary },
  subheader: { fontSize: 13, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.sm },
  progressTrack: {
    height: 8,
    borderRadius: 4,
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
  itemTitle: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
  photoHint: { marginTop: spacing.sm, fontSize: 12, color: colors.statusUrgent },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.backgroundSubtle,
  },
  draftButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.backgroundSubtle,
    alignItems: "center",
  },
  draftButtonText: { fontWeight: "700", color: colors.textPrimary },
  completeButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.navActiveBg,
    alignItems: "center",
  },
  completeButtonText: { fontWeight: "700", color: "#FFFFFF" },
});
