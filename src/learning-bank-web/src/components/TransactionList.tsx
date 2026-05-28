import { type TransactionDto } from "@/types/api";
import { ArrowDownLeft, ArrowUpRight, ArrowRightLeft } from "lucide-react";

interface TransactionListProps {
  transactions: TransactionDto[];
  canDelete?: (transaction: TransactionDto) => boolean;
  onDelete?: (transaction: TransactionDto) => void;
  deletingTransactionId?: string | null;
}

const typeIcon = (type: TransactionDto["type"]) => {
  switch (type) {
    case "Deposit":
      return <ArrowDownLeft className="w-4 h-4 text-[#2ead4b]" aria-hidden />;
    case "Withdrawal":
      return <ArrowUpRight className="w-4 h-4 text-[#d03238]" aria-hidden />;
    default:
      return <ArrowRightLeft className="w-4 h-4 text-[#454745]" aria-hidden />;
  }
};

const typeLabel = (type: TransactionDto["type"]) => {
  switch (type) {
    case "Deposit": return "Deposit";
    case "Withdrawal": return "Withdrawal";
    case "TransferDebit": return "Transfer out";
    case "TransferCredit": return "Transfer in";
  }
};

const amountClass = (type: TransactionDto["type"]) => {
  if (type === "Deposit" || type === "TransferCredit")
    return "text-[#2ead4b] tabular-nums";
  return "text-[#d03238] tabular-nums";
};

const formatAmount = (amount: string, type: TransactionDto["type"]) => {
  const abs = Math.abs(parseFloat(amount));
  const prefix = type === "Deposit" || type === "TransferCredit" ? "+" : "−";
  return `${prefix}$${abs.toFixed(2)}`;
};

const isReversalEntry = (tx: TransactionDto) =>
  tx.description.startsWith("Reversal of ");

const getReversedOriginalIds = (transactions: TransactionDto[]) => {
  const ids = new Set<string>();

  for (const tx of transactions) {
    if (!isReversalEntry(tx)) continue;

    const remainder = tx.description.substring("Reversal of ".length);
    const originalId = remainder.split(":", 2)[0]?.trim();
    if (originalId) ids.add(originalId);
  }

  return ids;
};

export function TransactionList({
  transactions,
  canDelete,
  onDelete,
  deletingTransactionId,
}: TransactionListProps) {
  const reversedOriginalIds = getReversedOriginalIds(transactions);

  if (transactions.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-[#868685]">
        No transactions yet.
      </div>
    );
  }

  return (
    <table className="w-full text-sm" aria-label="Transaction history">
      <thead>
        <tr className="border-b border-[#e8ebe6]">
          <th className="text-left py-2 px-0 text-xs font-semibold text-[#868685] uppercase tracking-wide w-8" aria-hidden>
            &nbsp;
          </th>
          <th className="text-left py-2 text-xs font-semibold text-[#868685] uppercase tracking-wide">
            Description
          </th>
          <th className="text-left py-2 text-xs font-semibold text-[#868685] uppercase tracking-wide hidden sm:table-cell">
            Category
          </th>
          <th className="text-left py-2 text-xs font-semibold text-[#868685] uppercase tracking-wide hidden md:table-cell">
            Date
          </th>
          <th className="text-right py-2 text-xs font-semibold text-[#868685] uppercase tracking-wide">
            Amount
          </th>
          {onDelete && (
            <th className="text-right py-2 text-xs font-semibold text-[#868685] uppercase tracking-wide">
              Actions
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {transactions.map((tx) => {
          const isReversedOriginal = reversedOriginalIds.has(tx.id);
          const shouldHideDelete = isReversalEntry(tx) || isReversedOriginal;
          const showDelete = !!onDelete && !!canDelete?.(tx) && !shouldHideDelete;

          return (
          <tr key={tx.id} className="border-b border-[#e8ebe6] last:border-0">
            <td className="py-3 pr-3" aria-label={typeLabel(tx.type)}>
              {typeIcon(tx.type)}
            </td>
            <td className={`py-3 font-medium ${isReversedOriginal ? "text-[#d03238] line-through decoration-[#d03238]" : "text-[#0e0f0c]"}`}>
              {tx.description}
              <span className="block sm:hidden text-xs text-[#868685] font-normal">
                {tx.categoryName}
              </span>
            </td>
            <td className={`py-3 hidden sm:table-cell ${isReversedOriginal ? "text-[#d03238] line-through decoration-[#d03238]" : "text-[#454745]"}`}>
              {tx.categoryName ? (
                <span className="inline-flex items-center rounded-full bg-[#e2f6d5] text-[#054d28] text-xs font-semibold px-2.5 py-0.5">
                  {tx.categoryName}
                </span>
              ) : (
                <span className="text-[#868685]">—</span>
              )}
            </td>
            <td className={`py-3 hidden md:table-cell ${isReversedOriginal ? "text-[#d03238] line-through decoration-[#d03238]" : "text-[#454745]"}`}>
              {new Date(tx.postedAt).toLocaleDateString()}
            </td>
            <td className={`py-3 text-right font-semibold ${isReversedOriginal ? "text-[#d03238] line-through decoration-[#d03238]" : amountClass(tx.type)}`}>
              {formatAmount(tx.amount, tx.type)}
            </td>
            {onDelete && (
              <td className="py-3 pl-3 text-right">
                {showDelete ? (
                  <button
                    type="button"
                    onClick={() => onDelete(tx)}
                    disabled={deletingTransactionId === tx.id}
                    className="inline-flex items-center rounded-full border border-[#d03238]/40 px-3 py-1 text-xs font-semibold text-[#8d0f15] hover:bg-[#320707]/10 disabled:opacity-60"
                  >
                    {deletingTransactionId === tx.id ? "Deleting..." : "Delete"}
                  </button>
                ) : (
                  <span className="text-[#868685] text-xs">-</span>
                )}
              </td>
            )}
          </tr>
          );
        })}
      </tbody>
    </table>
  );
}
