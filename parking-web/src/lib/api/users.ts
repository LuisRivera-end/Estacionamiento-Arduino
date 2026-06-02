import { apiGet, apiPost } from "./client";
import type { StaffProfile, StaffUserCreateRequest } from "./types";

export async function getStaffUsers(accessToken: string): Promise<StaffProfile[]> {
  return apiGet<StaffProfile[]>("/api/v1/admin/users", { accessToken });
}

export async function createStaffUser(
  payload: StaffUserCreateRequest,
  accessToken: string,
): Promise<StaffProfile> {
  return apiPost<StaffProfile>("/api/v1/admin/users", payload, { accessToken });
}
