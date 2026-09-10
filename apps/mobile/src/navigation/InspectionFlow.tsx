import { useState } from "react";
import { CheckInScreen } from "../screens/CheckInScreen";
import { RoomInspectionScreen } from "../screens/RoomInspectionScreen";

export function InspectionFlow() {
  const [session, setSession] = useState<{ id: string; roomLabel: string; hotelName: string } | null>(null);

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
      onCheckedIn={(id, roomLabel, hotelName) => setSession({ id, roomLabel, hotelName })}
      onCancel={() => setSession(null)}
    />
  );
}
