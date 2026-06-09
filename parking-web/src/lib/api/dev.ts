import { apiPost } from "./client";
import type { EntryTicketResponse } from "./types";

export async function createTestTicket(accessToken: string): Promise<EntryTicketResponse> {
  return apiPost<EntryTicketResponse>("/api/v1/admin/dev/ticket", {}, { accessToken });
}
