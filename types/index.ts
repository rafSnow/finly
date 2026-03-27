export type RecurrenceInterval = "weekly" | "monthly" | "yearly";
export type RecurringScope = "this" | "this_and_following" | "all";

export interface EntryFilters {
  month: number;
  year: number;
  type?: "income" | "expense";
  categoryId?: string;
}

export interface CreateEntryInput {
  type: "income" | "expense";
  value: number;
  categoryId: string;
  date: Date;
  description?: string;
}

export interface PeriodFilter {
  month: number;
  year: number;
}

export interface DashboardSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  total: number;
  percentage: number;
}

export interface PartnerSummary {
  uid: string;
  name: string;
  totalIncome: number;
  totalExpense: number;
  expenseContribution: number;
}

export interface CreateGoalInput {
  categoryId: string;
  limit: number;
  period: "monthly";
}

export interface User {
  uid: string;
  email: string;
  displayName: string | null;
}

export interface Family {
  id: string;
  memberIds: string[];
  createdAt: Date;
  createdBy: string;
}

export interface Entry {
  id: string;
  familyId: string;
  type: "income" | "expense";
  value: number;
  categoryId: string;
  date: Date;
  description?: string;
  ownerId: string;
  recurrenceId?: string;
  recurrenceIndex?: number;
  isRecurring: boolean;
  createdAt: Date;
}

export interface Category {
  id: string;
  familyId: string;
  name: string;
  type: "income" | "expense" | "both";
  createdAt: Date;
  isDefault: boolean;
}

export interface Goal {
  id: string;
  familyId: string;
  categoryId: string;
  limit: number;
  period: "monthly";
  createdAt: Date;
}

export interface Invite {
  id: string;
  fromUid: string;
  fromName?: string;
  fromEmail?: string;
  toEmail: string;
  familyId: string;
  status: "pending" | "accepted" | "expired";
  expiresAt: Date;
  createdAt: Date;
}
