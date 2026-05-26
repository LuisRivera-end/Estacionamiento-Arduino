export type TicketStatus = "active" | "paid" | "exited" | "lost" | "cancelled";

export type PaymentStatus = "unpaid" | "paid" | "exempted" | "refunded";
export type StaffRole = "admin" | "panelist";
export type StaffStatus = "active" | "disabled";

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

export type BackupItem = {
  backup_id: string;
  status: "requested" | "completed" | "failed";
  requested_by: string | null;
  created_at: string;
};

export type ParkingSettings = {
  capacity_total: number;
  timezone: string;
  currency: string;
};

export type PricingRule = {
  name: string;
  free_tolerance_minutes: number;
  block_minutes: number;
  block_amount: number;
  lost_ticket_fee: number;
  is_active: boolean;
};

export type AdminTicketItem = {
  ticket_code: string;
  status: string;
  payment_status: string;
  entry_at: string;
  paid_at: string | null;
  exit_at: string | null;
  calculated_amount: number;
  lost_ticket: boolean;
};

export type AdminPaymentItem = {
  payment_id: string;
  ticket_code: string;
  amount: number;
  method: string;
  status: string;
  provider_reference: string | null;
  created_by: string | null;
  created_at: string;
};

export type AdminEventItem = {
  event_at: string;
  event_type: "entry" | "exit";
  ticket_code: string;
  device_id: string | null;
  result: string;
};

export type StaffProfile = {
  user_id: string;
  email: string;
  display_name: string | null;
  role: StaffRole;
  status: StaffStatus;
  created_at: string;
  updated_at: string;
};

export type BootstrapResponse = {
  created: boolean;
  first_login: boolean;
  profile: StaffProfile;
};

export type AuthSetupStatus = {
  allow_initial_account_creation: boolean;
};
