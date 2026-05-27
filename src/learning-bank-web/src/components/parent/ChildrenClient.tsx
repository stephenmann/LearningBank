"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ChildDto } from "@/types/api";
import { UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

interface Balance {
  childId: string;
  checking: string;
  savings: string;
}

interface ChildrenClientProps {
  childItems: ChildDto[];
  balances: Balance[];
}

const schema = z.object({
  displayName: z.string().min(1).max(256),
  email: z.string().email().max(256),
});
type FormData = z.infer<typeof schema>;

export function ChildrenClient({ childItems, balances }: ChildrenClientProps) {
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const getBalance = (childId: string) =>
    balances.find((b) => b.childId === childId);

  const onSubmit = async (data: FormData) => {
    setError(null);
    const res = await fetch("/api/children", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setShowForm(false);
      reset();
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to create child account.");
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {childItems.map((child) => {
          const bal = getBalance(child.id);
          return (
            <div key={child.id} className="bg-white rounded-[24px] p-5 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)]">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-black text-[#0e0f0c]">{child.displayName}</p>
                  <p className="text-xs text-[#868685]">{child.email}</p>
                </div>
                {!child.isActive && (
                  <span className="rounded-full bg-[#d03238]/10 text-[#d03238] text-xs font-semibold px-2 py-0.5">
                    Inactive
                  </span>
                )}
              </div>
              {bal && (
                <div className="flex gap-4 mt-3 pt-3 border-t border-[#e8ebe6]">
                  <div>
                    <p className="text-xs text-[#868685]">Checking</p>
                    <p className="font-black tabular-nums text-[#0e0f0c]">${parseFloat(bal.checking).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#868685]">Savings</p>
                    <p className="font-black tabular-nums text-[#0e0f0c]">${parseFloat(bal.savings).toFixed(2)}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={() => setShowForm(true)}
        className="flex items-center gap-2 px-5 py-2.5 rounded-[24px] bg-[#9fe870] text-[#0e0f0c] font-semibold hover:bg-[#cdffad] transition-colors"
      >
        <UserPlus className="w-4 h-4" aria-hidden />
        Add Child Account
      </button>

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" role="dialog" aria-modal>
          <div className="bg-white rounded-[24px] p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-black text-[#0e0f0c] mb-6">Add Child Account</h2>
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#0e0f0c] mb-1.5">
                  Child&apos;s Name
                </label>
                <input
                  type="text"
                  {...register("displayName")}
                  className="w-full rounded-[12px] border border-[#0e0f0c] px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#9fe870] focus:border-transparent"
                />
                {errors.displayName && <p className="mt-1 text-sm text-[#d03238]">{errors.displayName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#0e0f0c] mb-1.5">
                  Email (for sign-in matching)
                </label>
                <input
                  type="email"
                  {...register("email")}
                  className="w-full rounded-[12px] border border-[#0e0f0c] px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#9fe870] focus:border-transparent"
                />
                {errors.email && <p className="mt-1 text-sm text-[#d03238]">{errors.email.message}</p>}
              </div>
              {error && <p className="text-sm text-[#d03238]">{error}</p>}
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-[24px] bg-[#e8ebe6] text-[#0e0f0c] font-semibold hover:bg-[#c5edab] transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 rounded-[24px] bg-[#9fe870] text-[#0e0f0c] font-semibold hover:bg-[#cdffad] transition-colors disabled:opacity-60">
                  {isSubmitting ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
