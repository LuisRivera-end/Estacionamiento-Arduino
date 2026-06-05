import { PaymentShell } from "@/components/payment/PaymentShell";
import { SimulatedCheckoutCard } from "@/components/payment/SimulatedCheckoutCard";
import { normalizeTicketCode } from "@/lib/formatters";
import type { DiscountRequest, DiscountType, SeniorIdentifierType } from "@/lib/api/types";

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
            senior_identifier_type: String(
              resolvedSearchParams.senior_identifier_type ?? "code",
            ) as SeniorIdentifierType,
            senior_identifier_value: String(
              resolvedSearchParams.senior_identifier_value ?? "",
            ),
          }
        : { type: "none" };

  return (
    <PaymentShell maxW={{ base: "580px", lg: "1000px" }}>
      <SimulatedCheckoutCard discount={discount} ticketCode={ticketCode} />
    </PaymentShell>
  );
}
