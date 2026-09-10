export interface ReportItemInput {
  item_name: string;
  state: 'UNSET' | 'NORMAL' | 'CAUTION' | 'URGENT';
  comment?: string | null;
  photo_count?: number;
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
