"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { X } from "lucide-react";
import { useUserPreferences } from "@/lib/user-preferences";

const schema = z.object({
  amount: z.number().positive("Amount must be positive"),
  description: z.string().min(1, "Description is required").max(500),
});

type FormData = z.infer<typeof schema>;

interface WithdrawalFormProps {
  childId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function WithdrawalForm({ childId, onSuccess, onCancel }: WithdrawalFormProps) {
  const [error, setError] = useState<string | null>(null);
  const { currency } = useUserPreferences();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (raw: Record<string, unknown>) => {
    const data = raw as FormData;
    setError(null);
    const res = await fetch("/api/withdrawals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childId, ...data }),
    });
    if (res.ok) {
      onSuccess();
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" role="dialog" aria-modal aria-label="Log spending">
      <div className="bg-white rounded-[24px] p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-[#0e0f0c]">Log Spending</h2>
          <button onClick={onCancel} aria-label="Close" className="p-1 rounded-lg hover:bg-[#e8ebe6] transition-colors">
            <X className="w-5 h-5 text-[#454745]" aria-hidden />
          </button>
        </div>

        <p className="text-sm text-[#454745] mb-4">
          Record a real-world purchase or expense. This will appear as a withdrawal in the child&apos;s checking account.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <div>
            <label htmlFor="wd-amount" className="block text-sm font-semibold text-[#0e0f0c] mb-1.5">
              Amount ({currency})
            </label>
            <input
              id="wd-amount"
              type="number"
              step="0.01"
              min="0.01"
              {...register("amount", { valueAsNumber: true })}
              className="w-full rounded-[12px] border border-[#0e0f0c] px-4 py-3 text-[#0e0f0c] text-base focus:outline-none focus:ring-2 focus:ring-[#9fe870] focus:border-transparent"
              placeholder="0.00"
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-[#d03238]">{errors.amount.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="wd-desc" className="block text-sm font-semibold text-[#0e0f0c] mb-1.5">
              Description
            </label>
            <input
              id="wd-desc"
              type="text"
              {...register("description")}
              className="w-full rounded-[12px] border border-[#0e0f0c] px-4 py-3 text-[#0e0f0c] text-base focus:outline-none focus:ring-2 focus:ring-[#9fe870] focus:border-transparent"
              placeholder="e.g. Toy store purchase"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-[#d03238]">{errors.description.message}</p>
            )}
          </div>

          {error && (
            <p className="text-sm text-[#d03238] bg-[#320707]/10 rounded-lg px-4 py-2">{error}</p>
          )}

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 rounded-[24px] bg-[#e8ebe6] text-[#0e0f0c] font-semibold hover:bg-[#c5edab] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-[24px] bg-[#d03238] text-white font-semibold hover:bg-[#b02028] transition-colors disabled:opacity-60"
            >
              {isSubmitting ? "Logging…" : "Log Spending"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
