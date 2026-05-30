import { PaymentShell } from "@/components/payment/PaymentShell";
import { TicketCodeInput } from "@/components/payment/TicketCodeInput";

export default function PayPage() {
  return (
    <PaymentShell>
      <TicketCodeInput />
    </PaymentShell>
  );
}
