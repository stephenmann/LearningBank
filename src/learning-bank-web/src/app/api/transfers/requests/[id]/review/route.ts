import { auth } from "@/lib/auth";
import { apiRequest } from "@/lib/api-client";
import { errorResponse } from "@/lib/api-error";
import { NextRequest, NextResponse } from "next/server";

async function getToken(): Promise<string> {
  const session = await auth();
  return (session as unknown as { accessToken?: string })?.accessToken ?? "";
}

// POST /api/transfers/requests/[id]/review
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken();
  const { id } = await params;
  const body = await req.json();

  try {
    await apiRequest(`/transfers/requests/${id}/review`, { method: "POST", body: JSON.stringify(body) }, token);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return errorResponse(e);
  }
}
