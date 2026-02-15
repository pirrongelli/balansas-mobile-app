# Balansas Mobile Banking Web App — Updated Development Plan

## 1) Objectives (Updated)
- Deliver a **mobile-first**, premium **modern fintech dark theme** web app (teal accent) that feels like a native mobile banking app (sticky header + bottom tabs + large tap targets).
- Use **real Supabase** for auth + data, while keeping testing safe (no shared credentials required from the client).
- Provide a production-grade UX baseline: **skeleton loading**, empty states, error states with retry, copy-to-clipboard toasts, and consistent provider/status visual language.
- Ensure maintainability and testability via consistent **`data-testid`** coverage and reusable UI components (shadcn/ui + Tailwind).

**Status:** The MVP (Auth + Core Banking + Payments/Payees + basic Settings/Team/Profile) has been implemented. Remaining work is mostly hardening, schema alignment, and any additional product features you request.

---

## Phase 1 — Core POC (Isolation) (prove Supabase + data flow)
**Goal:** validate the failure-prone external integration (Supabase auth + DB queries) before building full UI.

### Implementation Steps
1. **Web research (best practice)**: Supabase Auth (PKCE), MFA (TOTP), session refresh, RLS patterns.
2. Add frontend config:
   - Add `REACT_APP_SUPABASE_URL` + `REACT_APP_SUPABASE_ANON_KEY` to `/app/frontend/.env`.
   - Create `src/lib/supabaseClient.js`.
3. Minimal POC screens (no full app shell yet):
   - Login form → `supabase.auth.signInWithPassword`.
   - Session check (`getSession`) + refresh handling.
   - Post-login “Data Probe” page: run read-only queries to expected tables/views.
4. Create a small Node/Python script (repo-local, not shipped) that:
   - Calls Supabase REST endpoint to confirm project reachable.
   - Validates anon key works and reports auth/data errors clearly.
5. Fix until stable:
   - CORS / env / PKCE settings
   - RLS/read permissions (coordinate with you if schema/RLS blocks reads)

### User Stories (POC)
1. As a user, I can open the app and see whether Supabase connectivity is healthy.
2. As a user, I can submit email/password and see clear success/failure feedback.
3. As a user, I stay signed in after refresh if session exists.
4. As a user, I can see a “data probe” summary showing accounts/tx counts (or meaningful permission errors).
5. As a user, I can safely sign out and return to login.

### Success Criteria
- Supabase client initializes in browser without console errors.
- Login works for real users (you test with your credentials).
- Session persists across refresh; sign-out clears session.
- At least one read query works (or returns a clear RLS/permission diagnostic).

### Progress Update
- ✅ Phase 1 effectively merged into Phase 2 and completed as part of the full MVP build.

---

## Phase 2 — V1 App Development (MVP Core: Auth + Dashboard + Accounts + Transactions)
**Goal:** build the real app around the proven integration; deliver premium mobile UX.

### Implementation Steps
1. **Design system + app shell**
   - Apply tokens in `src/index.css` (dark teal theme), import Space Grotesk + Inter.
   - Replace scaffold `App.js` with routes + protected layout.
   - Build `AppShell`: sticky top header + fixed bottom tabs + safe-area padding.
   - Add Sonner toaster, skeleton primitives, and consistent badges.
2. **Auth flow (Supabase)**
   - Login screen (logo, email/password, validation, user-friendly error handling).
   - Forgot password UX.
   - MFA verification screen using `InputOTP`.
   - Protected routes + sign-out.
   - Customer context resolution:
     - Account owner via `customers.user_id`
     - Team member via `org_roles.user_id` → `customers.id`
3. **Dashboard (core banking overview)**
   - Total balance card + currency chips.
   - Quick actions.
   - Recent transactions preview.
   - Realtime refresh subscriptions.
4. **Accounts (Fiat + Crypto lists)**
   - Unified fiat accounts list (EU Rails + US Rails) with provider badges.
   - Crypto accounts list (US Rails) behind a Crypto tab.
   - Account detail page: balance + banking details + copy-to-clipboard toasts.
5. **Transactions**
   - Unified history list with search.
   - Filters: status + provider.
   - Pagination via “Load more”.
6. **Navigation + motion**
   - Bottom tabs: Dashboard, Accounts, Activity, Payments, More.
   - Sticky headers and mobile-first layout.
7. **Session UX**
   - Inactivity-based session timeout (30 minutes) with automatic sign-out.

### User Stories (V1)
1. As a user, I can log in and land on a dashboard that summarizes my balances.
2. As a user, I can switch between Accounts and see clearly which provider each account belongs to.
3. As a user, I can open an account and copy IBAN/routing/account numbers with one tap.
4. As a user, I can browse transactions and quickly filter by status/provider to find items fast.
5. As a user, I always understand loading/empty/error states and can retry failed loads.

### Success Criteria
- Mobile UX: bottom tabs + sticky headers + safe-area padding behave correctly.
- Dashboard, Accounts, Transactions load real Supabase data (or show clear permission errors).
- Consistent formatting: currency amounts, timestamps, provider badges, status colors.
- One end-to-end test pass by testing agent (login excluded; flows tested post-login UI states).

