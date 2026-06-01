from enum import StrEnum


def enum_values(enum_cls: type[StrEnum]) -> list[str]:
    return [member.value for member in enum_cls]


class TicketStatus(StrEnum):
    ACTIVE = "active"
    EXITED = "exited"
    CANCELLED = "cancelled"


class PaymentStatus(StrEnum):
    UNPAID = "unpaid"
    PAID = "paid"
    EXEMPTED = "exempted"
    REFUNDED = "refunded"


class PaymentMethod(StrEnum):
    SIMULATED_PAYMENT = "simulated_payment"
    SIMULATED_STRIPE = "simulated_stripe"
    MANUAL_ADMIN = "manual_admin"
    LOST_TICKET = "lost_ticket"


class PaymentResult(StrEnum):
    SIMULATED = "simulated"
    SUCCEEDED = "succeeded"
    VOIDED = "voided"
    FAILED = "failed"


class DiscountType(StrEnum):
    NONE = "none"
    SENIOR = "senior"
    STUDENT = "student"


class DeviceType(StrEnum):
    ENTRY = "entry"
    EXIT = "exit"


class BackupStatus(StrEnum):
    REQUESTED = "requested"
    COMPLETED = "completed"
    FAILED = "failed"


class StaffRole(StrEnum):
    ADMIN = "admin"
    PANELIST = "panelist"


class StaffStatus(StrEnum):
    ACTIVE = "active"
    DISABLED = "disabled"
