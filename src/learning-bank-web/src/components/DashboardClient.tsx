"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AccountCard } from "@/components/AccountCard";
import { TransactionList } from "@/components/TransactionList";
import { DepositForm } from "@/components/DepositForm";
import { TransferForm } from "@/components/TransferForm";
import { WithdrawalForm } from "@/components/WithdrawalForm";
import { DepositSymbolIcon, WithdrawSymbolIcon } from "@/components/icons/CashActionIcons";
import type { AccountSummaryDto, CategoryDto, TransferRequestDto } from "@/types/api";
import { hasSeenPennyFeature, markPennyFeatureSeen, type PennyGuideFeature } from "@/lib/penny-guide";
import { useUserPreferences } from "@/lib/user-preferences";
import { PiggyBank, ArrowRightLeft, Clock, Check, X } from "lucide-react";

type Modal = "deposit" | "transfer-to-savings" | "request-savings" | "withdrawal" | null;

interface GuideStep {
  feature: PennyGuideFeature;
  title: string;
  description: string;
}

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
  const [modalHint, setModalHint] = useState<Exclude<Modal, null> | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);
  const [reviewingRequestId, setReviewingRequestId] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [activeGuideIndex, setActiveGuideIndex] = useState<number | null>(null);
  const [manualGuide, setManualGuide] = useState(false);

  const balancesRef = useRef<HTMLDivElement | null>(null);
  const addDepositRef = useRef<HTMLButtonElement | null>(null);
  const transferToSavingsRef = useRef<HTMLButtonElement | null>(null);
  const requestFromSavingsRef = useRef<HTMLButtonElement | null>(null);
  const pendingRequestsRef = useRef<HTMLDivElement | null>(null);
  const historyRef = useRef<HTMLDivElement | null>(null);

  const router = useRouter();
  const isChild = role === "Child";
  const { formatCurrency } = useUserPreferences();

  const refresh = () => {
    setModal(null);
    setModalHint(null);
    router.refresh();
  };

  const guideSteps = useMemo<GuideStep[]>(
    () => [
      {
        feature: "balances",
        title: "Start here: your balances",
        description: "These cards show what you can spend now and what you are saving for later.",
      },
      {
        feature: "add-deposit",
        title: "Add Deposit",
        description: "Use this when you receive money or a gift card. Penny will help with amount, description, and category.",
      },
      {
        feature: "transfer-to-savings",
        title: "Transfer to Savings",
        description: "Move money from checking into savings instantly to protect your goal money.",
      },
      {
        feature: "request-from-savings",
        title: "Request from Savings",
        description: "Need money back in checking? Send a request and your parent can approve it.",
      },
      {
        feature: "pending-requests",
        title: "Pending Requests",
        description:
          pendingRequests.length > 0
            ? "This area shows requests waiting for parent approval."
            : "When you request money from savings, Penny will show pending requests here.",
      },
      {
        feature: "history",
        title: "Transaction History",
        description: "Every deposit, withdrawal, and transfer is listed here so you can track your progress.",
      },
    ],
    [pendingRequests.length]
  );

  const activeGuideStep = activeGuideIndex !== null ? guideSteps[activeGuideIndex] : null;

  const getGuideTarget = (feature: PennyGuideFeature) => {
    switch (feature) {
      case "balances":
        return balancesRef.current;
      case "add-deposit":
        return addDepositRef.current;
      case "transfer-to-savings":
        return transferToSavingsRef.current;
      case "request-from-savings":
        return requestFromSavingsRef.current;
      case "pending-requests":
        return pendingRequestsRef.current ?? requestFromSavingsRef.current;
      case "history":
        return historyRef.current;
      default:
        return null;
    }
  };

  const startGuide = (isManual: boolean) => {
    setManualGuide(isManual);
    setActiveGuideIndex(0);
  };

  const endGuide = (markComplete: boolean) => {
    setActiveGuideIndex(null);
    setManualGuide(false);
    if (markComplete) {
      markPennyFeatureSeen(childId, "intro-complete");
    }
  };

  const openModalWithPenny = (nextModal: Exclude<Modal, null>) => {
    setModal(nextModal);

    if (!isChild) {
      return;
    }

    const featureByModal: Record<Exclude<Modal, null>, PennyGuideFeature> = {
      deposit: "deposit-form",
      "transfer-to-savings": "transfer-form",
      "request-savings": "request-form",
      withdrawal: "deposit-form",
    };

    const feature = featureByModal[nextModal];
    const shouldShowHint = manualGuide || !hasSeenPennyFeature(childId, feature);

    if (shouldShowHint) {
      setModalHint(nextModal);
    }

    markPennyFeatureSeen(childId, feature);
  };

  useEffect(() => {
    if (!isChild) {
      return;
    }

    if (!hasSeenPennyFeature(childId, "intro-complete")) {
      startGuide(false);
    }

    const onHelp = () => {
      startGuide(true);
    };

    window.addEventListener("learningbank:penny-help", onHelp);
    return () => {
      window.removeEventListener("learningbank:penny-help", onHelp);
    };
  }, [childId, isChild]);

  useEffect(() => {
    if (!isChild || !activeGuideStep) {
      return;
    }

    markPennyFeatureSeen(childId, activeGuideStep.feature);
    getGuideTarget(activeGuideStep.feature)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });
  }, [activeGuideStep, childId, isChild]);

  const checkingBalance = parseFloat(checking.balance);
  const savingsBalance = parseFloat(savings.balance);

  const canDeleteTransaction = (txType: "Deposit" | "Withdrawal" | "TransferDebit" | "TransferCredit" | "TaskReward", txDescription: string) =>
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

  const isGuideFeatureActive = (feature: PennyGuideFeature) => activeGuideStep?.feature === feature;

  const modalHelpMessage: Record<Exclude<Modal, null>, string> = {
    deposit:
      "Enter the amount, choose a category, and optionally add a note so future-you remembers where this money came from.",
    "transfer-to-savings":
      "Pick how much to move from checking into savings. The transfer happens right away after you confirm.",
    "request-savings":
      "Enter the amount and optional note, then submit your request. It will move only after your parent approves.",
    withdrawal:
      "Enter the amount spent and a short note so the child can see what this spending was for.",
  };

  const goToNextGuideStep = () => {
    if (activeGuideIndex === null) {
      return;
    }

    if (activeGuideIndex >= guideSteps.length - 1) {
      endGuide(true);
      return;
    }

    setActiveGuideIndex((current) => (current === null ? current : current + 1));
  };

  const activeGuideDisplayIndex = activeGuideIndex ?? 0;

  return (
    <div className="flex flex-col gap-8">
      {/* Account summary cards */}
      <div
        ref={balancesRef}
        className={`grid grid-cols-1 sm:grid-cols-2 gap-4 relative ${
          isGuideFeatureActive("balances") ? "ring-2 ring-[#9fe870] rounded-[20px] p-1" : ""
        }`}
      >
        {isGuideFeatureActive("balances") && (
          <div className="absolute -top-10 right-2 rounded-full bg-white shadow-md border border-[#e8ebe6] px-2 py-1 flex items-center gap-1">
            <Image
              src="/images/learning-bank-mascot-penny.svg"
              alt="Penny mascot"
              width={20}
              height={20}
              className="animate-[penny-float_2.2s_ease-in-out_infinite]"
            />
            <span className="text-xs font-semibold text-[#454745]">Penny</span>
          </div>
        )}
        <AccountCard title="Checking" balance={checking.balance}>
          <PiggyBank className="w-8 h-8 text-[#9fe870]" aria-hidden />
        </AccountCard>
        <AccountCard title="Savings" balance={savings.balance}>
          <PiggyBank className="w-8 h-8 text-[#9fe870]" aria-hidden />
        </AccountCard>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          {isGuideFeatureActive("add-deposit") && (
            <Image
              src="/images/learning-bank-mascot-penny.svg"
              alt="Penny mascot"
              width={28}
              height={28}
              className="absolute -top-7 -right-2 animate-[penny-float_2.2s_ease-in-out_infinite]"
            />
          )}
          <button
            ref={addDepositRef}
            onClick={() => openModalWithPenny("deposit")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-[24px] bg-[#9fe870] text-[#0e0f0c] font-semibold hover:bg-[#cdffad] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9fe870] ${
              isGuideFeatureActive("add-deposit") ? "ring-2 ring-[#0e0f0c]" : ""
            }`}
          >
            <DepositSymbolIcon className="w-5 h-5 shrink-0" />
            Add Deposit
          </button>
        </div>

        <div className="relative">
          {isGuideFeatureActive("transfer-to-savings") && (
            <Image
              src="/images/learning-bank-mascot-penny.svg"
              alt="Penny mascot"
              width={28}
              height={28}
              className="absolute -top-7 -right-2 animate-[penny-float_2.2s_ease-in-out_infinite]"
            />
          )}
          <button
            ref={transferToSavingsRef}
            onClick={() => openModalWithPenny("transfer-to-savings")}
            disabled={checkingBalance <= 0}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-[24px] bg-[#e8ebe6] text-[#0e0f0c] font-semibold hover:bg-[#c5edab] transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9fe870] ${
              isGuideFeatureActive("transfer-to-savings") ? "ring-2 ring-[#0e0f0c]" : ""
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" aria-hidden />
            Transfer to Savings
          </button>
        </div>

        <div className="relative">
          {isGuideFeatureActive("request-from-savings") && (
            <Image
              src="/images/learning-bank-mascot-penny.svg"
              alt="Penny mascot"
              width={28}
              height={28}
              className="absolute -top-7 -right-2 animate-[penny-float_2.2s_ease-in-out_infinite]"
            />
          )}
          <button
            ref={requestFromSavingsRef}
            onClick={() => openModalWithPenny("request-savings")}
            disabled={savingsBalance <= 0}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-[24px] bg-[#e8ebe6] text-[#0e0f0c] font-semibold hover:bg-[#c5edab] transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9fe870] ${
              isGuideFeatureActive("request-from-savings") ? "ring-2 ring-[#0e0f0c]" : ""
            }`}
          >
            <Clock className="w-4 h-4" aria-hidden />
            Request from Savings
          </button>
        </div>

        {role === "Parent" && (
          <button
            onClick={() => setModal("withdrawal")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-[24px] bg-[#d03238] text-white font-semibold hover:bg-[#b02028] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d03238]"
          >
            <WithdrawSymbolIcon className="w-5 h-5 shrink-0" />
            Log Spending
          </button>
        )}
      </div>

      {/* Pending requests */}
      {pendingRequests.length > 0 && (
        <div
          ref={pendingRequestsRef}
          className={`bg-[#ffd11a]/20 border border-[#ffd11a] rounded-[16px] p-4 relative ${
            isGuideFeatureActive("pending-requests") ? "ring-2 ring-[#9fe870]" : ""
          }`}
        >
          {isGuideFeatureActive("pending-requests") && (
            <Image
              src="/images/learning-bank-mascot-penny.svg"
              alt="Penny mascot"
              width={30}
              height={30}
              className="absolute -top-8 right-3 animate-[penny-float_2.2s_ease-in-out_infinite]"
            />
          )}
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
                      Request for <span className="font-black tabular-nums">{formatCurrency(parseFloat(req.amount))}</span> from savings
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
      <div
        ref={historyRef}
        className={`grid grid-cols-1 lg:grid-cols-2 gap-6 relative ${
          isGuideFeatureActive("history") ? "ring-2 ring-[#9fe870] rounded-[20px] p-2" : ""
        }`}
      >
        {isGuideFeatureActive("history") && (
          <Image
            src="/images/learning-bank-mascot-penny.svg"
            alt="Penny mascot"
            width={30}
            height={30}
            className="absolute -top-8 right-2 animate-[penny-float_2.2s_ease-in-out_infinite]"
          />
        )}
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
          helpMessage={modalHint === "deposit" ? modalHelpMessage.deposit : undefined}
          onSuccess={refresh}
          onCancel={() => {
            setModal(null);
            setModalHint(null);
          }}
        />
      )}
      {modal === "transfer-to-savings" && (
        <TransferForm
          childId={childId}
          direction="to-savings"
          maxAmount={checkingBalance}
          helpMessage={
            modalHint === "transfer-to-savings"
              ? modalHelpMessage["transfer-to-savings"]
              : undefined
          }
          onSuccess={refresh}
          onCancel={() => {
            setModal(null);
            setModalHint(null);
          }}
        />
      )}
      {modal === "request-savings" && (
        <TransferForm
          childId={childId}
          direction="to-checking-request"
          maxAmount={savingsBalance}
          helpMessage={
            modalHint === "request-savings"
              ? modalHelpMessage["request-savings"]
              : undefined
          }
          onSuccess={refresh}
          onCancel={() => {
            setModal(null);
            setModalHint(null);
          }}
        />
      )}
      {modal === "withdrawal" && (
        <WithdrawalForm
          childId={childId}
          onSuccess={refresh}
          onCancel={() => setModal(null)}
        />
      )}

      {isChild && activeGuideStep && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-[20px] border border-[#e8ebe6] bg-white p-4 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.35)]">
          <div className="flex items-start gap-3">
            <Image
              src="/images/learning-bank-mascot-penny.svg"
              alt="Penny mascot"
              width={48}
              height={48}
              className="shrink-0 animate-[penny-float_2.2s_ease-in-out_infinite]"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#868685]">
                Penny&apos;s Guide {activeGuideDisplayIndex + 1}/{guideSteps.length}
              </p>
              <h3 className="text-base font-black text-[#0e0f0c] mt-0.5">{activeGuideStep.title}</h3>
              <p className="text-sm text-[#454745] mt-1">{activeGuideStep.description}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => endGuide(true)}
              className="px-3 py-2 rounded-[14px] text-sm font-semibold text-[#454745] hover:bg-[#e8ebe6] transition-colors"
            >
              {manualGuide ? "Close" : "Skip"}
            </button>
            <button
              type="button"
              onClick={goToNextGuideStep}
              className="px-4 py-2 rounded-[16px] bg-[#9fe870] text-[#0e0f0c] text-sm font-semibold hover:bg-[#cdffad] transition-colors"
            >
              {activeGuideDisplayIndex >= guideSteps.length - 1 ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
