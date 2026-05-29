export interface UserDto {
  id: string;
  displayName: string;
  email: string;
  role: "Parent" | "Child";
  isActive: boolean;
  preferenceScopeId: string;
}

export interface ChildDto {
  id: string;
  displayName: string;
  email: string;
  isActive: boolean;
}

export interface ParentAdminDto {
  id: string;
  displayName: string;
  email: string;
  isActive: boolean;
  linkedChildrenCount: number;
  isNewAccount: boolean;
}

export interface CategoryDto {
  id: string;
  name: string;
  isChildAllowed: boolean;
  isArchived: boolean;
}

export interface TransactionDto {
  id: string;
  account: "Checking" | "Savings";
  type: "Deposit" | "Withdrawal" | "TransferDebit" | "TransferCredit" | "TaskReward";
  amount: string;
  description: string;
  categoryName: string | null;
  postedAt: string;
}

export interface AccountSummaryDto {
  balance: string;
  transactions: TransactionDto[];
}

export interface TransferRequestDto {
  id: string;
  childId: string;
  childDisplayName: string | null;
  amount: string;
  note: string;
  status: "Pending" | "Approved" | "Rejected" | "Cancelled";
  requestedAt: string;
  reviewedAt: string | null;
  reviewNote: string | null;
}

export interface LearningTaskDto {
  id: string;
  childId: string;
  title: string;
  monetaryValue: string;
  categoryId: string | null;
  targetAccount: "Checking" | "Savings";
  recurrenceType: "OneTime" | "Recurring";
  frequency: "Weekly" | "Biweekly" | null;
  daysOfWeek: number[];
  startDateUtc: string;
  endDateUtc: string | null;
  maxOccurrences: number | null;
  isActive: boolean;
  canMarkComplete: boolean;
  isPendingReview: boolean;
  isCompletedForCurrentCycle: boolean;
  currentOccurrenceDateUtc: string | null;
  nextOccurrenceDateUtc: string | null;
  lastApprovedAt: string | null;
  lastReviewNote: string | null;
}

export interface PendingTaskCompletionDto {
  completionId: string;
  taskId: string;
  childId: string;
  taskTitle: string;
  monetaryValue: string;
  targetAccount: "Checking" | "Savings";
  occurrenceDateUtc: string;
  completedByChildAt: string;
  status: "Pending" | "Approved" | "Rejected";
  reviewNote: string | null;
}
