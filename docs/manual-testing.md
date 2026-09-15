# Codify manual test checklist

This is the repeatable manual pass for verifying Codify end-to-end before a
release, since there is no automated mobile UI test suite yet (see
`docs/deployment.md` for production setup, and `backend/tests/` for the
automated API test suite). Run this on an Android emulator or device with the
backend running locally, unless a step says otherwise.

Check items off as you go. If anything fails, note the exact repro steps
before moving on — do not skip ahead assuming it will resolve itself.

## 0. Before you start

- [ ] Backend is running (`npm run dev` in `backend/`) and `http://localhost:3000/health` returns `200`.
- [ ] `npx expo start -c` is running with a clean Metro cache.
- [ ] You have two test accounts: one regular user, one with `ADMIN` role
      (`npm run admin:set -- <email> ADMIN` in `backend/`).
- [ ] `backend/tests` pass: `npm run test` in `backend/` (37+ tests, all green).

## 1. Authentication

- [ ] Sign up with a new account; verify email if required.
- [ ] Sign in with an existing account.
- [ ] Sign out, then confirm the app returns to the sign-in screen and no
      cached user data (allergens, history) leaks into a different account
      signed in afterward.

## 2. Scanning and product results

- [ ] Scan (or manually enter) a barcode for a product that exists and is
      `APPROVED` — confirm name, brand, nutrition, ingredients, allergens,
      alternatives all render.
- [ ] Scan a barcode with `CAUTION` / `FDA_ADVISORY` / `UNVERIFIED` status —
      confirm the correct visual treatment and warning message for each.
- [ ] Scan a barcode that does not exist — confirm the "not found" / report
      prompt path, not a crash or blank screen.
- [ ] Scan the same barcode in both its 12-digit UPC and 13-digit EAN form —
      confirm both resolve to the same product.
- [ ] Confirm the scan appears at the top of Scan History afterward.

## 3. Search product screen

- [ ] Search by partial product name and by brand — confirm results filter
      as you type without a network request per keystroke.
- [ ] Open a result from search and confirm it matches the scanned-result
      screen for the same product.

## 4. Reporting a product

- [ ] Submit a report (with and without a barcode) with each reason option.
- [ ] Confirm the new report appears in "My Reports" with status `PENDING`.
- [ ] As the **admin** account, confirm the same report appears in the admin
      Reports inbox (see section 8).
- [ ] As the **regular user**, clear your report history — confirm the
      report disappears from your own list.
- [ ] As the **admin**, confirm that same report **still appears** in the
      admin inbox (clearing personal history must not delete admin evidence).

## 5. Scan history

- [ ] Scan several different products, confirm history lists them newest
      first with no duplicate barcodes.
- [ ] Clear scan history, confirm the list empties and a fresh scan
      re-populates it correctly afterward.

## 6. Allergen preferences

- [ ] Select several allergens in preferences, back out, and return —
      confirm the selections persisted.
- [ ] Scan a product containing a selected allergen — confirm it's flagged
      clearly on the result screen.
- [ ] Sign out and back in — confirm preferences reloaded from the backend,
      not just local cache.

## 7. FDA advisories

- [ ] Browse the advisories list; filter by category and by status.
- [ ] Search by advisory number and by title keyword.
- [ ] Open an advisory's detail screen and confirm the source link(s) work.

## 8. Admin — Product reports

- [ ] Sign in as a **non-admin** account — confirm the Admin tab is not
      visible, and navigating to `/admin/*` directly is blocked with an
      "administrator access required" message, not the actual screen.
- [ ] Sign in as **admin** — confirm the Admin tab appears.
- [ ] Reports list: search by product/brand/barcode, filter by each status,
      and page through results if there are more than 20.
- [ ] Open a report, change its status to each of `UNDER_REVIEW`,
      `RESOLVED`, `REJECTED`. Confirm `RESOLVED`/`REJECTED` require a
      non-empty response note before saving.
- [ ] Save a review, then reopen the report — confirm the audit history
      shows the change with a timestamp.
- [ ] Open the same report in two admin sessions, change status in one and
      save, then try saving a stale change in the other — confirm a
      "changed, reload" conflict message rather than silently overwriting.
- [ ] Delete a report from the list (trash icon) and from the detail screen
      — confirm the confirmation prompt appears both times, and the report
      is gone from the list after confirming.

## 9. Admin — Product catalog

- [ ] Add a new product with all fields filled in correctly — confirm it
      appears in the public catalog/search afterward.
- [ ] Try adding a product with a barcode that already exists (including its
      UPC/EAN equivalent form) — confirm it's rejected with a clear message,
      not a generic server error.
- [ ] Try saving a product with a required field left blank — confirm the
      error appears **under that specific field**, not just as one raw
      string at the bottom of the screen.
- [ ] Edit an existing product's nutrition, ingredients, allergens, and
      alternatives — confirm all four save correctly and reflect in the
      public product view.
- [ ] Archive a product — confirm it disappears from public search/catalog
      but its existing reports and scan history are unaffected.

## 10. Admin — FDA advisories

- [ ] Add a new advisory with all fields — confirm it appears in the public
      advisories list afterward.
- [ ] Edit an advisory's status (e.g. `NOT_APPROVED` → `LIFTED`) and confirm
      the public advisory reflects the change.
- [ ] Toggle an advisory's "active" flag off — confirm it drops out of the
      active public feed.
- [ ] Trigger a validation error (e.g. malformed advisory number or source
      URL) — confirm the field-level error message, same as section 9.

## 11. Offline mode

- [ ] With the app running and online, stop the backend process.
- [ ] Confirm the global offline banner appears within a few seconds, and
      the home screen's sync card switches to "Offline mode."
- [ ] Confirm the terminal running Metro does **not** repeatedly log the
      same failed-request error — it should log it once (if at all), not in
      a loop.
- [ ] While offline, browse the product catalog and FDA advisories — confirm
      previously-synced data is still browsable from the local cache.
- [ ] While offline, try opening a product or advisory that was never synced
      — confirm a clear "not available offline" message, not a crash.
- [ ] While offline, submit a product report and add a scan — confirm they
      save locally and are visible in your own history immediately.
- [ ] Restart the backend. Confirm the app detects reconnection automatically
      (no manual refresh needed), the banner clears, and the sync card shows
      "Online" with an updated "Catalog last updated" time.
- [ ] Confirm the report and scan you made while offline are now also
      visible from the **admin** side (i.e. they synced to the backend).

## 12. Regression smoke pass

Run this short pass after any change, even outside a full release cycle:

- [ ] Sign in, scan one product, submit one report, sign out — no crashes.
- [ ] Admin: open Reports, Products, and Advisories lists — no crashes, no
      infinite loading states.
- [ ] `npm run typecheck` and `npm run lint` clean at the repo root.
- [ ] `npm run typecheck` and `npm run test` clean in `backend/`.
