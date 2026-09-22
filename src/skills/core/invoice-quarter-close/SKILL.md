---
name: invoice-quarter-close
description:
  Closes a VAT quarter per company, reconciling bank movements, classifying
  expenses and verifying filed models. Trigger when the context contains the
  accounting platform, the invoicing portal, bank CSV exports, modelo
  303/111/115, or a quarter-close ask. Triggers (ES) are trimestre, IVA,
  facturas que faltan, movimientos, cerrar el trimestre, gastos deducibles,
  Hacienda. Do not use for drafting contracts, payroll, or building invoicing
  software features.
allowed-tools: Read, Grep, Glob, Bash, TodoWrite
argument-hint: [company-or-quarter]
---

## Rules

- Verify every amount and status against the live source (the accounting
  platform's API, the bank CSV, the filed model PDFs); never infer them from
  stale context or earlier chat turns.
- The method lives in the instance's wiki, not here. Read its quarter-close
  playbook (the steps, the API gotchas, supplier treatment) before acting, and
  its mission-state page for where this quarter stands. Company identifiers and
  per-company API keys live on their own wiki pages; this skill names none of
  them.
- Document listings without an explicit date range are silently capped to recent
  documents on every platform seen so far. An empty result without a date range
  proves nothing.
- Reconcile by supplier, never by amount. Grouped payments, arrears, and credit
  notes make totals diverge while the books are correct.
- Never print a secret (API key, certificate password, mailbox credential) into
  chat, commits, or notes. Reference the wiki page that holds it instead.
- Anything booked manually that already exists in the invoicing portal needs its
  `provider_link` recorded, or the next export duplicates it.

## Workflow

1. Establish scope. Which company (or companies), which quarter, and which
   playbook steps the ask actually covers. Read the playbook and the
   mission-state page first.
2. Pull the ground truth for the scope. The quarter's bank CSV plus the previous
   quarter's, and the purchase and sales documents for the exact date range.
3. Reconcile and classify per the playbook. Expense to book, previous-year
   invoice, same-day net-zero, or not an expense at all. Flag anything the
   playbook's supplier table already decides.
4. Hunt missing invoices in the playbook's order (local archive, invoicing
   portal, mailbox, messaging history) and record where each one was found.
5. Book, fix the invoicing portal in real time, and verify against the filed
   models. Report figures with their source next to them; never a number without
   provenance.
6. Close by updating the mission-state page with what changed and what is still
   open, so the next quarter session starts from truth.

## Output

- Return: the per-company reconciliation result (booked, pending,
  not-an-expense), the missing invoices found and still missing with the source
  checked, discrepancies against the filed models, and the invoicing-portal
  fixes applied.
- State which playbook steps ran, which were out of scope, and what the next
  session must pick up.
