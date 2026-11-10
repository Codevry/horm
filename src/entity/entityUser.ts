import { ENUM_ROLES } from '@/utils/enums.ts';

export interface User {
  id: number;
  name: string;
  token: string;
  role: ENUM_ROLES;
  isActive: boolean;
}

export interface UserRow {
  id: number;
  name: string;
  token: string;
  role: string;
  isActive: number;
}

export function toUser(row: UserRow): User {
  return { ...row, role: row.role as ENUM_ROLES, isActive: row.isActive === 1 };
}
