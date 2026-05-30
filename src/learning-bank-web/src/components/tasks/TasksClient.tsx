"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Check, ClipboardCheck, RefreshCcw, Repeat, X } from "lucide-react";
import type { CategoryDto, LearningTaskDto, PendingTaskCompletionDto } from "@/types/api";
import { useUserPreferences } from "@/lib/user-preferences";

interface TasksClientProps {
  childId: string;
  role: "Parent" | "Child";
  tasks: LearningTaskDto[];
  pendingCompletions: PendingTaskCompletionDto[];
  categories: CategoryDto[];
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface TaskEditorState {
  taskId: string;
  title: string;
  monetaryValue: string;
  categoryId: string;
  targetAccount: "Checking" | "Savings";
  recurrenceType: "OneTime" | "Recurring";
  frequency: "Weekly" | "Biweekly";
  selectedDays: number[];
  startDate: string;
  endDate: string;
  maxOccurrences: string;
}

export function TasksClient({ childId, role, tasks, pendingCompletions, categories }: TasksClientProps) {
  const router = useRouter();
  const isParent = role === "Parent";
  const { formatCurrency } = useUserPreferences();

  const [title, setTitle] = useState("");
  const [monetaryValue, setMonetaryValue] = useState("");
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id ?? "");
  const [targetAccount, setTargetAccount] = useState<"Checking" | "Savings">("Checking");
  const [recurrenceType, setRecurrenceType] = useState<"OneTime" | "Recurring">("OneTime");
  const [frequency, setFrequency] = useState<"Weekly" | "Biweekly">("Weekly");
  const [selectedDays, setSelectedDays] = useState<number[]>([1]);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState<string>("");
  const [maxOccurrences, setMaxOccurrences] = useState<string>("");
  const [submittingTask, setSubmittingTask] = useState(false);
  const [actioningTaskId, setActioningTaskId] = useState<string | null>(null);
  const [reviewingCompletionId, setReviewingCompletionId] = useState<string | null>(null);
  const [editor, setEditor] = useState<TaskEditorState | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedTasks = useMemo(
    () => [...tasks].sort((a, b) => a.title.localeCompare(b.title)),
    [tasks]
  );

  const toggleDay = (day: number) => {
    setSelectedDays((current) => {
      if (current.includes(day)) {
        return current.filter((item) => item !== day);
      }
      return [...current, day].sort((a, b) => a - b);
    });
  };

  const refresh = () => router.refresh();

  const toDateInputValue = (value: string | null) => {
    if (!value) return "";
    return value.slice(0, 10);
  };

  const openEditor = (task: LearningTaskDto) => {
    setError(null);
    setEditor({
      taskId: task.id,
      title: task.title,
      monetaryValue: task.monetaryValue,
      categoryId: task.categoryId ?? categories[0]?.id ?? "",
      targetAccount: task.targetAccount,
      recurrenceType: task.recurrenceType,
      frequency: task.frequency ?? "Weekly",
      selectedDays: task.daysOfWeek.length ? task.daysOfWeek : [1],
      startDate: toDateInputValue(task.startDateUtc),
      endDate: toDateInputValue(task.endDateUtc),
      maxOccurrences: task.maxOccurrences ? String(task.maxOccurrences) : "",
    });
  };

