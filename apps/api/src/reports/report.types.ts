export interface ReportItemInput {
  item_name: string;
  state: 'UNSET' | 'NORMAL' | 'CAUTION' | 'URGENT' | 'NOT_APPLICABLE';
  comment?: string | null;
  photo_count?: number;
  repair_material?: string | null;
  repair_cost?: number | null;
  revisit_date?: string | null;
  // FR: docs/FEATURE_SCOPE.md 우선순위 A — 문제 내용/조치 내용/호텔 승인 필요 여부
  problem_description?: string | null;
  action_description?: string | null;
  requires_hotel_approval?: boolean;
}

export interface ReportSessionInput {
  id: string;
  hotel_name: string;
  room_label: string;
  type: 'ROOM_PRO' | 'BATH_PRO';
  started_at: string;
  completed_at?: string | null;
  inspector_name?: string;
  // FR: docs/FEATURE_SCOPE.md 우선순위 A — 서비스 구분, 담당자 의견
  service_type?: 'INITIAL_RENEWAL' | 'REGULAR' | 'EMERGENCY' | 'REINSPECTION';
  inspector_opinion?: string | null;
}
