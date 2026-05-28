import { auth } from "@/lib/auth";
import { signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  getAccountSummary,
  getCategories,
  getChildren,
  getMe,
  getTransferRequests,
} from "@/lib/server-api";
import type { ChildDto } from "@/types/api";
import { DashboardClient } from "@/components/DashboardClient";
import { ParentChildTabs } from "@/components/ParentChildTabs";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ child?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  if (!session) redirect("/sign-in");

  const user = await getMe();
  if (!user) {
    return (
      <div className="max-w-md bg-white rounded-[24px] p-6 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)]">
        <h1 className="text-xl font-black text-[#0e0f0c] mb-2">You&apos;re signed in, but setup isn&apos;t complete</h1>
        <p className="text-sm text-[#454745] mb-4">
          We could not resolve your API user profile after authentication. This is usually an API availability issue or an Azure tenant/app configuration mismatch.
        </p>
        <p className="text-sm text-[#454745] mb-6">
          Ensure the API is running at <span className="font-semibold">http://localhost:5001/health</span>, then check <span className="font-semibold">AZURE_AD_TENANT_ID</span> and your Entra app registration supported account types.
        </p>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/sign-in" });
          }}
        >
          <button
            type="submit"
            className="px-5 py-2.5 rounded-[24px] bg-[#9fe870] text-[#0e0f0c] font-semibold hover:bg-[#cdffad] transition-colors"
          >
            Sign out and retry
          </button>
        </form>
      </div>
    );
  }

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
            Your parent account is ready. Create a child account to view balances and manage transactions.
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

    // Determine which child to display
    const childFromParam = params.child ? children.find((c) => c.id === params.child) : null;
    const selectedChild = childFromParam || children[0];

    activeChildId = selectedChild!.id;
    activeChildName = selectedChild!.displayName;
  }

  const [checking, savings, categories, transferRequests] = await Promise.all([
    getAccountSummary(activeChildId, "checking"),
    getAccountSummary(activeChildId, "savings"),
    getCategories(),
    getTransferRequests(activeChildId),
  ]);

  const pendingRequests = transferRequests.filter((r) => r.status === "Pending");

  return (
    <div>
      {user.role === "Parent" && allChildren.length > 0 && (
        <ParentChildTabs
          childList={allChildren}
          activeChildId={activeChildId}
          activeChildName={activeChildName}
          parentDisplayName={user.displayName}
        />
      )}

      {user.role === "Child" && (
        <div className="mb-6">
          <h1 className="text-2xl font-black text-[#0e0f0c]">
            Hello, {user.displayName.split(" ")[0]}!
          </h1>
          <p className="text-sm text-[#454745] mt-1">
            Here&apos;s your money overview.
          </p>
        </div>
      )}

      <DashboardClient
        childId={activeChildId}
        checking={checking}
        savings={savings}
        categories={categories}
        pendingRequests={pendingRequests}
        role={user.role}
      />
    </div>
  );
}
