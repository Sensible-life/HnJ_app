import { useState } from "react";
import { CheckInScreen } from "../screens/CheckInScreen";
import { RoomInspectionScreen } from "../screens/RoomInspectionScreen";

export function InspectionFlow() {
  const [session, setSession] = useState<{ id: string; roomLabel: string } | null>(null);

  if (session) {
    return (
      <RoomInspectionScreen
        sessionId={session.id}
        roomLabel={session.roomLabel}
        onDone={() => setSession(null)}
      />
    );
  }

  return (
    <CheckInScreen
      onCheckedIn={(id, roomLabel) => setSession({ id, roomLabel })}
      onCancel={() => setSession(null)}
    />
  );
}
