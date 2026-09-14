import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { colors, radius, spacing, font } from "../theme/tokens";
import { hp, moderateScale } from "../theme/responsive";
import { createSession, insertItems, ServiceType } from "../lib/db";
import { ROOM_PRO_ITEMS } from "../data/inspectionItems";
import { fetchHotels, fetchInspectors, ApiHotel, ApiUser } from "../lib/api";

const FLOORS = ["5F", "6F", "7F", "8F", "9F"];
const ROOMS_BY_FLOOR: Record<string, string[]> = {
  "5F": ["501", "502", "503"],
  "6F": ["601", "602", "603"],
  "7F": ["701", "702", "703"],
  "8F": ["801", "802", "803", "804"],
  "9F": ["901", "902", "903"],
};

// FR: docs/FEATURE_SCOPE.md 우선순위 A — 서비스 구분
const SERVICE_TYPES: { value: ServiceType; label: string }[] = [
  { value: "INITIAL_RENEWAL", label: "최초 리뉴얼" },
  { value: "REGULAR", label: "정기점검" },
  { value: "EMERGENCY", label: "긴급출동" },
  { value: "REINSPECTION", label: "재점검" },
];

type Props = {
  onCheckedIn: (
    sessionId: string,
    roomLabel: string,
    hotelName: string,
  ) => void;
};

