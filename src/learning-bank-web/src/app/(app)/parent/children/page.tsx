import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getChildren, getMe, getPendingTransferRequests, getCoAdminParents } from "@/lib/server-api";
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
  const [children, pendingRequests, coAdmins] = await Promise.all([
    getChildren(),
    getPendingTransferRequests(),
    getCoAdminParents(),
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

      {coAdmins.length > 0 && (
        <section>
          <h2 className="text-base font-black text-[#0e0f0c] mb-3">
            Co-Admin Parents ({coAdmins.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coAdmins.map((admin: any) => (
              <div key={admin.id} className="bg-white rounded-[24px] p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)]">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-[#0e0f0c]">{admin.displayName}</p>
                    <p className="text-xs text-[#868685]">{admin.email}</p>
                  </div>
                  {!admin.isActive && (
                    <span className="rounded-full bg-[#d03238]/10 text-[#d03238] text-xs font-semibold px-2 py-0.5">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#454745] mt-2">
                  Manages {admin.linkedChildrenCount} shared {admin.linkedChildrenCount === 1 ? 'child' : 'children'}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-base font-black text-[#0e0f0c] mb-3">Linked Children</h2>
        <ChildrenClient childItems={children} balances={balances} />
      </section>
    </div>
  );
}
