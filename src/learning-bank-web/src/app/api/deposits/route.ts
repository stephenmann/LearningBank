import { auth } from "@/lib/auth";
import { apiRequest } from "@/lib/api-client";
import { errorResponse } from "@/lib/api-error";
import { NextRequest, NextResponse } from "next/server";

async function getToken(): Promise<string> {
  const session = await auth();
  return (session as unknown as { accessToken?: string })?.accessToken ?? "";
}

// POST /api/deposits
export async function POST(req: NextRequest) {
  const token = await getToken();
  const body = await req.json();

  try {
    await apiRequest("/deposits", { method: "POST", body: JSON.stringify(body) }, token);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e: unknown) {
    return errorResponse(e);
  }
}
