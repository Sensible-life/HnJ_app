import { Component, ReactNode } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors, spacing, font, radius } from "../theme/tokens";
import { moderateScale } from "../theme/responsive";
import { reportError } from "../lib/errorReporting";

// FR: "모니터링 도구 연동 (크래시/에러 로그)" — TODO.md Phase 7.
// 렌더링 중 발생한 예외를 잡아 서버로 보고하고, 화이트 스크린 대신 복구 가능한
// 에러 화면을 보여준다 (Flutter의 ErrorWidget.builder와 비슷한 역할).
type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    reportError(error.message, error.stack, { componentStack: info.componentStack ?? undefined });
  }

  private handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <View style={styles.screen}>
          <Text style={styles.icon}>⚠️</Text>
          <Text style={styles.title}>문제가 발생했어요</Text>
          <Text style={styles.message}>예상치 못한 오류가 발생했습니다. 오류 내용은 자동으로 서버에 보고됐어요.</Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, backgroundColor: colors.background },
  icon: { fontSize: font.display, marginBottom: spacing.md },
  title: { fontSize: font.xl, fontWeight: "700", color: colors.textPrimary, marginBottom: spacing.sm },
  message: { fontSize: font.sm, color: colors.textSecondary, textAlign: "center", marginBottom: spacing.lg },
  button: {
    backgroundColor: colors.navActiveBg,
    borderRadius: radius.pill,
    paddingVertical: moderateScale(12),
    paddingHorizontal: spacing.xl,
  },
  buttonText: { color: "#FFFFFF", fontWeight: "700" },
});
