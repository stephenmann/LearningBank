"use client";

import { useUserPreferences } from "@/lib/user-preferences";

interface AccountCardProps {
  title: string;
  balance: string;
  children?: React.ReactNode;
}

export function AccountCard({ title, balance, children }: AccountCardProps) {
  const amount = parseFloat(balance);
  const { formatCurrency } = useUserPreferences();

  return (
    <div className="bg-white rounded-[24px] p-6 border border-[#dbe2d7] shadow-[0_12px_24px_-20px_rgba(0,0,0,0.45)]">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-[#868685] uppercase tracking-wide mb-1">
            {title}
          </p>
          <p
            className={`text-3xl font-black tabular-nums ${
              amount < 0 ? "text-[#d03238]" : "text-[#0e0f0c]"
            }`}
          >
            {formatCurrency(Math.abs(amount))}
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
