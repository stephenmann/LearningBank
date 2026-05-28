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
  type: "Deposit" | "Withdrawal" | "TransferDebit" | "TransferCredit";
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
