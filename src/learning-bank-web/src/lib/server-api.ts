import { auth } from "@/lib/auth";
import { apiRequest } from "@/lib/api-client";
import type {
  AccountSummaryDto,
  CategoryDto,
  ChildDto,
  TransferRequestDto,
  UserDto,
} from "@/types/api";

/** Server-side helpers that pull the session token and call the API. */

async function getToken(): Promise<string> {
  const session = await auth();
  // NextAuth JWT contains the provider token; in a BFF pattern we use the
  // session JWT itself signed with AUTH_SECRET.
  return (session as unknown as { accessToken?: string })?.accessToken ?? "";
}

export async function getMe(): Promise<UserDto | null> {
  const token = await getToken();
  return apiRequest<UserDto>("/me", {}, token).catch(() => null);
}

export async function getChildren(): Promise<ChildDto[]> {
  const token = await getToken();
  return apiRequest<ChildDto[]>("/children", {}, token);
}

export async function getAccountSummary(
  childId: string,
  account: "checking" | "savings"
): Promise<AccountSummaryDto> {
  const token = await getToken();
  return apiRequest<AccountSummaryDto>(
    `/children/${childId}/accounts/${account}`,
    {},
    token
  );
}

export async function getCategories(): Promise<CategoryDto[]> {
  const token = await getToken();
  return apiRequest<CategoryDto[]>("/categories", {}, token);
}

export async function getTransferRequests(
  childId: string
): Promise<TransferRequestDto[]> {
  const token = await getToken();
  return apiRequest<TransferRequestDto[]>(
    `/children/${childId}/transfers/requests`,
    {},
    token
  );
}

export async function getPendingTransferRequests(): Promise<TransferRequestDto[]> {
  const token = await getToken();
  return apiRequest<TransferRequestDto[]>(
    "/transfers/requests/pending",
    {},
    token
  );
}

export async function getCoAdminParents(): Promise<any[]> {
  const token = await getToken();
  return apiRequest<any[]>(
    "/parents/admins",
    {},
    token
  ).catch(() => []);
}