  const handleCreateTask = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isParent || submittingTask) return;
    if (!categoryId) {
      setError("Please select a category.");
      return;
    }

    setError(null);
    setSubmittingTask(true);

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId,
          title,
          monetaryValue: parseFloat(monetaryValue),
          categoryId,
          targetAccount,
          recurrenceType,
          frequency: recurrenceType === "Recurring" ? frequency : null,
          daysOfWeek: recurrenceType === "Recurring" ? selectedDays : null,
          startDateUtc: startDate,
          endDateUtc: endDate || null,
          maxOccurrences: maxOccurrences ? parseInt(maxOccurrences, 10) : null,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body.error ?? "Unable to create task.");
        return;
      }

      setTitle("");
      setMonetaryValue("");
      setCategoryId(categories[0]?.id ?? "");
      setTargetAccount("Checking");
      setRecurrenceType("OneTime");
      setFrequency("Weekly");
      setSelectedDays([1]);
      setEndDate("");
      setMaxOccurrences("");
      refresh();
    } finally {
      setSubmittingTask(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    if (actioningTaskId) return;

    setError(null);
    setActioningTaskId(taskId);

    try {
      const response = await fetch(`/api/tasks/${taskId}/complete`, {
        method: "POST",
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body.error ?? "Unable to mark task completed.");
        return;
      }

      refresh();
    } finally {
      setActioningTaskId(null);
    }
  };

  const handleReviewCompletion = async (completionId: string, approve: boolean) => {
    if (reviewingCompletionId) return;

    setError(null);
    setReviewingCompletionId(completionId);

    try {
      const response = await fetch(`/api/tasks/completions/${completionId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approve }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body.error ?? "Unable to review task completion.");
        return;
      }

      refresh();
    } finally {
      setReviewingCompletionId(null);
    }
  };

  const handleEditorDayToggle = (day: number) => {
    if (!editor) return;

    const selected = editor.selectedDays.includes(day)
      ? editor.selectedDays.filter((item) => item !== day)
      : [...editor.selectedDays, day].sort((a, b) => a - b);

    setEditor({ ...editor, selectedDays: selected });
  };

  const handleSaveEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editor || savingEdit) return;
    if (!editor.categoryId) {
      setError("Please select a category.");
      return;
    }

    setError(null);
    setSavingEdit(true);

    try {
      const response = await fetch(`/api/tasks/${editor.taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editor.title,
          monetaryValue: parseFloat(editor.monetaryValue),
          categoryId: editor.categoryId,
          targetAccount: editor.targetAccount,
          recurrenceType: editor.recurrenceType,
          frequency: editor.recurrenceType === "Recurring" ? editor.frequency : null,
          daysOfWeek: editor.recurrenceType === "Recurring" ? editor.selectedDays : null,
          startDateUtc: editor.startDate,
          endDateUtc: editor.endDate || null,
          maxOccurrences: editor.maxOccurrences ? parseInt(editor.maxOccurrences, 10) : null,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body.error ?? "Unable to update task.");
        return;
      }

      setEditor(null);
      refresh();
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {isParent && (
        <section className="bg-white rounded-[24px] p-5 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.08)]">
          <h2 className="text-base font-black text-[#0e0f0c]">Create New Task</h2>
          <p className="text-sm text-[#454745] mt-1">Create rewards your child can complete and submit for review.</p>

          <form onSubmit={handleCreateTask} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-xs font-semibold text-[#454745] uppercase tracking-wide">Task title</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                required
                className="rounded-[14px] border border-[#c8d1c4] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9fe870]"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-[#454745] uppercase tracking-wide">Reward amount</span>
              <input
                value={monetaryValue}
                onChange={(e) => setMonetaryValue(e.target.value)}
                type="number"
                min="0.01"
                step="0.01"
                required
                className="rounded-[14px] border border-[#c8d1c4] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9fe870]"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-[#454745] uppercase tracking-wide">Category</span>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                disabled={categories.length === 0}
                className="rounded-[14px] border border-[#c8d1c4] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9fe870] disabled:opacity-60"
              >
                {categories.length === 0 ? (
                  <option value="">No categories available</option>
                ) : (
                  categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))
                )}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-[#454745] uppercase tracking-wide">Deposit account</span>
              <select
                value={targetAccount}
                onChange={(e) => setTargetAccount(e.target.value as "Checking" | "Savings")}
                className="rounded-[14px] border border-[#c8d1c4] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9fe870]"
              >
                <option value="Checking">Checking</option>
                <option value="Savings">Savings</option>
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-[#454745] uppercase tracking-wide">Type</span>
              <select
                value={recurrenceType}
                onChange={(e) => setRecurrenceType(e.target.value as "OneTime" | "Recurring")}
                className="rounded-[14px] border border-[#c8d1c4] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9fe870]"
              >
                <option value="OneTime">One time</option>
                <option value="Recurring">Recurring</option>
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-[#454745] uppercase tracking-wide">Start date</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="rounded-[14px] border border-[#c8d1c4] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9fe870]"
              />
            </label>

            {recurrenceType === "Recurring" && (
              <>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-[#454745] uppercase tracking-wide">Frequency</span>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as "Weekly" | "Biweekly")}
                    className="rounded-[14px] border border-[#c8d1c4] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9fe870]"
                  >
                    <option value="Weekly">Weekly</option>
                    <option value="Biweekly">Biweekly</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-[#454745] uppercase tracking-wide">Optional end date</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="rounded-[14px] border border-[#c8d1c4] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9fe870]"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-[#454745] uppercase tracking-wide">Optional max occurrences</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={maxOccurrences}
                    onChange={(e) => setMaxOccurrences(e.target.value)}
                    className="rounded-[14px] border border-[#c8d1c4] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9fe870]"
                  />
                </label>

                <div className="md:col-span-2">
                  <p className="text-xs font-semibold text-[#454745] uppercase tracking-wide mb-2">Days of week</p>
                  <div className="flex flex-wrap gap-2">
                    {DAY_LABELS.map((label, index) => {
                      const selected = selectedDays.includes(index);
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => toggleDay(index)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                            selected
                              ? "bg-[#9fe870] text-[#0e0f0c]"
                              : "bg-[#e8ebe6] text-[#454745] hover:bg-[#c5edab]"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={submittingTask || categories.length === 0}
                className="px-5 py-2.5 rounded-[18px] bg-[#9fe870] text-[#0e0f0c] font-semibold hover:bg-[#cdffad] disabled:opacity-60 transition-colors"
              >
                {submittingTask ? "Creating..." : "Create task"}
              </button>
            </div>
          </form>
        </section>
      )}

      {isParent && pendingCompletions.length > 0 && (
        <section className="bg-[#ffd11a]/20 border border-[#ffd11a] rounded-[20px] p-4">
          <h2 className="text-base font-black text-[#4a3b1c] flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4" aria-hidden />
            Completions Waiting For Review ({pendingCompletions.length})
          </h2>
          <div className="mt-3 flex flex-col gap-2">
            {pendingCompletions.map((completion) => (
              <div
                key={completion.completionId}
                className="rounded-[12px] bg-white/90 border border-[#e8ebe6] px-3 py-2 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#0e0f0c] font-semibold">{completion.taskTitle}</p>
                  <p className="text-xs text-[#454745] mt-0.5">
                    Reward {formatCurrency(parseFloat(completion.monetaryValue))} to {completion.targetAccount.toLowerCase()} • submitted {new Date(completion.completedByChildAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReviewCompletion(completion.completionId, false)}
                    disabled={reviewingCompletionId === completion.completionId}
                    className="p-2 rounded-full bg-[#d03238]/10 text-[#d03238] hover:bg-[#d03238]/20 disabled:opacity-50 transition-colors"
                    aria-label="Reject task completion"
                  >
                    <X className="w-4 h-4" aria-hidden />
                  </button>
                  <button
                    onClick={() => handleReviewCompletion(completion.completionId, true)}
                    disabled={reviewingCompletionId === completion.completionId}
                    className="p-2 rounded-full bg-[#9fe870] text-[#0e0f0c] hover:bg-[#cdffad] disabled:opacity-50 transition-colors"
                    aria-label="Approve task completion"
                  >
                    <Check className="w-4 h-4" aria-hidden />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {error && (
        <div className="bg-[#320707]/10 border border-[#d03238]/40 rounded-[16px] p-4">
          <p className="text-sm font-semibold text-[#8d0f15]">{error}</p>
        </div>
      )}

      <section>
        <h2 className="text-base font-black text-[#0e0f0c] mb-3">Task List</h2>
        {sortedTasks.length === 0 ? (
          <div className="bg-white rounded-[20px] p-6 border border-[#e8ebe6] text-sm text-[#454745]">
            No tasks yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {sortedTasks.map((task) => {
              const recurringSummary =
                task.recurrenceType === "Recurring"
                  ? `${task.frequency ?? "Weekly"} on ${task.daysOfWeek
                      .map((d) => DAY_LABELS[d] ?? "?")
                      .join(", ")}`
                  : "One time";

              const crossedOut = task.isCompletedForCurrentCycle;
              const pending = task.isPendingReview;

              return (
                <article
                  key={task.id}
                  className="bg-white rounded-[20px] p-4 border border-[#e8ebe6] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className={`text-base font-black text-[#0e0f0c] ${crossedOut ? "line-through decoration-2 opacity-70" : ""}`}>
                        {task.title}
                      </h3>
                      <p className="text-sm text-[#454745] mt-0.5">
                        Reward {formatCurrency(parseFloat(task.monetaryValue))} to {task.targetAccount.toLowerCase()}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-[#454745]">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#f2f5f0]">
                          <Repeat className="w-3.5 h-3.5" aria-hidden />
                          {recurringSummary}
                        </span>
                        {task.nextOccurrenceDateUtc && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#f2f5f0]">
                            <CalendarDays className="w-3.5 h-3.5" aria-hidden />
                            Next: {new Date(task.nextOccurrenceDateUtc).toLocaleDateString()}
                          </span>
                        )}
                        {crossedOut && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#9fe870]/25 text-[#1f4310]">
                            <Check className="w-3.5 h-3.5" aria-hidden />
                            Completed
                          </span>
                        )}
                        {pending && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#ffd11a]/25 text-[#4a3b1c]">
                            <RefreshCcw className="w-3.5 h-3.5" aria-hidden />
                            Pending parent review
                          </span>
                        )}
                      </div>
                      {task.lastReviewNote && (
                        <p className="text-xs text-[#454745] italic mt-2">&quot;{task.lastReviewNote}&quot;</p>
                      )}
                    </div>

                    {!isParent && (
                      <button
                        onClick={() => handleCompleteTask(task.id)}
                        disabled={!task.canMarkComplete || actioningTaskId === task.id}
                        className="shrink-0 px-4 py-2 rounded-[16px] text-sm font-semibold bg-[#9fe870] text-[#0e0f0c] hover:bg-[#cdffad] disabled:opacity-50 disabled:hover:bg-[#9fe870] transition-colors"
                      >
                        Mark completed
                      </button>
                    )}

                    {isParent && (
                      <button
                        type="button"
                        onClick={() => openEditor(task)}
                        className="shrink-0 px-4 py-2 rounded-[16px] text-sm font-semibold bg-[#e8ebe6] text-[#0e0f0c] hover:bg-[#c5edab] transition-colors"
                      >
                        Edit task
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {isParent && editor && (
        <div className="fixed inset-0 z-50 bg-black/45 px-4 py-6 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl bg-white rounded-[24px] p-5 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-black text-[#0e0f0c]">Edit Task</h3>
              <button
                type="button"
                onClick={() => setEditor(null)}
                className="p-2 rounded-full bg-[#e8ebe6] text-[#454745] hover:bg-[#d9ded7] transition-colors"
                aria-label="Close task editor"
              >
                <X className="w-4 h-4" aria-hidden />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1 md:col-span-2">
                <span className="text-xs font-semibold text-[#454745] uppercase tracking-wide">Task title</span>
                <input
                  value={editor.title}
                  onChange={(e) => setEditor({ ...editor, title: e.target.value })}
                  maxLength={200}
                  required
                  className="rounded-[14px] border border-[#c8d1c4] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9fe870]"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-[#454745] uppercase tracking-wide">Reward amount</span>
                <input
                  value={editor.monetaryValue}
                  onChange={(e) => setEditor({ ...editor, monetaryValue: e.target.value })}
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  className="rounded-[14px] border border-[#c8d1c4] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9fe870]"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-[#454745] uppercase tracking-wide">Category</span>
                <select
                  value={editor.categoryId}
                  onChange={(e) => setEditor({ ...editor, categoryId: e.target.value })}
                  required
                  disabled={categories.length === 0}
                  className="rounded-[14px] border border-[#c8d1c4] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9fe870] disabled:opacity-60"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-[#454745] uppercase tracking-wide">Deposit account</span>
                <select
                  value={editor.targetAccount}
                  onChange={(e) => setEditor({ ...editor, targetAccount: e.target.value as "Checking" | "Savings" })}
                  className="rounded-[14px] border border-[#c8d1c4] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9fe870]"
                >
                  <option value="Checking">Checking</option>
                  <option value="Savings">Savings</option>
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-[#454745] uppercase tracking-wide">Type</span>
                <select
                  value={editor.recurrenceType}
                  onChange={(e) => setEditor({ ...editor, recurrenceType: e.target.value as "OneTime" | "Recurring" })}
                  className="rounded-[14px] border border-[#c8d1c4] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9fe870]"
                >
                  <option value="OneTime">One time</option>
                  <option value="Recurring">Recurring</option>
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-[#454745] uppercase tracking-wide">Start date</span>
                <input
                  type="date"
                  value={editor.startDate}
                  onChange={(e) => setEditor({ ...editor, startDate: e.target.value })}
                  required
                  className="rounded-[14px] border border-[#c8d1c4] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9fe870]"
                />
              </label>

              {editor.recurrenceType === "Recurring" && (
                <>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-[#454745] uppercase tracking-wide">Frequency</span>
                    <select
                      value={editor.frequency}
                      onChange={(e) => setEditor({ ...editor, frequency: e.target.value as "Weekly" | "Biweekly" })}
                      className="rounded-[14px] border border-[#c8d1c4] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9fe870]"
                    >
                      <option value="Weekly">Weekly</option>
                      <option value="Biweekly">Biweekly</option>
                    </select>
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-[#454745] uppercase tracking-wide">Optional end date</span>
                    <input
                      type="date"
                      value={editor.endDate}
                      onChange={(e) => setEditor({ ...editor, endDate: e.target.value })}
                      className="rounded-[14px] border border-[#c8d1c4] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9fe870]"
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-[#454745] uppercase tracking-wide">Optional max occurrences</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={editor.maxOccurrences}
                      onChange={(e) => setEditor({ ...editor, maxOccurrences: e.target.value })}
                      className="rounded-[14px] border border-[#c8d1c4] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9fe870]"
                    />
                  </label>

                  <div className="md:col-span-2">
                    <p className="text-xs font-semibold text-[#454745] uppercase tracking-wide mb-2">Days of week</p>
                    <div className="flex flex-wrap gap-2">
                      {DAY_LABELS.map((label, index) => {
                        const selected = editor.selectedDays.includes(index);
                        return (
                          <button
                            key={label}
                            type="button"
                            onClick={() => handleEditorDayToggle(index)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                              selected
                                ? "bg-[#9fe870] text-[#0e0f0c]"
                                : "bg-[#e8ebe6] text-[#454745] hover:bg-[#c5edab]"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              <div className="md:col-span-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditor(null)}
                  className="px-4 py-2 rounded-[16px] text-sm font-semibold text-[#454745] hover:bg-[#e8ebe6] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2.5 rounded-[18px] bg-[#9fe870] text-[#0e0f0c] font-semibold hover:bg-[#cdffad] disabled:opacity-60 transition-colors"
                >
                  {savingEdit ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
