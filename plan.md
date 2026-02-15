# Balansas Mobile Banking Web App — Development Plan

## 1) Objectives
- Deliver a mobile-first, dark-themed (teal accent) banking web app with native-mobile UX (sticky headers + bottom tabs).
- Prove the **core integration** works end-to-end with real Supabase: auth/session + fetching balances/accounts/transactions.
- Build an MVP covering **Core Banking + Auth Flow** first, then expand to payments/payees, then advanced modules.
- Ensure production-grade UX states: loading/skeleton, empty states, errors, retries; and consistent provider/status badges.

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

---

## Phase 2 — V1 App Development (MVP Core: Auth + Dashboard + Accounts + Transactions)
**Goal:** build the real app around the proven integration; deliver premium mobile UX.

### Implementation Steps
1. **Design system + app shell**
   - Apply tokens in `src/index.css` (dark teal theme), import Space Grotesk + Inter.
   - Replace current `App.js` scaffold with routes + protected layout.
   - Build `AppShell`: sticky top header + scroll container + fixed bottom tabs.
   - Add Sonner toaster, skeleton primitives, and consistent badges.
2. **Auth flow (Supabase)**
   - Login screen (logo, email/password, errors).
   - MFA:
     - If user requires MFA: OTP verify screen using `InputOTP`.
     - If user enrolls: simple setup wizard (QR + confirm code) if Supabase MFA is enabled.
   - Protected routes + sign-out.
3. **Dashboard (core banking overview)**
   - Total balance card(s) + currency chips.
   - Quick actions (navigate to Payments/Payees placeholders in V1).
   - Recent transactions preview (latest 5) with status badges.
4. **Accounts (Fiat)**
   - Unified fiat accounts list; provider badge per row (EU Rails / US Rails).
   - Account detail page: balance + banking details + copy-to-clipboard toasts.
5. **Transactions**
   - Unified history list with search + status/provider filters.
   - Detail drawer/dialog (optional V1) for reference/metadata.
6. **Navigation + motion**
   - Bottom tabs: Dashboard, Accounts, Transactions, Payments, More.
   - Lightweight page transitions (respect reduced motion).
7. **Backend (FastAPI) minimal**
   - Add optional proxy endpoints only if needed for edge-function calls or server-only secrets later.

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

---

## Phase 3 — Payments & Payees (core money movement)
### Implementation Steps
1. Payees:
   - Payees list + search.
   - Create payee (Sheet on mobile) with validation.
2. Create Payment wizard (multi-step): payee → amount/currency → review → confirm.
3. Fee/ETA/provider preview integration (from Supabase/edge function; fallback to “unavailable” state).
4. Transactions update after payment create (optimistic UI + refresh).

### User Stories
1. As a user, I can add a payee once and reuse it for faster transfers.
2. As a user, I can create a payment in a guided wizard with clear validation.
3. As a user, I can review fees/ETA/provider before confirming.
4. As a user, I receive a success/failure confirmation with next steps.
5. As a user, I can see the new payment reflected in transactions.

### Success Criteria
- Payment creation works end-to-end with real backend path (DB insert/edge function).
- Clear handling for fee preview unavailable/error states.
- Testing agent completes payment happy-path + key error-paths.

---

## Phase 4 — Advanced Features + Realtime + Session UX
### Implementation Steps
1. Crypto accounts (US Rails only) list + details.
2. Team members (business): list/invite/change role/remove (mobile cards; table on md+).
3. Profile/Settings: profile, security, sign-out.
4. Realtime subscriptions for tx/account updates (opt-in; fallback to manual refresh).
5. Session timeout UX: inactivity timer (warning toast + forced logout at 30m).

### User Stories
1. As a user, I can view crypto balances separated from fiat.
2. As a business admin, I can manage team members and roles.
3. As a user, I can change security settings and sign out from Settings.
4. As a user, I see updates appear without manual refresh when realtime is available.
5. As a user, I’m warned before session timeout and never lose context unexpectedly.

### Success Criteria
- Advanced modules integrate without breaking core navigation.
- Realtime does not degrade performance; works gracefully when disconnected.
- Session timeout triggers reliably and safely clears sensitive data.

---

## Phase 5 — Testing & Polish (hardening)
### Implementation Steps
1. Comprehensive e2e checklist across screens, states, and responsiveness.
2. Accessibility pass (focus, contrast, keyboard nav).
3. Performance pass (bundle size, list rendering, caching).
4. Security review: no secrets in frontend; RLS alignment; safe error messages.

### User Stories
1. As a user, I can use the app one-handed on mobile without accidental taps.
2. As a user, I never see broken layouts across common device widths.
3. As a user, I trust the app because errors are clear and recovery is easy.
4. As a user, sensitive info isn’t exposed after logout/timeouts.
5. As a user, the app feels fast with smooth navigation.

### Success Criteria
- Testing agent reports no critical issues; remaining issues are minor cosmetics.
- No console errors; no broken routes; stable across refresh/deep links.

---

## 3) Next Actions (immediate)
1. Add Supabase env vars to frontend and implement `supabaseClient.js`.
2. Build Phase-1 POC: Login + session check + data probe page.
3. Confirm with you which tables/views to query for: accounts, balances, transactions, providers.
4. Fix any RLS/schema blockers until the probe reads succeed.

---

## 4) Overall Success Criteria
- You can log in with your own Supabase user and use Dashboard → Accounts → Account Detail → Transactions without errors.
- Data is real (Supabase), UI is premium mobile-first (dark + teal), and core banking workflows are usable.
- Subsequent phases add money movement and team features without regressions.
