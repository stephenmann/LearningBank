"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AccountCard } from "@/components/AccountCard";
import { TransactionList } from "@/components/TransactionList";
import { DepositForm } from "@/components/DepositForm";
import { TransferForm } from "@/components/TransferForm";
import type { AccountSummaryDto, CategoryDto, TransferRequestDto } from "@/types/api";
import { PiggyBank, Plus, ArrowRightLeft, Clock } from "lucide-react";

type Modal = "deposit" | "transfer-to-savings" | "request-savings" | null;

interface DashboardClientProps {
  childId: string;
  checking: AccountSummaryDto;
  savings: AccountSummaryDto;
  categories: CategoryDto[];
  pendingRequests: TransferRequestDto[];
  role: "Parent" | "Child";
}

export function DashboardClient({
  childId,
  checking,
  savings,
  categories,
  pendingRequests,
  role,
}: DashboardClientProps) {
  const [modal, setModal] = useState<Modal>(null);
  const router = useRouter();

  const refresh = () => {
    setModal(null);
    router.refresh();
  };

  const checkingBalance = parseFloat(checking.balance);
  const savingsBalance = parseFloat(savings.balance);

  return (
    <div className="flex flex-col gap-8">
      {/* Account summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AccountCard title="Checking" balance={checking.balance}>
          <PiggyBank className="w-8 h-8 text-[#9fe870]" aria-hidden />
        </AccountCard>
        <AccountCard title="Savings" balance={savings.balance}>
          <PiggyBank className="w-8 h-8 text-[#9fe870]" aria-hidden />
        </AccountCard>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setModal("deposit")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-[24px] bg-[#9fe870] text-[#0e0f0c] font-semibold hover:bg-[#cdffad] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9fe870]"
        >
          <Plus className="w-4 h-4" aria-hidden />
          Add Deposit
        </button>
        <button
          onClick={() => setModal("transfer-to-savings")}
          disabled={checkingBalance <= 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-[24px] bg-[#e8ebe6] text-[#0e0f0c] font-semibold hover:bg-[#c5edab] transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9fe870]"
        >
          <ArrowRightLeft className="w-4 h-4" aria-hidden />
          Transfer to Savings
        </button>
        <button
          onClick={() => setModal("request-savings")}
          disabled={savingsBalance <= 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-[24px] bg-[#e8ebe6] text-[#0e0f0c] font-semibold hover:bg-[#c5edab] transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9fe870]"
        >
          <Clock className="w-4 h-4" aria-hidden />
          Request from Savings
        </button>
      </div>

      {/* Pending requests */}
      {pendingRequests.length > 0 && (
        <div className="bg-[#ffd11a]/20 border border-[#ffd11a] rounded-[16px] p-4">
          <p className="text-sm font-semibold text-[#4a3b1c] flex items-center gap-2">
            <Clock className="w-4 h-4" aria-hidden />
            {pendingRequests.length} pending savings withdrawal request
            {pendingRequests.length > 1 ? "s" : ""} awaiting parent approval
          </p>
        </div>
      )}

      {/* Transaction history */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <h2 className="text-base font-black text-[#0e0f0c] mb-3">Checking History</h2>
          <div className="bg-white rounded-[24px] p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)]">
            <TransactionList transactions={checking.transactions} />
          </div>
        </section>
        <section>
          <h2 className="text-base font-black text-[#0e0f0c] mb-3">Savings History</h2>
          <div className="bg-white rounded-[24px] p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)]">
            <TransactionList transactions={savings.transactions} />
          </div>
        </section>
      </div>

      {/* Modals */}
      {modal === "deposit" && (
        <DepositForm
          childId={childId}
          categories={categories}
          onSuccess={refresh}
          onCancel={() => setModal(null)}
        />
      )}
      {modal === "transfer-to-savings" && (
        <TransferForm
          childId={childId}
          direction="to-savings"
          maxAmount={checkingBalance}
          onSuccess={refresh}
          onCancel={() => setModal(null)}
        />
      )}
      {modal === "request-savings" && (
        <TransferForm
          childId={childId}
          direction="to-checking-request"
          maxAmount={savingsBalance}
          onSuccess={refresh}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
}
