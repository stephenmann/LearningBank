import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import type { UserDto } from "@/types/api";
import { apiRequest } from "@/lib/api-client";
import { UserPreferenceScopeProvider } from "@/lib/user-preferences";

async function getUser(token: string): Promise<UserDto | null> {
  return apiRequest<UserDto>("/me", {}, token).catch(() => null);
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/sign-in");

  const token = (session as unknown as { accessToken?: string })?.accessToken ?? "";
  const user = await getUser(token);

  const role = (user?.role ?? "Parent") as "Parent" | "Child";
  const displayName = user?.displayName ?? session.user?.name ?? "User";
  const preferenceScopeId = user?.preferenceScopeId ?? `fallback:${user?.id ?? "anon"}`;
  const shellClassName = role === "Child" ? "lb-child-shell" : "lb-parent-shell";
  const surfaceClassName = role === "Child" ? "lb-child-surface" : "lb-parent-surface";

  return (
    <UserPreferenceScopeProvider scopeId={preferenceScopeId}>
      <div className={`min-h-screen flex flex-col ${shellClassName}`}>
        <AppNav
          role={role}
          displayName={displayName}
          onSignOut={async () => {
            "use server";
            await signOut({ redirectTo: "/sign-in" });
          }}
        />
        <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 sm:px-6 py-8">
          <div className={`rounded-[28px] px-4 py-5 sm:px-6 sm:py-6 ${surfaceClassName}`}>
            {children}
          </div>
        </main>
      </div>
    </UserPreferenceScopeProvider>
  );
}
