export interface Form {
  id: number;
  name: string;
  token: string;
  createdAt: Date;
  isActive: boolean;
}

export interface FormRow {
  id: number;
  name: string;
  token: string;
  createdAt: string;
  isActive: number;
  userToken: string | null;
}

export function toForm(row: FormRow): Form {
  return {
    id: row.id,
    name: row.name,
    token: row.token,
    createdAt: new Date(row.createdAt),
    isActive: row.isActive === 1,
  };
}
