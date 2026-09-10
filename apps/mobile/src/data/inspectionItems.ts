export type ItemCategory = "ROOM_PRO" | "BATH_PRO";

export interface InspectionItemDef {
  id: string;
  category: ItemCategory;
  name: string;
}

// SRS 3.2 ROOM PRO 15개 구역 (예시 구성 — 실제 마스터 데이터로 교체 필요)
export const ROOM_PRO_ITEMS: InspectionItemDef[] = [
  { id: "room-01", category: "ROOM_PRO", name: "침구 오염 및 주름 상태" },
  { id: "room-02", category: "ROOM_PRO", name: "에어컨/냉난방기 작동 및 냄새" },
  { id: "room-03", category: "ROOM_PRO", name: "화장실 청결 상태 (BATH PRO 연동)" },
  { id: "room-04", category: "ROOM_PRO", name: "바닥/카펫 청결 및 손상" },
  { id: "room-05", category: "ROOM_PRO", name: "창문/커튼 상태" },
  { id: "room-06", category: "ROOM_PRO", name: "조명 작동 여부" },
  { id: "room-07", category: "ROOM_PRO", name: "TV/전자기기 작동 여부" },
  { id: "room-08", category: "ROOM_PRO", name: "미니바/냉장고 상태" },
  { id: "room-09", category: "ROOM_PRO", name: "옷장/수납공간 청결" },
  { id: "room-10", category: "ROOM_PRO", name: "책상/의자 상태" },
  { id: "room-11", category: "ROOM_PRO", name: "쓰레기통 비움 여부" },
  { id: "room-12", category: "ROOM_PRO", name: "어메니티 비치 상태" },
  { id: "room-13", category: "ROOM_PRO", name: "냄새(전반) 및 환기 상태" },
  { id: "room-14", category: "ROOM_PRO", name: "안전장치(도어락/화재감지기) 작동" },
  { id: "room-15", category: "ROOM_PRO", name: "전반적 정리정돈 상태" },
];

// SRS 3.2 BATH PRO 12개 구역
export const BATH_PRO_ITEMS: InspectionItemDef[] = [
  { id: "bath-01", category: "BATH_PRO", name: "변기 청결 및 작동" },
  { id: "bath-02", category: "BATH_PRO", name: "세면대 청결 및 배수" },
  { id: "bath-03", category: "BATH_PRO", name: "샤워부스/욕조 청결" },
  { id: "bath-04", category: "BATH_PRO", name: "타일 줄눈 곰팡이 여부" },
  { id: "bath-05", category: "BATH_PRO", name: "배수구 냄새/막힘" },
  { id: "bath-06", category: "BATH_PRO", name: "환풍기 작동" },
  { id: "bath-07", category: "BATH_PRO", name: "수건/어메니티 비치" },
  { id: "bath-08", category: "BATH_PRO", name: "거울 상태" },
  { id: "bath-09", category: "BATH_PRO", name: "온수 작동 여부" },
  { id: "bath-10", category: "BATH_PRO", name: "바닥 미끄럼/물고임" },
  { id: "bath-11", category: "BATH_PRO", name: "실리콘 마감 상태" },
  { id: "bath-12", category: "BATH_PRO", name: "전반적 위생 상태" },
];
