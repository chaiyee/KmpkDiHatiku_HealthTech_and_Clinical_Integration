# DiaMonitor interface redesign

## Design and hierarchy

- Shared healthcare-blue primary (`#176B91`), teal accent (`#0D9488`), blue-grey
  background (`#F6F9FC`), white surfaces and navy text (`#17324D`). Tokens use OKLCH
  consistently with the existing stylesheet. Dark-theme semantic tokens are retained
  and adjusted, including status text, input boundaries and inverse button text.
- Shared card spacing, restrained shadows, native expandable sections and a
  consistent 44px minimum button size replace the previous multi-colour dashboard.
- Body text is 17px, secondary content 15px, and small supporting content 14px.
  English/BM/CJK font fallbacks are preserved; no new fonts or packages are required.

## Page changes and duplication

- **Overview:** one latest-glucose card with time/source and non-diagnostic status;
  one next step and one relevant insight. Compact medication and monitoring links.
  Progress, next visit, health replay and caregiver previews are expandable. The
  extra Overview chart was removed; the chart remains in My Health's trends view.
- **My Health:** distinct glucose records, daily log, history, trends and monitoring
  tabs preserve existing URL values. Manual entry comes first in both DOM and visual
  order. The chart lives in Trends; urgent findings appear above it. Date-range
  controls remain available for records and trends.
- **Guardian:** five short stages with an accessible progress indicator. Previous
  stages are not repeated; checking in calls the original guarded store method once.
  Help requests still show urgent guidance immediately, before caregiver review.
- **Care Plan:** today's reminders and check-in first, one existing educational
  suggestion, then expandable goals/feedback, weekly guide and sharing controls.
  The duplicate medication count was removed from the check-in; the medication
  panel retains its original controls. Redundant global medication notices are
  suppressed on the Overview and Care Plan where the same status is already shown.
- **Meals:** carbohydrate-first editable estimates remain intact. The processed
  photo can remain visible in memory during review; it is not saved in records.
  Sample meal titles/notes now use the translation provider, while user notes remain
  unchanged. Camera consent, manual fallback, confirmation and editing are preserved.
- **Copilot:** four starter questions, a larger input, clear send action, conversation
  landmark, and shorter honest capability wording. Enter respects Chinese IME
  composition; urgent/medication safety handling is unchanged.
- **Doctor Visit:** clearer consultation summary and in-page links for preparation,
  feedback and aftercare. Mode options are expandable and accurately labelled as a
  preview. Detailed metrics are collapsed to avoid repeating the main brief by default.
  Print still temporarily opens all report details and restores their previous state.

## Patient wording

Examples of revised presentation:

- “Based on your records · not live AI” instead of technical implementation descriptions.
- “Glucose Sensor Preview” / “Watch Preview”, always with simulated-device labelling.
- “Scenario Preview · simulated” for Guardian.
- “Caregiver alert preview saved … No SMS or WhatsApp was sent.”
- “Doctor preview” with explicit simulated/unverified access disclosure.

No simulation or estimated-nutrition disclosure has been removed. This change does
not enable live devices, real caregiver delivery, clinical authentication or new AI services.

## Accessibility and responsive checks

- Added a keyboard skip link and focusable main landmark; verified Enter moves focus
  to `main-content` in the browser.
- Consistent visible focus outlines, readable labels, 44px controls, text alongside
  important icons, status/confirmation text and existing reduced-motion support.
- Sidebar switches to the bottom navigation below 1024px; the mobile bar respects
  safe-area insets. Short labels prevent BM text from wrapping awkwardly.
- Actual browser screenshots reviewed at 1440px desktop and 390px/320px mobile.
  Overview, Health, meal logging, Care Plan, chat and consultation views were exercised.
  Reviewed widths had no document-level horizontal overflow.
- BM and Chinese Care Plan and Chinese meal-entry text were inspected in the browser.
  English was restored after the checks. New wording is in all three languages.
- Tested 720px reflow (the layout width corresponding to a 1440px view at 200%).
  Native Ctrl-plus did not change this webview's zoom; actual 200% zoom is **not**
  claimed as verified. Dark-theme tokens were improved but not visually reviewed
  through a theme-switch control, since none is exposed by the app.
- Core light-theme text/status contrast checks: primary on white 5.92:1, navy on
  background 12.42:1, secondary text 5.74:1, green/amber/red status pairs above 5.5:1.
  This is a focused design check, not a complete WCAG conformance audit.
- JSX source emoji audit found no decorative emoji to replace. Lucide icons remain.

## Files changed

- `src/styles.css`
- `src/components/ui/button.tsx`, `src/components/ui/card.tsx`, `src/components/common.tsx`
- `src/components/AppShell.tsx`, `src/components/MedicationNotice.tsx`
- `src/routes/index.tsx`, `src/routes/health.tsx`, `src/routes/care-plan.tsx`
- `src/routes/copilot.tsx`, `src/routes/doctor.tsx`
- `src/components/ConnectedHealth.tsx`, `src/components/ConnectedHealth.test.tsx`
- `src/components/MedicationReminders.tsx`, `src/components/CaregiverSupport.tsx`
- `src/components/MealCompanion.tsx`, `src/components/MealCompanion.test.tsx`
- `src/lib/caregiver.ts` (disclosure wording only)
- `src/lib/translations-design.ts`, `src/lib/translations.ts`
- `src/test/app-routing.test.tsx`, `MEAL_COMPANION.md`, this report
- `ui-redesign-overview.jpg` (browser screenshot)

## Verification

- Production build: passed.
- TypeScript: passed.
- Changed-source lint: zero errors; four existing Fast Refresh / effect-dependency
  warnings remain. Source-wide lint, excluding generated files and the secondary
  checkout, reports 1,640 errors: 1,639 existing formatting issues and an unrelated
  `prefer-const` issue in Supabase preview storage. They were not mass-reformatted.
- Full suite: **86 passed, 3 failed** across 89 tests. The same three caregiver
  fixture failures were independently reproduced on the pre-change GitHub checkout
  during the preceding task (two valid alerts versus a one-alert expectation).
  This UI change preserves the caregiver rule calculations.
- New checks cover all five main routes and Guardian's okay/help behaviour.
  Existing meal, multilingual, consultation, hypoglycaemia and Copilot safety tests pass.

Health calculations, storage keys, whole-record cloud sync, medication scheduling,
patient records, consent, volatile doctor-preview guards, and the seven educational
daily entries were not changed. Browser checks did not submit health records or run
Guardian scenarios against the user's stored data; those interactions were tested
with isolated mocks. Live meal AI remains configuration-dependent as documented in
`MEAL_COMPANION.md`. Changes are local and have not been pushed or deployed.
