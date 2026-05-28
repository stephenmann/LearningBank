"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import type { CategoryDto } from "@/types/api";
import { X } from "lucide-react";

const schema = z.object({
  amount: z.number().positive("Amount must be positive"),
  description: z.string().max(500).optional().default(""),
  categoryId: z.string().uuid("Select a category"),
});

type FormData = z.infer<typeof schema>;

interface DepositFormProps {
  childId: string;
  categories: CategoryDto[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function DepositForm({ childId, categories, onSuccess, onCancel }: DepositFormProps) {
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (raw: Record<string, unknown>) => {
    const data = raw as FormData;
    setError(null);
    const res = await fetch("/api/deposits", {
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
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" role="dialog" aria-modal aria-label="Add deposit">
      <div className="bg-white rounded-[24px] p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-[#0e0f0c]">Add Deposit</h2>
          <button onClick={onCancel} aria-label="Close" className="p-1 rounded-lg hover:bg-[#e8ebe6] transition-colors">
            <X className="w-5 h-5 text-[#454745]" aria-hidden />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <div>
            <label htmlFor="dep-amount" className="block text-sm font-semibold text-[#0e0f0c] mb-1.5">
              Amount ($)
            </label>
            <input
              id="dep-amount"
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
            <label htmlFor="dep-desc" className="block text-sm font-semibold text-[#0e0f0c] mb-1.5">
              Description (optional)
            </label>
            <input
              id="dep-desc"
              type="text"
              {...register("description")}
              className="w-full rounded-[12px] border border-[#0e0f0c] px-4 py-3 text-[#0e0f0c] text-base focus:outline-none focus:ring-2 focus:ring-[#9fe870] focus:border-transparent"
              placeholder="e.g. Weekly allowance"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-[#d03238]">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="dep-cat" className="block text-sm font-semibold text-[#0e0f0c] mb-1.5">
              Category
            </label>
            <select
              id="dep-cat"
              {...register("categoryId")}
              className="w-full rounded-[12px] border border-[#0e0f0c] px-4 py-3 text-[#0e0f0c] text-base focus:outline-none focus:ring-2 focus:ring-[#9fe870] focus:border-transparent bg-white"
            >
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="mt-1 text-sm text-[#d03238]">{errors.categoryId.message}</p>
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
              className="flex-1 py-3 rounded-[24px] bg-[#9fe870] text-[#0e0f0c] font-semibold hover:bg-[#cdffad] transition-colors disabled:opacity-60"
            >
              {isSubmitting ? "Adding…" : "Add Deposit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
