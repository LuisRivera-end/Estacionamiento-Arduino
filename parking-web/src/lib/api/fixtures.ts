import type {
  BackupExport,
  SimulatedPayment,
  StatusResponse,
  SummaryReport,
  TicketCalculation,
  TicketResponse,
} from "./types";

export const statusFixture: StatusResponse = {
  capacity_total: 40,
  occupied_spaces: 12,
  available_spaces: 28,
  active_tickets: 12,
  last_entry_at: "2026-05-23T08:30:00-06:00",
  last_exit_at: "2026-05-23T09:05:00-06:00",
};

export const summaryFixture: SummaryReport = {
  entries_today: 34,
  exits_today: 22,
  paid_tickets: 18,
  lost_tickets: 2,
  simulated_revenue_today: 430,
  total_discount_today: 80,
  discounted_payments_senior: 2,
  discounted_payments_student: 3,
};

export const ticketFixture: TicketResponse = {
  ticket_code: "A1B2C",
  status: "active",
  payment_status: "unpaid",
  entry_at: "2026-05-23T09:10:00-06:00",
  paid_at: null,
  exit_at: null,
  lost_ticket: false,
};

export const calculationFixture: TicketCalculation = {
  ticket_code: "A1B2C",
  duration_minutes: 64,
  free_tolerance_minutes: 5,
  subtotal_amount: 20,
  discount_type: "none",
  discount_percent: 0,
  discount_amount: 0,
  amount: 20,
  currency: "MXN",
  lost_ticket_discount_applied: false,
};

export const paymentFixture: SimulatedPayment = {
  payment_id: "simulated-payment-id",
  ticket_code: "A1B2C",
  status: "simulated",
  subtotal_amount: 20,
  discount_type: "none",
  discount_percent: 0,
  discount_amount: 0,
  amount: 20,
  simulation_reference: "sim_payment_A1B2C_20260523_001",
  provider_reference: "sim_payment_A1B2C_20260523_001",
};

export const backupFixture: BackupExport = {
  backup_id: "backup-id",
  status: "requested",
};
