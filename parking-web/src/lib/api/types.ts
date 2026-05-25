export type TicketStatus = "active" | "paid" | "exited" | "lost" | "cancelled";

export type PaymentStatus = "unpaid" | "paid" | "exempted" | "refunded";

export type StatusResponse = {
  capacity_total: number;
  occupied_spaces: number;
  available_spaces: number;
  active_tickets: number;
  last_entry_at: string | null;
  last_exit_at: string | null;
};

export type TicketResponse = {
  ticket_code: string;
  status: TicketStatus;
  payment_status: PaymentStatus;
  entry_at: string;
  paid_at: string | null;
  exit_at: string | null;
  lost_ticket: boolean;
};

export type TicketCalculation = {
  ticket_code: string;
  duration_minutes: number;
  free_tolerance_minutes: number;
  amount: number;
  currency: string;
};

export type SimulatedPayment = {
  payment_id: string;
  ticket_code: string;
  status: "simulated";
  amount: number;
  provider_reference: string;
};

export type SummaryReport = {
  entries_today: number;
  exits_today: number;
  paid_tickets: number;
  lost_tickets: number;
  simulated_revenue_today: number;
};

export type BackupExport = {
  backup_id: string;
  status: "requested" | "completed" | "failed";
};
