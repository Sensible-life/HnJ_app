import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing, shadow, font } from "../theme/tokens";
import { moderateScale } from "../theme/responsive";

// FR-INSP-04: ROOM PRO 점검 중 '화장실' 항목에서 [주의]/[긴급] 선택 시
// 흐름이 끊기지 않도록 바로 표출되는 BATH PRO 진입 Bottom Sheet
type Props = {
  visible: boolean;
  roomLabel: string;
  onExecute: () => void;
  onClose: () => void;
};

export function BathProSheet({ visible, roomLabel, onExecute, onClose }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.backdropTouchable} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, shadow.card, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.grabber} />
          <Text style={styles.icon}>🛁</Text>
          <Text style={styles.title}>BATH PRO 정밀 점검 실행</Text>
          <Text style={styles.body}>
            {roomLabel}의 화장실 항목이 주의/긴급으로 표시되었어요.{"\n"}
            BATH PRO 12개 구역 정밀 점검을 바로 이어서 진행할까요?
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={onExecute}>
            <Text style={styles.primaryButtonText}>BATH PRO 세션 열기</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
            <Text style={styles.secondaryButtonText}>나중에 하기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(17,24,39,0.45)", justifyContent: "flex-end" },
  backdropTouchable: { flex: 1 },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    alignItems: "center",
  },
  grabber: {
    width: moderateScale(40),
    height: moderateScale(4),
    borderRadius: moderateScale(2),
    backgroundColor: colors.backgroundSubtle,
    marginBottom: spacing.md,
  },
  icon: { fontSize: font.display, marginBottom: spacing.sm },
  title: { fontSize: font.xl, fontWeight: "700", color: colors.textPrimary, marginBottom: spacing.sm },
  body: {
    fontSize: font.sm,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: moderateScale(20),
    marginBottom: spacing.lg,
  },
  primaryButton: {
    width: "100%",
    backgroundColor: colors.navActiveBg,
    borderRadius: radius.pill,
    paddingVertical: moderateScale(14),
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: font.md },
  secondaryButton: { paddingVertical: moderateScale(10), alignItems: "center" },
  secondaryButtonText: { color: colors.textSecondary, fontWeight: "600", fontSize: font.sm },
});
