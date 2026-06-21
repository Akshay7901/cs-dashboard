Wire the full Contracts API into the Decision Reviewer (DR) and Author dashboards.

## DR — proposal detail (`src/routes/dashboard.proposal.$ticket.tsx`)

Extend the existing Contract sidebar card with full management:

- **View PDF inline** — open `GET /{ticket}/contract/document` in a modal with `<iframe>` (auth header via blob URL fetch, since the endpoint requires Bearer).
- **Void contract** — button on each active (`status === "sent"`) contract → confirmation modal with reason textarea → `POST /{ticket}/contract/void` → refresh contracts + proposal.
- **Resend / Issue new contract** — when latest is voided/declined/expired, surface the existing "Issue Contract" flow.
- **Query thread** — new "Contract Queries" card below the Contract card:
  - `GET /{ticket}/contract/queries` listing alternating `query` / `response` entries chronologically.
  - For each unanswered author query, inline "Respond" form → `POST /{ticket}/contract/query/respond` with `query_id`.
  - Highlight when `proposal_status === "queries_raised"` (action required).

## Author — proposal detail (`src/routes/dashboard.author_proposal.$id.tsx`)

Add a "Contract" section visible once a contract exists:

- Fetch `GET /{ticket}/contract` (author shape: single `contract`).
- Show version, status, sent/expiry dates, recipient.
- **View PDF** button → modal iframe via `GET /contract/document`.
- **Sign contract** button (when `status === "sent"` and proposal status not `queries_raised`):
  - Calls `GET /{ticket}/contract/signing-url` on click → opens returned `signing_url` in new tab.
  - Disabled with tooltip when `proposal_status === "queries_raised"` ("Awaiting reviewer response").
- **Raise a query** form → `POST /{ticket}/contract/query` with `query_text` + `category: "contract"`.
- **Query thread** below — same `GET /contract/queries` rendering as DR (read-only for author).

## Shared helpers

Create `src/lib/contractsApi.ts` with typed helpers (`getContract`, `getQueries`, `raiseQuery`, `respondQuery`, `voidContract`, `getSigningUrl`, `fetchContractPdfBlob`) wrapping `proposalApiFetch` so both dashboards share logic.

A small `<ContractPdfModal>` component (in `src/components/contract-pdf-modal.tsx`) fetches the PDF as a blob with the Bearer header and renders it in an iframe via `URL.createObjectURL`.

## Out of scope

- DocuSign webhook receiver (server-side, already handled by the API).
- Editing contract template fields (already covered by the existing "Issue Contract" modal on the DR side).
