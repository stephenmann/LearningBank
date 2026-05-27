import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getChildren, getMe, getPendingTransferRequests } from "@/lib/server-api";
import { apiRequest } from "@/lib/api-client";
import { ChildrenClient } from "@/components/parent/ChildrenClient";
import { PendingRequestsClient } from "@/components/parent/PendingRequestsClient";
import type { AccountSummaryDto } from "@/types/api";

async function getToken(session: unknown): Promise<string> {
  return (session as { accessToken?: string })?.accessToken ?? "";
}

export default async function ChildrenPage() {
  const session = await auth();
  if (!session) redirect("/sign-in");

  const user = await getMe();
  if (!user || user.role !== "Parent") redirect("/dashboard");

  const token = await getToken(session);
  const [children, pendingRequests] = await Promise.all([
    getChildren(),
    getPendingTransferRequests(),
  ]);

  // Fetch balances for each child
  const balances = await Promise.all(
    children.map(async (child) => {
      const [checking, savings] = await Promise.all([
        apiRequest<AccountSummaryDto>(`/children/${child.id}/accounts/checking`, {}, token).catch(
          () => ({ balance: "0.00", transactions: [] })
        ),
        apiRequest<AccountSummaryDto>(`/children/${child.id}/accounts/savings`, {}, token).catch(
          () => ({ balance: "0.00", transactions: [] })
        ),
      ]);
      return { childId: child.id, checking: checking.balance, savings: savings.balance };
    })
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-black text-[#0e0f0c]">Children</h1>
        <p className="text-sm text-[#454745] mt-1">Manage linked child accounts.</p>
      </div>

      {pendingRequests.length > 0 && (
        <section>
          <h2 className="text-base font-black text-[#0e0f0c] mb-3">
            Pending Transfer Requests ({pendingRequests.length})
          </h2>
          <PendingRequestsClient requests={pendingRequests} />
        </section>
      )}

      <section>
        <h2 className="text-base font-black text-[#0e0f0c] mb-3">Linked Children</h2>
        <ChildrenClient childItems={children} balances={balances} />
      </section>
    </div>
  );
}
