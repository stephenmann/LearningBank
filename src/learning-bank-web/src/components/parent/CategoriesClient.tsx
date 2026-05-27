"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CategoryDto } from "@/types/api";
import { Plus, Archive, ArchiveRestore, Pencil, Check, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

interface CategoriesClientProps {
  categories: CategoryDto[];
}

const schema = z.object({
  name: z.string().min(1).max(100),
  isChildAllowed: z.boolean(),
});
type FormData = z.infer<typeof schema>;

export function CategoriesClient({ categories }: CategoriesClientProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { isChildAllowed: true },
  });

  const onCreate = async (data: FormData) => {
    setError(null);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) { setShowForm(false); reset(); router.refresh(); }
    else { const b = await res.json().catch(() => ({})); setError(b.error ?? "Failed to create."); }
  };

  const onUpdate = async (id: string, data: FormData) => {
    setError(null);
    const res = await fetch(`/api/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) { setEditingId(null); router.refresh(); }
    else { const b = await res.json().catch(() => ({})); setError(b.error ?? "Failed to update."); }
  };

  const toggleArchive = async (id: string, isArchived: boolean) => {
    const endpoint = isArchived ? `/api/categories/${id}/unarchive` : `/api/categories/${id}/archive`;
    const res = await fetch(endpoint, { method: "POST" });
    if (res.ok) router.refresh();
  };

  const startEdit = (cat: CategoryDto) => {
    setEditingId(cat.id);
    setValue("name", cat.name);
    setValue("isChildAllowed", cat.isChildAllowed);
  };

  const active = categories.filter((c) => !c.isArchived);
  const archived = categories.filter((c) => c.isArchived);

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="text-sm text-[#d03238]">{error}</p>}

      {/* Active categories */}
      <div className="bg-white rounded-[24px] p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e8ebe6]">
              <th className="text-left py-2 text-xs font-semibold text-[#868685] uppercase tracking-wide">Name</th>
              <th className="text-left py-2 text-xs font-semibold text-[#868685] uppercase tracking-wide">Child Allowed</th>
              <th className="py-2 w-24"></th>
            </tr>
          </thead>
          <tbody>
            {active.map((cat) => (
              <tr key={cat.id} className="border-b border-[#e8ebe6] last:border-0">
                {editingId === cat.id ? (
                  <>
                    <td className="py-2 pr-2">
                      <input {...register("name")} className="rounded-[8px] border border-[#0e0f0c] px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#9fe870]" />
                      {errors.name && <p className="text-xs text-[#d03238]">{errors.name.message}</p>}
                    </td>
                    <td className="py-2">
                      <input type="checkbox" {...register("isChildAllowed")} className="accent-[#9fe870]" />
                    </td>
                    <td className="py-2 flex gap-1 justify-end">
                      <button onClick={handleSubmit((d) => onUpdate(cat.id, d))} disabled={isSubmitting} aria-label="Save" className="p-1.5 rounded-lg bg-[#9fe870] hover:bg-[#cdffad] transition-colors">
                        <Check className="w-3.5 h-3.5" aria-hidden />
                      </button>
                      <button onClick={() => setEditingId(null)} aria-label="Cancel edit" className="p-1.5 rounded-lg bg-[#e8ebe6] hover:bg-[#c5edab] transition-colors">
                        <X className="w-3.5 h-3.5" aria-hidden />
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="py-3 font-medium text-[#0e0f0c]">{cat.name}</td>
                    <td className="py-3">
                      {cat.isChildAllowed ? (
                        <span className="rounded-full bg-[#e2f6d5] text-[#054d28] text-xs font-semibold px-2.5 py-0.5">Yes</span>
                      ) : (
                        <span className="rounded-full bg-[#e8ebe6] text-[#454745] text-xs font-semibold px-2.5 py-0.5">No</span>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => startEdit(cat)} aria-label={`Edit ${cat.name}`} className="p-1.5 rounded-lg hover:bg-[#e8ebe6] transition-colors">
                          <Pencil className="w-3.5 h-3.5 text-[#454745]" aria-hidden />
                        </button>
                        <button onClick={() => toggleArchive(cat.id, cat.isArchived)} aria-label={`Archive ${cat.name}`} className="p-1.5 rounded-lg hover:bg-[#e8ebe6] transition-colors">
                          <Archive className="w-3.5 h-3.5 text-[#454745]" aria-hidden />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={() => setShowForm(true)}
        className="flex items-center gap-2 px-5 py-2.5 rounded-[24px] bg-[#9fe870] text-[#0e0f0c] font-semibold hover:bg-[#cdffad] transition-colors w-fit"
      >
        <Plus className="w-4 h-4" aria-hidden />
        New Category
      </button>

      {/* Archived */}
      {archived.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[#868685] mb-2">Archived</h3>
          <div className="flex flex-wrap gap-2">
            {archived.map((cat) => (
              <div key={cat.id} className="flex items-center gap-2 bg-[#e8ebe6] rounded-full px-3 py-1.5 text-sm text-[#454745]">
                {cat.name}
                <button onClick={() => toggleArchive(cat.id, cat.isArchived)} aria-label={`Restore ${cat.name}`} className="hover:text-[#0e0f0c] transition-colors">
                  <ArchiveRestore className="w-3.5 h-3.5" aria-hidden />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" role="dialog" aria-modal>
          <div className="bg-white rounded-[24px] p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-xl font-black text-[#0e0f0c] mb-6">New Category</h2>
            <form onSubmit={handleSubmit(onCreate)} noValidate className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#0e0f0c] mb-1.5">Name</label>
                <input type="text" {...register("name")} className="w-full rounded-[12px] border border-[#0e0f0c] px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#9fe870] focus:border-transparent" />
                {errors.name && <p className="mt-1 text-sm text-[#d03238]">{errors.name.message}</p>}
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" {...register("isChildAllowed")} className="accent-[#9fe870] w-4 h-4" />
                <span className="text-sm font-semibold text-[#0e0f0c]">Children can use this category</span>
              </label>
              {error && <p className="text-sm text-[#d03238]">{error}</p>}
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => { setShowForm(false); reset(); }} className="flex-1 py-3 rounded-[24px] bg-[#e8ebe6] text-[#0e0f0c] font-semibold hover:bg-[#c5edab] transition-colors">Cancel</button>
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
