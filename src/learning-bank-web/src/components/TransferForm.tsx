"use client";

import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { X } from "lucide-react";
import { useUserPreferences } from "@/lib/user-preferences";

const schema = z.object({
  amount: z.number().positive("Amount must be positive"),
  description: z.string().max(500).optional().default(""),
});

type FormData = z.infer<typeof schema>;

interface TransferFormProps {
  childId: string;
  direction: "to-savings" | "to-checking-request";
  maxAmount: number;
  helpMessage?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TransferForm({ childId, direction, maxAmount, helpMessage, onSuccess, onCancel }: TransferFormProps) {
  const [error, setError] = useState<string | null>(null);
  const { formatCurrency } = useUserPreferences();

  const maxLabel = formatCurrency(maxAmount);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(
      schema.extend({
        amount: z
          .number()
          .positive("Amount must be positive")
          .max(maxAmount, `Maximum available: ${maxLabel}`),
      })
    ),
  });

  const title = direction === "to-savings" ? "Transfer to Savings" : "Request Savings Withdrawal";
  const endpoint =
    direction === "to-savings"
      ? "/api/transfers/checking-to-savings"
      : "/api/transfers/savings-to-checking";

  const onSubmit = async (raw: Record<string, unknown>) => {
    const data = raw as FormData;
    setError(null);
    const body =
      direction === "to-savings"
        ? { childId, amount: data.amount, description: data.description }
        : { amount: data.amount, note: data.description };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      onSuccess();
    } else {
      const b = await res.json().catch(() => ({}));
      setError(b.error ?? "Something went wrong.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" role="dialog" aria-modal aria-label={title}>
      <div className="bg-white rounded-[24px] p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-[#0e0f0c]">{title}</h2>
          <button onClick={onCancel} aria-label="Close" className="p-1 rounded-lg hover:bg-[#e8ebe6] transition-colors">
            <X className="w-5 h-5 text-[#454745]" aria-hidden />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          {helpMessage && (
            <div className="rounded-[16px] border border-[#9fe870] bg-[#f5fde9] px-3 py-2 flex items-start gap-2">
              <Image
                src="/images/learning-bank-mascot-penny.svg"
                alt="Penny mascot"
                width={28}
                height={28}
                className="shrink-0 animate-[penny-float_2.2s_ease-in-out_infinite]"
              />
              <p className="text-sm text-[#163300]">{helpMessage}</p>
            </div>
          )}

          <div>
            <label htmlFor="tf-amount" className="block text-sm font-semibold text-[#0e0f0c] mb-1.5">
              Amount (max {maxLabel})
            </label>
            <input
              id="tf-amount"
              type="number"
              step="0.01"
              min="0.01"
              {...register("amount", { valueAsNumber: true })}
              className="w-full rounded-[12px] border border-[#0e0f0c] px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#9fe870] focus:border-transparent"
              placeholder="0.00"
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-[#d03238]">{errors.amount.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="tf-desc" className="block text-sm font-semibold text-[#0e0f0c] mb-1.5">
              {direction === "to-checking-request" ? "Note (optional)" : "Description (optional)"}
            </label>
            <input
              id="tf-desc"
              type="text"
              {...register("description")}
              className="w-full rounded-[12px] border border-[#0e0f0c] px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#9fe870] focus:border-transparent"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-[#d03238]">{errors.description.message}</p>
            )}
          </div>

          {error && (
            <p className="text-sm text-[#d03238] bg-[#320707]/10 rounded-lg px-4 py-2">{error}</p>
          )}

          <div className="flex gap-3 mt-2">
            <button type="button" onClick={onCancel} className="flex-1 py-3 rounded-[24px] bg-[#e8ebe6] text-[#0e0f0c] font-semibold hover:bg-[#c5edab] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="flex-1 py-3 rounded-[24px] bg-[#9fe870] text-[#0e0f0c] font-semibold hover:bg-[#cdffad] transition-colors disabled:opacity-60">
              {isSubmitting ? "Processing…" : "Confirm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
