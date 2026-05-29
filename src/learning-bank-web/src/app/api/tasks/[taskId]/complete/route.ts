import { auth } from "@/lib/auth";
import { apiRequest } from "@/lib/api-client";
import { NextResponse } from "next/server";

async function getToken(): Promise<string> {
  const session = await auth();
  return (session as unknown as { accessToken?: string })?.accessToken ?? "";
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const token = await getToken();
  const { taskId } = await params;

  try {
    await apiRequest(`/tasks/${taskId}/complete`, { method: "POST" }, token);
    return new NextResponse(null, { status: 204 });
  } catch (e: unknown) {
    const err = e as { status?: number; message?: string };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
