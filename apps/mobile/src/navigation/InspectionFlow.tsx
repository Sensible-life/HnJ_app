import { useEffect, useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { CheckInScreen } from "../screens/CheckInScreen";
import { RoomInspectionScreen } from "../screens/RoomInspectionScreen";
import { BathProInspectionScreen } from "../screens/BathProInspectionScreen";

type ActiveSession = { id: string; roomLabel: string; hotelName: string; type: "ROOM_PRO" | "BATH_PRO" };

// FR-홈: 홈 화면 "오늘 객실" 목록에서 진행 중인 점검을 탭하면
// navigation.navigate("Inspection", { resume: {...} })로 이 화면에 진입, 해당 세션을 이어서 연다.
type ResumeParam = { resume?: ActiveSession };

export function InspectionFlow() {
  const [session, setSession] = useState<ActiveSession | null>(null);
  const navigation = useNavigation();
  const route = useRoute();
  const resume = (route.params as ResumeParam | undefined)?.resume;

  useEffect(() => {
    if (resume) {
      setSession(resume);
      // 한 번 소비한 뒤에는 파라미터를 비워서, 이 화면에서 나갔다가 다시 탭으로 돌아왔을 때
      // 같은 세션이 반복해서 다시 열리지 않도록 한다.
      navigation.setParams({ resume: undefined } as never);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resume?.id]);

  if (session?.type === "BATH_PRO") {
    return (
      <BathProInspectionScreen
        sessionId={session.id}
        roomLabel={session.roomLabel}
        hotelName={session.hotelName}
        onDone={() => setSession(null)}
      />
    );
  }

  if (session) {
    return (
      <RoomInspectionScreen
        sessionId={session.id}
        roomLabel={session.roomLabel}
        hotelName={session.hotelName}
        onDone={() => setSession(null)}
      />
    );
  }

  return (
    <CheckInScreen
      onCheckedIn={(id, roomLabel, hotelName) => setSession({ id, roomLabel, hotelName, type: "ROOM_PRO" })}
    />
  );
}
