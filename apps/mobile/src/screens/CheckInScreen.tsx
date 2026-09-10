import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { colors, radius, spacing, shadow } from "../theme/tokens";
import { createSession, insertItems } from "../lib/db";
import { ROOM_PRO_ITEMS } from "../data/inspectionItems";

const FLOORS = ["5F", "6F", "7F", "8F", "9F"];
const ROOMS_BY_FLOOR: Record<string, string[]> = {
  "5F": ["501", "502", "503"],
  "6F": ["601", "602", "603"],
  "7F": ["701", "702", "703"],
  "8F": ["801", "802", "803", "804"],
  "9F": ["901", "902", "903"],
};

type Props = {
  onCheckedIn: (sessionId: string, roomLabel: string) => void;
  onCancel: () => void;
};

export function CheckInScreen({ onCheckedIn, onCancel }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanMode, setScanMode] = useState(false);
  const [floor, setFloor] = useState(FLOORS[0]);
  const [room, setRoom] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function startCheckIn(roomLabel: string, method: "QR" | "NFC" | "MANUAL") {
    if (busy) return;
    setBusy(true);
    try {
      let gpsLat: number | null = null;
      let gpsLng: number | null = null;
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const pos = await Location.getCurrentPositionAsync({});
        gpsLat = pos.coords.latitude;
        gpsLng = pos.coords.longitude;
      }

      const sessionId = `sess_${Date.now()}`;
      const now = new Date().toISOString();
      await createSession({
        id: sessionId,
        room_label: roomLabel,
        type: "ROOM_PRO",
        status: "IN_PROGRESS",
        checkin_method: method,
        gps_lat: gpsLat,
        gps_lng: gpsLng,
        started_at: now,
        completed_at: null,
      });
      await insertItems(
        ROOM_PRO_ITEMS.map((def) => ({
          id: `${sessionId}_${def.id}`,
          session_id: sessionId,
          item_def_id: def.id,
          item_name: def.name,
          state: "UNSET",
          comment: null,
          photo_count: 0,
        })),
      );

      onCheckedIn(sessionId, roomLabel);
    } catch (err) {
      Alert.alert("체크인 실패", "다시 시도해주세요.");
    } finally {
      setBusy(false);
    }
  }

  function handleNfcPress() {
    Alert.alert(
      "NFC 태깅",
      "NFC 스캔은 Expo Go에서 지원되지 않습니다. 개발 빌드(dev client)로 실행하면 사용할 수 있어요.",
    );
  }

  if (scanMode) {
    if (!permission) return <View style={styles.screen} />;
    if (!permission.granted) {
      return (
        <View style={[styles.screen, styles.center]}>
          <Text style={styles.hint}>카메라 권한이 필요합니다</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
            <Text style={styles.primaryButtonText}>권한 허용</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.screen}>
        <CameraView
          style={StyleSheet.absoluteFill}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={({ data }) => {
            setScanMode(false);
            startCheckIn(data || "QR-스캔객실", "QR");
          }}
        />
        <TouchableOpacity style={styles.scanCancel} onPress={() => setScanMode(false)}>
          <Text style={styles.scanCancelText}>취소</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={onCancel}>
        <Text style={styles.back}>{"< 뒤로"}</Text>
      </TouchableOpacity>
      <Text style={styles.header}>퀵 체크인</Text>
      <Text style={styles.subheader}>QR 스캔, NFC 태깅 또는 직접 선택으로 체크인하세요</Text>

      <View style={styles.quickRow}>
        <TouchableOpacity style={[styles.quickButton, styles.quickPrimary]} onPress={() => setScanMode(true)}>
          <Text style={styles.quickPrimaryText}>QR 스캔</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickButton} onPress={handleNfcPress}>
          <Text style={styles.quickText}>NFC 태깅</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>1단계. 층 선택</Text>
      <View style={styles.pillRow}>
        {FLOORS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.pill, floor === f && styles.pillActive]}
            onPress={() => {
              setFloor(f);
              setRoom(null);
            }}
          >
            <Text style={[styles.pillText, floor === f && styles.pillTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>2단계. 객실 선택</Text>
      <View style={styles.pillRow}>
        {ROOMS_BY_FLOOR[floor].map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.pill, room === r && styles.pillActive]}
            onPress={() => setRoom(r)}
          >
            <Text style={[styles.pillText, room === r && styles.pillTextActive]}>{r}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, !room && styles.disabledButton]}
        disabled={!room || busy}
        onPress={() => room && startCheckIn(`${room}호`, "MANUAL")}
      >
        <Text style={styles.primaryButtonText}>{busy ? "체크인 중..." : "체크인 완료"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: "center", justifyContent: "center" },
  content: { padding: spacing.lg, paddingBottom: 60 },
  back: { color: colors.primary, fontSize: 14, marginBottom: spacing.md },
  header: { fontSize: 26, fontWeight: "700", color: colors.textPrimary },
  subheader: { fontSize: 13, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.lg },
  hint: { color: colors.textSecondary, marginBottom: spacing.md },
  quickRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  quickButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.card,
    backgroundColor: colors.card,
    alignItems: "center",
    ...shadow.card,
  },
  quickPrimary: { backgroundColor: colors.primary },
  quickText: { fontWeight: "700", color: colors.textPrimary },
  quickPrimaryText: { fontWeight: "700", color: "#FFFFFF" },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: colors.textPrimary, marginBottom: spacing.sm },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: spacing.lg },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    backgroundColor: colors.backgroundSubtle,
  },
  pillActive: { backgroundColor: colors.primary },
  pillText: { fontWeight: "600", color: colors.textSecondary },
  pillTextActive: { color: "#FFFFFF" },
  primaryButton: {
    backgroundColor: colors.navActiveBg,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: "center",
  },
  disabledButton: { opacity: 0.4 },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
  scanCancel: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.pill,
  },
  scanCancelText: { color: "#FFFFFF", fontWeight: "600" },
});
