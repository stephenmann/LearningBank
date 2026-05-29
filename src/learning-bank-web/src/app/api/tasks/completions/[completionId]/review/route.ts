import { auth } from "@/lib/auth";
import { apiRequest } from "@/lib/api-client";
import { NextRequest, NextResponse } from "next/server";

async function getToken(): Promise<string> {
  const session = await auth();
  return (session as unknown as { accessToken?: string })?.accessToken ?? "";
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ completionId: string }> }
) {
  const token = await getToken();
  const { completionId } = await params;
  const body = await req.json();

  try {
    await apiRequest(
      `/tasks/completions/${completionId}/review`,
      { method: "POST", body: JSON.stringify(body) },
      token
    );
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const err = e as { status?: number; message?: string };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
