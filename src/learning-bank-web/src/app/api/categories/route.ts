import { auth } from "@/lib/auth";
import { apiRequest } from "@/lib/api-client";
import { errorResponse } from "@/lib/api-error";
import { NextRequest, NextResponse } from "next/server";

async function getToken(): Promise<string> {
  const session = await auth();
  return (session as unknown as { accessToken?: string })?.accessToken ?? "";
}

export async function GET() {
  const token = await getToken();
  try {
    const data = await apiRequest("/categories", {}, token);
    return NextResponse.json(data);
  } catch (e: unknown) {
    return errorResponse(e);
  }
}

export async function POST(req: NextRequest) {
  const token = await getToken();
  const body = await req.json();
  try {
    const data = await apiRequest("/categories", { method: "POST", body: JSON.stringify(body) }, token);
    return NextResponse.json(data, { status: 201 });
  } catch (e: unknown) {
    return errorResponse(e);
  }
}
