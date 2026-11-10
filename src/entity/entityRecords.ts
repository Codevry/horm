export interface Records {
  id: number;
  data: Record<string, unknown>;
  createdAt: Date;
}

export interface RecordRow {
  id: number;
  data: string;
  createdAt: string;
  formToken: string;
}

export function toRecord(row: RecordRow): Records {
  return { id: row.id, data: JSON.parse(row.data), createdAt: new Date(row.createdAt) };
}
