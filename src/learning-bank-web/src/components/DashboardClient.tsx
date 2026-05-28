"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AccountCard } from "@/components/AccountCard";
import { TransactionList } from "@/components/TransactionList";
import { DepositForm } from "@/components/DepositForm";
import { TransferForm } from "@/components/TransferForm";
import type { AccountSummaryDto, CategoryDto, TransferRequestDto } from "@/types/api";
import { PiggyBank, Plus, ArrowRightLeft, Clock, Check, X } from "lucide-react";

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
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);
  const [reviewingRequestId, setReviewingRequestId] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const router = useRouter();

  const refresh = () => {
    setModal(null);
    router.refresh();
  };

  const checkingBalance = parseFloat(checking.balance);
  const savingsBalance = parseFloat(savings.balance);

  const canDeleteTransaction = (txType: "Deposit" | "Withdrawal" | "TransferDebit" | "TransferCredit", txDescription: string) =>
    role === "Parent" &&
    (txType === "Deposit" || txType === "Withdrawal") &&
    !txDescription.startsWith("Reversal of ");

  const handleDeleteTransaction = async (transactionId: string) => {
    if (deletingTransactionId) return;

    const reason = window.prompt("Why are you deleting this transaction? This creates a reversal entry.", "Accidentally entered")?.trim();
    if (!reason) return;

    setDeleteError(null);
    setDeletingTransactionId(transactionId);

    try {
      const res = await fetch(`/api/transactions/${transactionId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setDeleteError(body.error ?? "Unable to delete transaction.");
        return;
      }

      router.refresh();
    } finally {
      setDeletingTransactionId(null);
    }
  };

  const handleReviewRequest = async (requestId: string, approve: boolean) => {
    if (reviewingRequestId) return;

    setReviewError(null);
    setReviewingRequestId(requestId);

    try {
      const res = await fetch(`/api/transfers/requests/${requestId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approve }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setReviewError(body.error ?? "Unable to process transfer request.");
        return;
      }

      router.refresh();
    } finally {
      setReviewingRequestId(null);
    }
  };

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

          {role === "Parent" && (
            <div className="mt-4 flex flex-col gap-2">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="rounded-[12px] bg-white/80 border border-[#e8ebe6] px-3 py-2 flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#0e0f0c]">
                      Request for <span className="font-black tabular-nums">${parseFloat(req.amount).toFixed(2)}</span> from savings
                    </p>
                    {req.note && (
                      <p className="text-xs text-[#454745] italic mt-0.5">&quot;{req.note}&quot;</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReviewRequest(req.id, false)}
                      disabled={reviewingRequestId === req.id}
                      aria-label="Reject transfer request"
                      className="p-2 rounded-full bg-[#d03238]/10 text-[#d03238] hover:bg-[#d03238]/20 transition-colors disabled:opacity-50"
                    >
                      <X className="w-4 h-4" aria-hidden />
                    </button>
                    <button
                      onClick={() => handleReviewRequest(req.id, true)}
                      disabled={reviewingRequestId === req.id}
                      aria-label="Approve transfer request"
                      className="p-2 rounded-full bg-[#9fe870] text-[#0e0f0c] hover:bg-[#cdffad] transition-colors disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" aria-hidden />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {reviewError && (
        <div className="bg-[#320707]/10 border border-[#d03238]/40 rounded-[16px] p-4">
          <p className="text-sm font-semibold text-[#8d0f15]">{reviewError}</p>
        </div>
      )}

      {deleteError && (
        <div className="bg-[#320707]/10 border border-[#d03238]/40 rounded-[16px] p-4">
          <p className="text-sm font-semibold text-[#8d0f15]">{deleteError}</p>
        </div>
      )}

      {/* Transaction history */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <h2 className="text-base font-black text-[#0e0f0c] mb-3">Checking History</h2>
          <div className="bg-white rounded-[24px] p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)]">
            <TransactionList
              transactions={checking.transactions}
              canDelete={role === "Parent" ? (tx) => canDeleteTransaction(tx.type, tx.description) : undefined}
              onDelete={role === "Parent" ? (tx) => handleDeleteTransaction(tx.id) : undefined}
              deletingTransactionId={deletingTransactionId}
            />
          </div>
        </section>
        <section>
          <h2 className="text-base font-black text-[#0e0f0c] mb-3">Savings History</h2>
          <div className="bg-white rounded-[24px] p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)]">
            <TransactionList
              transactions={savings.transactions}
              canDelete={role === "Parent" ? (tx) => canDeleteTransaction(tx.type, tx.description) : undefined}
              onDelete={role === "Parent" ? (tx) => handleDeleteTransaction(tx.id) : undefined}
              deletingTransactionId={deletingTransactionId}
            />
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
