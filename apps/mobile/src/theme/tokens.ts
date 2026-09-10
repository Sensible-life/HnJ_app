import { moderateScale, normalizeFont, wp } from "./responsive";

export const colors = {
  background: "#FFFFFF",
  backgroundSubtle: "#F5F6F8",
  card: "#FFFFFF",
  primary: "#2F6FED",
  primarySoft: "#EAF2FF",
  accentCoral: "#F76C6C",
  accentAmber: "#FDBA5C",
  statusSuccess: "#16A34A",
  statusSuccessBg: "#DCFCE7",
  statusUrgent: "#DC2626",
  statusUrgentBg: "#FEE2E2",
  statusCaution: "#FDBA5C",
  statusCautionBg: "#FEF3C7",
  navActiveBg: "#111827",
  textPrimary: "#111827",
  textSecondary: "#8A8F98",
};

// 고정 px 대신 화면 비율 기반 스케일 함수를 사용 — 폰 사이즈가 달라도 비율이 유지된다.
export const radius = {
  card: moderateScale(20),
  pill: 999, // 완전한 캡슐 모양은 스케일과 무관하게 항상 999 이상이면 충분
  input: moderateScale(12),
};

export const spacing = {
  xs: moderateScale(4),
  sm: moderateScale(8),
  md: moderateScale(16),
  lg: moderateScale(24),
  xl: moderateScale(32),
};

export const font = {
  xs: normalizeFont(12),
  sm: normalizeFont(13),
  base: normalizeFont(14),
  md: normalizeFont(15),
  lg: normalizeFont(16),
  xl: normalizeFont(18),
  xxl: normalizeFont(22),
  display: normalizeFont(26),
};

export const shadow = {
  card: {
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: moderateScale(16),
    shadowOffset: { width: 0, height: moderateScale(4) },
    elevation: 3,
  },
};

// 화면 가로폭 기준 퍼센트 — 좌우 여백처럼 "화면의 N%" 개념이 자연스러운 곳에 사용
export const layout = {
  screenPaddingH: wp(5.5), // 대략 375폭 기준 spacing.lg(24)와 비슷한 감각
  bottomNavSideMargin: wp(4.3),
};
