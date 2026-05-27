import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import type { UserDto } from "@/types/api";
import { apiRequest } from "@/lib/api-client";

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

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav
        role={role}
        displayName={displayName}
        onSignOut={async () => {
          "use server";
          await signOut({ redirectTo: "/sign-in" });
        }}
      />
      <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}
