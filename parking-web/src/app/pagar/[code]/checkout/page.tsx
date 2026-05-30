import { PaymentShell } from "@/components/payment/PaymentShell";
import { SimulatedCheckoutCard } from "@/components/payment/SimulatedCheckoutCard";
import { normalizeTicketCode } from "@/lib/formatters";
import type { DiscountRequest, DiscountType } from "@/lib/api/types";

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { code } = await params;
  const resolvedSearchParams = await searchParams;
  const ticketCode = normalizeTicketCode(code);
  const rawDiscountType = resolvedSearchParams.discount_type;
  const discountTypeValue = Array.isArray(rawDiscountType)
    ? rawDiscountType[0]
    : rawDiscountType;
  const discountType: DiscountType =
    discountTypeValue === "senior" || discountTypeValue === "student"
      ? discountTypeValue
      : "none";

  const discount: DiscountRequest =
    discountType === "student"
      ? {
          type: "student",
          student_email: String(resolvedSearchParams.student_email ?? ""),
        }
      : discountType === "senior"
        ? {
            type: "senior",
            senior_age: Number.parseInt(String(resolvedSearchParams.senior_age ?? ""), 10),
            senior_document_type: String(resolvedSearchParams.senior_document_type ?? ""),
            senior_document_last4: String(resolvedSearchParams.senior_document_last4 ?? ""),
          }
        : { type: "none" };

  return (
    <PaymentShell>
      <SimulatedCheckoutCard discount={discount} ticketCode={ticketCode} />
    </PaymentShell>
  );
}
