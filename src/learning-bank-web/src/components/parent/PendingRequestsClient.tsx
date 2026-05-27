"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TransferRequestDto } from "@/types/api";
import { Check, X } from "lucide-react";

interface PendingRequestsClientProps {
  requests: TransferRequestDto[];
}

export function PendingRequestsClient({ requests }: PendingRequestsClientProps) {
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const review = async (id: string, approve: boolean) => {
    setProcessing(id);
    setError(null);
    const res = await fetch(`/api/transfers/requests/${id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approve }),
    });
    setProcessing(null);
    if (res.ok) {
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to process request.");
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p className="text-sm text-[#d03238] bg-[#320707]/10 rounded-lg px-4 py-2">{error}</p>
      )}
      {requests.map((req) => (
        <div key={req.id} className="bg-white rounded-[24px] p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)] flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#0e0f0c]">{req.childDisplayName}</p>
            <p className="text-sm text-[#454745]">
              Requesting{" "}
              <span className="font-black tabular-nums">${parseFloat(req.amount).toFixed(2)}</span>
              {" "}from Savings
            </p>
            {req.note && (
              <p className="text-xs text-[#868685] mt-0.5 italic">&quot;{req.note}&quot;</p>
            )}
            <p className="text-xs text-[#868685] mt-0.5">
              {new Date(req.requestedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => review(req.id, false)}
              disabled={processing === req.id}
              aria-label="Reject transfer request"
              className="p-2 rounded-full bg-[#d03238]/10 text-[#d03238] hover:bg-[#d03238]/20 transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" aria-hidden />
            </button>
            <button
              onClick={() => review(req.id, true)}
              disabled={processing === req.id}
              aria-label="Approve transfer request"
              className="p-2 rounded-full bg-[#9fe870] text-[#0e0f0c] hover:bg-[#cdffad] transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" aria-hidden />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
