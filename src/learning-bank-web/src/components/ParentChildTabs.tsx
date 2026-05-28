"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { ChildDto } from "@/types/api";

interface ParentChildTabsProps {
  childList: ChildDto[];
  activeChildId: string;
  activeChildName: string;
  parentDisplayName: string;
}

export function ParentChildTabs({
  childList,
  activeChildId,
  activeChildName,
  parentDisplayName,
}: ParentChildTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSelectChild = (childId: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("child", childId);
    router.push(`/dashboard?${params.toString()}`);
  };

  if (childList.length === 0) return null;

  return (
    <div className="mb-6 flex flex-col gap-4">
      <div className="flex items-baseline gap-3">
        <h1 className="text-2xl font-black text-[#0e0f0c]">
          Hello, {parentDisplayName.split(" ")[0]}!
        </h1>
        {childList.length > 1 && (
          <p className="text-sm text-[#868685]">
            ({childList.length} child{childList.length > 1 ? "ren" : ""})
          </p>
        )}
      </div>

      {childList.length > 1 && (
        <div
          className="flex gap-2 border-b border-[#e8ebe6] overflow-x-auto pb-0"
          role="tablist"
        >
          {childList.map((child) => (
            <button
              key={child.id}
              role="tab"
              onClick={() => handleSelectChild(child.id)}
              aria-selected={activeChildId === child.id}
              className={`px-4 py-2 font-semibold text-sm rounded-t-[12px] transition-colors whitespace-nowrap ${
                activeChildId === child.id
                  ? "bg-[#9fe870] text-[#0e0f0c] border-b-2 border-[#9fe870]"
                  : "text-[#454745] hover:bg-[#e8ebe6]"
              }`}
            >
              {child.displayName}
              {!child.isActive && (
                <span className="ml-2 text-xs text-[#d03238]">(Inactive)</span>
              )}
            </button>
          ))}
        </div>
      )}

      <p className="text-sm text-[#454745]">
        Showing {activeChildName.split(" ")[0]}&apos;s money overview.
      </p>
    </div>
  );
}
