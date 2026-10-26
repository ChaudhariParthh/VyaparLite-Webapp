# VyaparLite Webapp

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white" alt="TypeScript 5.8" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" alt="Vite" />
</p>

A lightweight, Indian-business-friendly cash flow tracker for recording income and expenses, managing categories, and understanding monthly performance without spreadsheet clutter.

## Overview

VyaparLite is built for small businesses such as kirana stores, retail shops, and service providers who need a simple way to track money in and money out in real time. The app emphasizes clarity, privacy, and fast daily use:

- record transactions in seconds
- see monthly cash flow at a glance
- organize spending by category
- review reports and export CSV data
- keep each business's financial data isolated with Supabase Row Level Security

## Why this app

This project is intentionally focused on a narrow but useful problem: helping a business owner answer one question quickly:

> "How much did I make, how much did I spend, and what is my net cash flow this month?"

It is not positioned as a full accounting, GST, or tax suite. It is a clean ledger and reporting layer designed for operational clarity.

## Feature highlights

- Dashboard overview with net cash flow, income, expense, and recent entries
- Transaction ledger with search, filtering, sorting, and deletion/edit flows
- Category management for income and expense buckets
- Monthly trend visualization and category breakdown reports
- CSV export for off-platform analysis
- Business profile/settings and sign-in flow
- India-focused money handling with INR formatting and IST date logic

## App flow

The main routes in the app are:

- `/` — landing page and product overview
- `/auth` — sign in / authentication screen
- `/dashboard` — overview of current period and live totals
- `/transactions` — searchable ledger and record management
- `/reports` — periodic reporting and CSV export
- `/categories` — income/expense category organization
- `/settings` — business profile and account settings

## Architecture and security model

<details>
<summary>Click to expand</summary>

Financial data is read and written from the browser via the Cloud client with Supabase RLS as the security boundary. The ownership model is enforced through `owns_business` and ownership columns are frozen by update triggers.

This keeps the MVP simple without requiring privileged server-side logic for every financial action. The app treats client-side business data access as the controlled path, while database rules enforce the actual safety boundary.

Money math is handled in `src/lib/finance.ts` using integer paise values to avoid float drift. The core calculations are validated by `src/test/finance.test.ts`.

</details>

## Tech stack

- React 19 + TypeScript
- Vite + TanStack Router
- TanStack Query for server state
- Supabase for auth and database
- Tailwind CSS + custom UI primitives
- Recharts for trend charts

## Project structure

```text
.
├── src/
│   ├── components/
│   │   ├── app/
│   │   └── ui/
│   ├── hooks/
│   ├── integrations/
│   │   └── supabase/
│   ├── lib/
│   │   ├── data.ts
│   │   ├── finance.ts
│   │   ├── categories.ts
│   │   └── utils.ts
│   ├── routes/
│   │   ├── __root.tsx
│   │   ├── auth.tsx
│   │   ├── index.tsx
│   │   ├── reset-password.tsx
│   │   └── _authenticated/
│   ├── styles.css
│   ├── router.tsx
│   ├── server.ts
│   ├── start.ts
│   └── test/
│       └── finance.test.ts
├── package.json
├── README.md
├── tsconfig.json
├── vite.config.ts
└── supabase/
```

## Local development

### Prerequisites

- Node.js 18+
- npm
- Supabase project credentials (for local or hosted app data)

### Install and run

```bash
git clone <repository-url>
cd VyaparLite-Webapp
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal.

## Scripts

```bash
npm run dev        # start the Vite dev server
npm run build      # production build
npm run preview    # preview production build locally
npm run lint       # ESLint checks
npm run test        # run Vitest tests
npm run test:watch # watch mode
```

## Financial logic guardrails

This app is intentionally designed around a few core rules:

- all currency math is in paise, never raw floating-point rupees
- amounts are validated as positive values with at most two decimal places
- date logic uses Asia/Kolkata for daily business context
- CSV export sanitizes formulas to prevent spreadsheet injection

## Security and data handling

The app is built for a small-business MVP where financial data remains in the browser via the Supabase client, with database-level permission rules enforcing ownership boundaries. This is a deliberate tradeoff to keep the experience fast and secure for this use case without introducing heavy backend complexity.

## Contribution

Contributions are welcome. If you want to extend the app, please keep these principles in mind:

- preserve the business ownership/security boundary
- use the shared finance utilities instead of ad hoc money math
- keep the code aligned with the project’s India-focused business workflow
- validate changes with the test suite and linting

## Built with Lovable

This project was created and is intended to be developed in the Lovable editor. You can continue iterating on the app there while keeping the GitHub repo synced.

---

VyaparLite keeps the numbers simple and the business logic honest. For a business owner, that means less spreadsheet stress and more confidence in day-to-day cash flow decisions.
