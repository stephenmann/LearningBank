import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCategories, getChildren, getMe, getPendingTaskCompletions, getTasks } from "@/lib/server-api";
import type { ChildDto } from "@/types/api";
import { ParentChildTabs } from "@/components/ParentChildTabs";
import { TasksClient } from "@/components/tasks/TasksClient";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ child?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  if (!session) redirect("/sign-in");

  const user = await getMe();
  if (!user) redirect("/dashboard");

  let activeChildId = user.id;
  let activeChildName = user.displayName;
  let allChildren: ChildDto[] = [];

  if (user.role === "Parent") {
    const children = await getChildren();
    allChildren = children;

    if (!children.length) {
      return (
        <div className="max-w-md bg-white rounded-[24px] p-6 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)]">
          <h1 className="text-xl font-black text-[#0e0f0c] mb-2">No child account linked yet</h1>
          <p className="text-sm text-[#454745] mb-4">
            Create a child account first, then you can assign tasks and approve completions.
          </p>
          <a
            href="/parent/children"
            className="inline-flex px-5 py-2.5 rounded-[24px] bg-[#9fe870] text-[#0e0f0c] font-semibold hover:bg-[#cdffad] transition-colors"
          >
            Go to Child Accounts
          </a>
        </div>
      );
    }

    const childFromParam = params.child ? children.find((c) => c.id === params.child) : null;
    const selectedChild = childFromParam || children[0];

    activeChildId = selectedChild!.id;
    activeChildName = selectedChild!.displayName;
  }

  const [tasks, pendingCompletions, categories] = await Promise.all([
    getTasks(activeChildId),
    user.role === "Parent" ? getPendingTaskCompletions(activeChildId) : Promise.resolve([]),
    user.role === "Parent" ? getCategories() : Promise.resolve([]),
  ]);

  return (
    <div>
      {user.role === "Parent" && allChildren.length > 0 && (
        <ParentChildTabs
          childList={allChildren}
          activeChildId={activeChildId}
          activeChildName={activeChildName}
          parentDisplayName={user.displayName}
          basePath="/tasks"
        />
      )}

      {user.role === "Child" && (
        <div className="mb-6">
          <h1 className="text-2xl font-black text-[#0e0f0c]">Tasks</h1>
          <p className="text-sm text-[#454745] mt-1">
            Complete tasks, submit them, and watch rewards arrive after parent approval.
          </p>
        </div>
      )}

      <TasksClient
        childId={activeChildId}
        role={user.role}
        tasks={tasks}
        pendingCompletions={pendingCompletions}
        categories={categories}
      />
    </div>
  );
}
