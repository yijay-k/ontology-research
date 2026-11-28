#!/usr/bin/env python3
"""
Project Wide World Importers' sales tables into receivables CSVs for upload.

Input: the raw table exports from NVIDIA/auto-ontology-eval
(datasets/wideworldimporters, Microsoft sample, MIT). Usage:

    python3 -I scripts/demo/wwi/prepare.py <raw-dir> <out-dir>

Source column names are kept as WWI spells them (CustomerID, BillToCustomerID ...)
so the drafter meets real naming, not names chosen to match. What changes:
`\\N` becomes empty, large JSON/text and audit columns are dropped, an invoice
carries its amounts from its Customer Invoice transaction plus a DueDate
(InvoiceDate + the bill-to customer's PaymentDays), and payments are the
Customer Payment Received transactions, as positive amounts.

Large tables are written in parts under ~900 KB, because a dataset file upload
is one request body and Fastify's default limit is 1 MB.
"""
import csv
import datetime
import os
import sys

PART_BYTES = 900_000


def read(raw, name):
    with open(os.path.join(raw, name), newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            yield {k: ("" if v == "\\N" else v) for k, v in row.items()}


def write(out, table, columns, rows):
    os.makedirs(os.path.join(out, table), exist_ok=True)
    part, size, f, w, count = 0, PART_BYTES, None, None, 0
    for row in rows:
        if size >= PART_BYTES:
            if f:
                f.close()
            part += 1
            f = open(os.path.join(out, table, f"part-{part:03d}.csv"), "w", newline="", encoding="utf-8")
            w = csv.writer(f)
            w.writerow(columns)
            size = 0
        values = [row[c] for c in columns]
        w.writerow(values)
        size += sum(len(v) for v in values) + len(values)
        count += 1
    if f:
        f.close()
    print(f"{table}: {count} rows in {part} file(s)")
    return count


def main(raw, out):
    customers = list(read(raw, "Sales.Customers.csv"))
    payment_days = {c["CustomerID"]: int(c["PaymentDays"]) for c in customers}

    write(out, "customers", [
        "CustomerID", "CustomerName", "BillToCustomerID", "CustomerCategoryID", "BuyingGroupID",
        "CreditLimit", "AccountOpenedDate", "StandardDiscountPercentage", "IsOnCreditHold", "PaymentDays",
    ], customers)
    write(out, "customer_categories", ["CustomerCategoryID", "CustomerCategoryName"], read(raw, "Sales.CustomerCategories.csv"))
    write(out, "buying_groups", ["BuyingGroupID", "BuyingGroupName"], read(raw, "Sales.BuyingGroups.csv"))
    write(out, "payment_methods", ["PaymentMethodID", "PaymentMethodName"], read(raw, "Application.PaymentMethods.csv"))

    invoice_tx, payments = {}, []
    for t in read(raw, "Sales.CustomerTransactions.csv"):
        if t["TransactionTypeID"] == "1":
            if t["InvoiceID"] in invoice_tx:
                raise SystemExit(f"invoice {t['InvoiceID']} has two invoice transactions")
            invoice_tx[t["InvoiceID"]] = t
        elif t["TransactionTypeID"] == "3":
            payments.append({
                "PaymentID": t["CustomerTransactionID"],
                "CustomerID": t["CustomerID"],
                "PaymentMethodID": t["PaymentMethodID"],
                "PaymentDate": t["TransactionDate"],
                "Amount": f"{-float(t['TransactionAmount']):.2f}",
            })

    def invoices():
        for i in read(raw, "Sales.Invoices.csv"):
            t = invoice_tx.get(i["InvoiceID"])
            if t is None:
                raise SystemExit(f"invoice {i['InvoiceID']} has no invoice transaction")
            due = datetime.date.fromisoformat(i["InvoiceDate"]) + datetime.timedelta(days=payment_days[i["BillToCustomerID"]])
            yield {
                "InvoiceID": i["InvoiceID"],
                "CustomerID": i["CustomerID"],
                "BillToCustomerID": i["BillToCustomerID"],
                "OrderID": i["OrderID"],
                "SalespersonPersonID": i["SalespersonPersonID"],
                "InvoiceDate": i["InvoiceDate"],
                "DueDate": due.isoformat(),
                "IsCreditNote": i["IsCreditNote"],
                "AmountExcludingTax": t["AmountExcludingTax"],
                "TaxAmount": t["TaxAmount"],
                "TransactionAmount": t["TransactionAmount"],
                "OutstandingBalance": t["OutstandingBalance"],
                "IsFinalized": t["IsFinalized"],
                "FinalizationDate": t["FinalizationDate"],
            }

    write(out, "invoices", [
        "InvoiceID", "CustomerID", "BillToCustomerID", "OrderID", "SalespersonPersonID", "InvoiceDate", "DueDate",
        "IsCreditNote", "AmountExcludingTax", "TaxAmount", "TransactionAmount", "OutstandingBalance",
        "IsFinalized", "FinalizationDate",
    ], invoices())
    write(out, "payments", ["PaymentID", "CustomerID", "PaymentMethodID", "PaymentDate", "Amount"], payments)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    main(sys.argv[1], sys.argv[2])
