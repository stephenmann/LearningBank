import { auth } from "@/lib/auth";
import { apiRequest } from "@/lib/api-client";
import { errorResponse } from "@/lib/api-error";
import { NextRequest, NextResponse } from "next/server";

async function getToken(): Promise<string> {
  const session = await auth();
  return (session as unknown as { accessToken?: string })?.accessToken ?? "";
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken();
  const { id } = await params;
  const body = await req.json();
  try {
    const data = await apiRequest(`/categories/${id}`, { method: "PUT", body: JSON.stringify(body) }, token);
    return NextResponse.json(data);
  } catch (e: unknown) {
    return errorResponse(e);
  }
}
