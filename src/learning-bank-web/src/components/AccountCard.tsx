interface AccountCardProps {
  title: string;
  balance: string;
  children?: React.ReactNode;
}

export function AccountCard({ title, balance, children }: AccountCardProps) {
  const amount = parseFloat(balance);

  return (
    <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)]">
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
            ${Math.abs(amount).toFixed(2)}
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
