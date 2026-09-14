export interface ReportItemInput {
  item_name: string;
  state: 'UNSET' | 'NORMAL' | 'CAUTION' | 'URGENT';
  comment?: string | null;
  photo_count?: number;
  repair_material?: string | null;
  repair_cost?: number | null;
  revisit_date?: string | null;
}

export interface ReportSessionInput {
  id: string;
  hotel_name: string;
  room_label: string;
  type: 'ROOM_PRO' | 'BATH_PRO';
  started_at: string;
  completed_at?: string | null;
  inspector_name?: string;
}
