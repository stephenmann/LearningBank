import { auth } from "@/lib/auth";
import { apiRequest } from "@/lib/api-client";
import { NextRequest, NextResponse } from "next/server";

async function getToken(): Promise<string> {
  const session = await auth();
  return (session as unknown as { accessToken?: string })?.accessToken ?? "";
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  const token = await getToken();
  const { transactionId } = await params;
  const body = await req.json();

  try {
    await apiRequest(`/transactions/${transactionId}`, { method: "DELETE", body: JSON.stringify(body) }, token);
    return new NextResponse(null, { status: 204 });
  } catch (e: unknown) {
    const err = e as { status?: number; message?: string };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