### Progress Update (Completed)
- ✅ Supabase client configured with real project URL + anon key.
- ✅ Dark theme tokens applied; Space Grotesk + Inter fonts imported.
- ✅ Auth implemented: login, validation, user-friendly auth error handling, forgot password, MFA verification.
- ✅ AuthContext implemented: session persistence, MFA check/verify, customer/team context resolution.
- ✅ App shell implemented: sticky headers + bottom tabs with mobile-first layout.
- ✅ Dashboard implemented: total balance, currency chips, quick actions, recent transactions, realtime subscriptions.
- ✅ Accounts implemented: fiat + crypto tabs, provider badges, account details with copy-to-clipboard.
- ✅ Transactions implemented: unified list, search, status/provider filters, load more.
- ✅ Global UX: skeletons, empty states, error states with retry, toasts, and `data-testid` coverage.
- ✅ Testing: frontend testing passed at ~95% (remaining limitation is lack of real test credentials to fully validate authenticated data flows in automation).

---

## Phase 3 — Payments & Payees (core money movement)
### Implementation Steps
1. Payees:
   - Payees list + search.
   - Create payee (Sheet on mobile) with validation.
2. Create Payment wizard (multi-step): payee → amount → review → confirm.
3. Fee preview integration (from Supabase edge function; fallback to “unavailable” state).
4. Transactions update after payment create (optimistic UI + refresh).

### User Stories
1. As a user, I can add a payee once and reuse it for faster transfers.
2. As a user, I can create a payment in a guided wizard with clear validation.
3. As a user, I can review fees/provider before confirming.
4. As a user, I receive a success/failure confirmation with next steps.
5. As a user, I can see the new payment reflected in transactions.

### Success Criteria
- Payment creation works end-to-end with real backend path (edge function/proxy).
- Clear handling for fee preview unavailable/error states.

### Progress Update (Completed)
- ✅ Payments page implemented with multi-step wizard and confirmation states.
- ✅ Payees page implemented (list/search + create payee sheet).
- ✅ Fee preview invocation wired (graceful fallback if edge function unavailable).

---

## Phase 4 — Advanced Features + Realtime + Session UX
### Implementation Steps
1. Crypto accounts (US Rails only) list + details.
2. Team members (business): list/invite/change role/remove (mobile cards; table on md+).
3. Profile/Settings: profile, security, sign-out.
4. Realtime subscriptions for tx/account updates (opt-in; fallback to manual refresh).
5. Session timeout UX: inactivity timer (warning toast at ~29m + forced logout at 30m).

### User Stories
1. As a user, I can view crypto balances separated from fiat.
2. As a business admin, I can manage team members and roles.
3. As a user, I can view profile/security settings and sign out.
4. As a user, I see updates appear without manual refresh when realtime is available.
5. As a user, I’m warned before session timeout and never lose context unexpectedly.

### Success Criteria
- Advanced modules integrate without breaking core navigation.
- Realtime does not degrade performance; works gracefully when disconnected.
- Session timeout triggers reliably and safely clears sensitive data.

### Progress Update (Partially Completed)
- ✅ Crypto accounts list added under Accounts → Crypto tab.
- ✅ Team members page implemented (invite flow wired to edge functions if present).
- ✅ Profile page implemented.
- ✅ More/Settings page implemented.
- ✅ Realtime subscriptions implemented on Dashboard.
- ✅ Session timeout (30 min inactivity auto sign-out) implemented.
- ⏳ Optional improvement: add **warning toast** before timeout (currently direct auto-logout after inactivity).

---

## Phase 5 — Testing & Polish (hardening)
### Implementation Steps
1. Comprehensive e2e checklist across screens, states, and responsiveness.
2. Accessibility pass (focus visibility, contrast, keyboard nav).
3. Performance pass (bundle size, list rendering, caching).
4. Security review: no secrets in frontend; RLS alignment; safe error messages.
5. Schema hardening (align queries with actual Supabase schema + RLS policies):
   - Confirm table/column names used in UI match production schema.
   - Confirm edge function names exist (`fr-proxy`, `rail-proxy`, `calculate-fee`, `create-platform-user`, `toggle-user-status`).

### User Stories
1. As a user, I can use the app one-handed on mobile without accidental taps.
2. As a user, I never see broken layouts across common device widths.
3. As a user, I trust the app because errors are clear and recovery is easy.
4. As a user, sensitive info isn’t exposed after logout/timeouts.
5. As a user, the app feels fast with smooth navigation.

### Success Criteria
- Testing agent reports no critical issues; remaining issues are minor cosmetics.
- No console errors; no broken routes; stable across refresh/deep links.

### Progress Update
- ✅ Frontend test pass completed; UI/UX validated for unauthenticated flows and responsiveness.
- ⏳ Remaining: authenticated E2E verification (requires you to log in with your own user), plus schema/RLS confirmation and edge-function availability verification.

---

## 3) Next Actions (immediate) — Updated
1. **You**: Log in on the deployed app with your own Supabase user to validate authenticated screens end-to-end.
2. Confirm whether the referenced tables/columns exist and are readable with RLS for the logged-in user:
   - `customers`, `org_roles`, `provider_configurations`
   - `fr_fiat_accounts`, `rail_accounts`, `rail_crypto_accounts`
   - `transactions`, `rail_transactions`
   - `fr_payees`
3. Confirm which edge functions are currently deployed and their expected payload format:
   - `fr-proxy`, `rail-proxy`, `calculate-fee`, `create-platform-user`, `toggle-user-status`
4. If any schema/RLS mismatch is found, we will adjust queries and error messaging accordingly.
5. If you want the next iteration: specify priority (e.g., MFA setup wizard, session warning toast, transaction detail drawer, approvals).

---

## 4) Overall Success Criteria (Updated)
- You can log in with your Supabase user and use:
  - Dashboard → Accounts → Account Detail → Transactions
  - Payments → create payment → confirmation
  - More → Profile / Payees / Team (if business)
- Data is real (Supabase), UI is premium mobile-first (dark + teal), and core banking workflows are usable.
- Additional phases are now optional and can be implemented based on requested roadmap priorities.