export function CheckInScreen({ onCheckedIn }: Props) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanMode, setScanMode] = useState(false);
  const [floor, setFloor] = useState(FLOORS[0]);
  const [room, setRoom] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [hotels, setHotels] = useState<ApiHotel[]>([]);
  const [inspectors, setInspectors] = useState<ApiUser[]>([]);
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [inspectorId, setInspectorId] = useState<string | null>(null);
  const [serviceType, setServiceType] = useState<ServiceType>("REGULAR");

  useEffect(() => {
    fetchHotels()
      .then((list) => {
        setHotels(list);
        if (list.length > 0) setHotelId((prev) => prev ?? list[0].id);
      })
      .catch(() => {
        // 오프라인이거나 서버 접속 불가 시에도 체크인 자체는 계속 진행 가능해야 하므로 조용히 무시
      });
    fetchInspectors()
      .then((list) => {
        setInspectors(list);
        if (list.length > 0) setInspectorId((prev) => prev ?? list[0].id);
      })
      .catch(() => {});
  }, []);

  const selectedHotel = hotels.find((h) => h.id === hotelId) ?? null;
  const selectedInspector = inspectors.find((u) => u.id === inspectorId) ?? null;

  async function startCheckIn(
    roomLabel: string,
    method: "QR" | "NFC" | "MANUAL",
  ) {
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

      const hotelName = selectedHotel?.name ?? "그랜드 워커힐";
      const sessionId = `sess_${Date.now()}`;
      const now = new Date().toISOString();
      await createSession({
        id: sessionId,
        parent_session_id: null,
        hotel_name: hotelName,
        room_label: roomLabel,
        type: "ROOM_PRO",
        status: "IN_PROGRESS",
        checkin_method: method,
        gps_lat: gpsLat,
        gps_lng: gpsLng,
        started_at: now,
        completed_at: null,
        inspector_name: selectedInspector?.name ?? null,
        service_type: serviceType,
        inspector_opinion: null,
        room_type: null,
        cleaning_team: null,
        cleaning_completed_at: null,
        lost_item_found: 0,
        lost_item_location: null,
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
          repair_material: null,
          repair_cost: null,
          revisit_date: null,
          problem_description: null,
          action_description: null,
          requires_hotel_approval: 0,
          issue_type: null,
        })),
      );

      onCheckedIn(sessionId, roomLabel, hotelName);
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
        <View
          style={[
            styles.screen,
            styles.center,
            { paddingTop: insets.top, paddingBottom: insets.bottom },
          ]}
        >
          <Text style={styles.hint}>카메라 권한이 필요합니다</Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={requestPermission}
          >
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
        <TouchableOpacity
          style={[styles.scanCancel, { bottom: insets.bottom + hp(5) }]}
          onPress={() => setScanMode(false)}
        >
          <Text style={styles.scanCancelText}>취소</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + spacing.lg,
          paddingBottom: insets.bottom + hp(8),
        },
      ]}
    >
      <Text style={styles.header}>퀵 체크인</Text>
      <Text style={styles.subheader}>
        QR 스캔, NFC 태깅 또는 직접 선택으로 체크인하세요
      </Text>

      <View style={styles.quickRow}>
        <TouchableOpacity
          style={[styles.quickButton, styles.quickPrimary]}
          onPress={() => setScanMode(true)}
        >
          <Text style={styles.quickPrimaryText}>QR 스캔</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickButton} onPress={handleNfcPress}>
          <Text style={styles.quickText}>NFC 태깅</Text>
        </TouchableOpacity>
      </View>

      {hotels.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>호텔 선택</Text>
          <View style={styles.pillRow}>
            {hotels.map((h) => (
              <TouchableOpacity
                key={h.id}
                style={[styles.pill, hotelId === h.id && styles.pillActive]}
                onPress={() => setHotelId(h.id)}
              >
                <Text style={[styles.pillText, hotelId === h.id && styles.pillTextActive]}>
                  {h.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {inspectors.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>담당자 선택</Text>
          <View style={styles.pillRow}>
            {inspectors.map((u) => (
              <TouchableOpacity
                key={u.id}
                style={[styles.pill, inspectorId === u.id && styles.pillActive]}
                onPress={() => setInspectorId(u.id)}
              >
                <Text style={[styles.pillText, inspectorId === u.id && styles.pillTextActive]}>
                  {u.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <Text style={styles.sectionTitle}>서비스 구분</Text>
      <View style={styles.pillRow}>
        {SERVICE_TYPES.map((s) => (
          <TouchableOpacity
            key={s.value}
            style={[styles.pill, serviceType === s.value && styles.pillActive]}
            onPress={() => setServiceType(s.value)}
          >
            <Text style={[styles.pillText, serviceType === s.value && styles.pillTextActive]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>층 선택</Text>
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
            <Text
              style={[styles.pillText, floor === f && styles.pillTextActive]}
            >
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>객실 선택</Text>
      <View style={styles.pillRow}>
        {ROOMS_BY_FLOOR[floor].map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.pill, room === r && styles.pillActive]}
            onPress={() => setRoom(r)}
          >
            <Text
              style={[styles.pillText, room === r && styles.pillTextActive]}
            >
              {r}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, !room && styles.disabledButton]}
        disabled={!room || busy}
        onPress={() => room && startCheckIn(`${room}호`, "MANUAL")}
      >
        <Text style={styles.primaryButtonText}>
          {busy ? "체크인 중..." : "체크인 완료"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: spacing.lg },
  header: {
    fontSize: font.display,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  subheader: {
    fontSize: font.sm,
    color: colors.textSecondary,
    marginTop: moderateScale(4),
    marginBottom: spacing.lg,
  },
  hint: { color: colors.textSecondary, marginBottom: spacing.md },
  quickRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  quickButton: {
    flex: 1,
    paddingVertical: moderateScale(14),
    borderRadius: radius.card,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  quickPrimary: { backgroundColor: colors.primary },
  quickText: { fontWeight: "700", color: colors.textPrimary },
  quickPrimaryText: { fontWeight: "700", color: "#FFFFFF" },
  sectionTitle: {
    fontSize: font.md,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(8),
    marginBottom: spacing.lg,
  },
  pill: {
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(18),
    borderRadius: radius.input,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: { backgroundColor: colors.primary },
  pillText: { fontWeight: "600", color: colors.textSecondary },
  pillTextActive: { color: "#FFFFFF" },
  primaryButton: {
    backgroundColor: colors.navActiveBg,
    borderRadius: radius.pill,
    paddingVertical: moderateScale(14),
    alignItems: "center",
  },
  disabledButton: { opacity: 0.4 },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: font.md },
  scanCancel: {
    position: "absolute",
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(12),
    borderRadius: radius.pill,
  },
  scanCancelText: { color: "#FFFFFF", fontWeight: "600" },
});
