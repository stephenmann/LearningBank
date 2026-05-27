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
import { DashboardClient } from "@/components/DashboardClient";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/sign-in");

  const user = await getMe();
  if (!user) {
    return (
      <div className="max-w-md bg-white rounded-[24px] p-6 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)]">
        <h1 className="text-xl font-black text-[#0e0f0c] mb-2">You&apos;re signed in, but setup isn&apos;t complete</h1>
        <p className="text-sm text-[#454745] mb-4">
          We could not resolve your API user profile after authentication. This is usually an Azure tenant/app configuration mismatch.
        </p>
        <p className="text-sm text-[#454745] mb-6">
          Check <span className="font-semibold">AZURE_AD_TENANT_ID</span> and your Entra app registration supported account types, then try again.
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

  if (user.role === "Parent") {
    const children = await getChildren();
    const firstChild = children[0];

    if (!firstChild) {
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

    activeChildId = firstChild.id;
    activeChildName = firstChild.displayName;
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
      <div className="mb-6">
        <h1 className="text-2xl font-black text-[#0e0f0c]">
          Hello, {user.displayName.split(" ")[0]}!
        </h1>
        <p className="text-sm text-[#454745] mt-1">
          {user.role === "Parent"
            ? `Showing ${activeChildName.split(" ")[0]}'s money overview.`
            : "Here\'s your money overview."}
        </p>
      </div>

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
