# Finance and receivables domain pack — research brief

## Candidate core objects

LegalEntity, Customer, Supplier, Invoice, InvoiceLine, CreditNote, Payment, PaymentAllocation, BankTransaction, PurchaseOrder, Receipt, Dispute, Reminder, PromiseToPay, CollectionCase, LedgerEntry, TaxCode, Currency, Approval, PaymentInstruction and ReconciliationRun.

## Candidate workflows

Invoice ingestion and validation; customer/account matching; cash application; partial payment allocation; dispute handling; collection scheduling; promise-to-pay tracking; approval for credit/refund/payment; bank reconciliation; month-end close.

## High-value deterministic rules

- Exact match and tolerance thresholds for cash allocation.
- No double allocation of a bank transaction.
- Currency and rounding policies.
- Invoice status transitions and credit-note effects.
- Collection cadence, communication windows and stop conditions.
- Approval thresholds and separation of duties.
- Promise-to-pay due dates and missed-promise escalation.

The original archive contains deeper competitor and pricing research on Ramp, BILL, Upflow, Stripe and receivables vendors. Keep those business/product findings separate from the technical platform conclusions. Vendor workflow examples are useful design inputs, not universal accounting rules.