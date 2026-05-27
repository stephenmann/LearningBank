import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCategories, getMe } from "@/lib/server-api";
import { CategoriesClient } from "@/components/parent/CategoriesClient";

export default async function CategoriesPage() {
  const session = await auth();
  if (!session) redirect("/sign-in");

  const user = await getMe();
  if (!user || user.role !== "Parent") redirect("/dashboard");

  const categories = await getCategories();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-[#0e0f0c]">Deposit Categories</h1>
        <p className="text-sm text-[#454745] mt-1">
          Manage the categories children can use when making deposits.
        </p>
      </div>
      <CategoriesClient categories={categories} />
    </div>
  );
}
