import { Dimensions, PixelRatio } from "react-native";

// 폰마다 화면 크기가 달라서 고정 px 대신 화면 비율 기반으로 계산하는 유틸.
// CSS의 vw/vh, %와 같은 역할을 한다고 보면 된다.
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// 디자인 기준 화면(일반적인 6.1" 폰 기준, 375x812pt)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

/** vw(뷰포트 너비 %)에 해당 — 예: wp(50) = 화면 너비의 50% */
export function wp(percent: number): number {
  return (SCREEN_WIDTH * percent) / 100;
}

/** vh(뷰포트 높이 %)에 해당 — 예: hp(10) = 화면 높이의 10% */
export function hp(percent: number): number {
  return (SCREEN_HEIGHT * percent) / 100;
}

/** 가로 기준 스케일 (아이콘 크기, 가로 여백 등에 사용) */
export function scale(size: number): number {
  return (SCREEN_WIDTH / BASE_WIDTH) * size;
}

/** 세로 기준 스케일 (세로 여백, 높이에 사용) */
export function verticalScale(size: number): number {
  return (SCREEN_HEIGHT / BASE_HEIGHT) * size;
}

/**
 * 완만한 스케일 — 폰트/라운드 코너처럼 화면이 커져도 너무 과하게 커지면
 * 안 되는 값에 사용 (factor가 낮을수록 원래 크기에 가깝게 유지).
 */
export function moderateScale(size: number, factor = 0.5): number {
  return size + (scale(size) - size) * factor;
}

export function normalizeFont(size: number): number {
  const newSize = moderateScale(size, 0.3);
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
}

export const screen = { width: SCREEN_WIDTH, height: SCREEN_HEIGHT };
