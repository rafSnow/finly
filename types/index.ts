export type RecurrenceInterval = "weekly" | "monthly" | "yearly";

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
  toEmail: string;
  familyId: string;
  status: "pending" | "accepted" | "expired";
  expiresAt: Date;
  createdAt: Date;
}
