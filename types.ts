
export type CategoryType = string;
export type CurrencyCode = 'BRL' | 'USD' | 'EUR';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: CategoryType;
  authorName: string;
}

export interface Income {
  id: string;
  description: string;
  amount: number;
  date: string;
  source: string;
  authorName: string;
}

export interface CategoryBudget {
  category: CategoryType;
  limit: number;
  iconKey: string;
}

export interface BudgetSummary {
  budgeted: number;
  income: number;
  spent: number;
  difference: number;
}

export type UserRole = 'admin' | 'participant';

export interface FamilyMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isMe?: boolean;
}

export interface InviteCode {
  id?: string;
  code: string;
  family_id: string;
  created_at: string;
  expires_at: string;
  created_by: string;
  used_at: string | null;
}

export interface Family {
  id: string;
  name: string;
  adminId: string;
  members: FamilyMember[];
  invites: InviteCode[];
}
