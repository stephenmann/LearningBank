import { auth } from "@/lib/auth";
import { apiRequest } from "@/lib/api-client";
import { NextRequest, NextResponse } from "next/server";

async function getToken(): Promise<string> {
  const session = await auth();
  return (session as unknown as { accessToken?: string })?.accessToken ?? "";
}

// POST /api/transfers/checking-to-savings
export async function POST(req: NextRequest) {
  const token = await getToken();
  const body = await req.json();

  try {
    await apiRequest("/transfers/checking-to-savings", { method: "POST", body: JSON.stringify(body) }, token);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e: unknown) {
    const err = e as { status?: number; message?: string };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
