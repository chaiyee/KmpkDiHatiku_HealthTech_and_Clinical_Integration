# DiaMonitor companion upgrade

Implemented in the existing application on 16 October 2026 (Malaysia). The five main routes, translations, legacy browser key, medication semantics, seven-day educational guide, Guardian flow, doctor simulation guards and whole-record Supabase architecture remain in place.

## Inspection and implementation plan

The application uses React 19, TypeScript, TanStack Start/Router, Tailwind, a shared React store, browser localStorage and Supabase Auth. The main routes are Overview, My Health, Copilot, Doctor Visit and Care Plan. Shared cards, form controls, translations, clock hook and confirmed-meal schema were reused.

Inspection found that meal entry, portion correction, confirmation, reminders and saving were implemented. Image analysis already had a server endpoint, sign-in validation, consent, byte limits, strict response parsing and persistent quota requirements. Live analysis was not configured. Activity was previously a free-text HealthLog. Copilot answered locally. Sensor records and caregiver delivery were simulations. Account sync previously reused the guest key and could overwrite records without checking a cloud revision.

Plan followed: extend confirmed-meal insights; add optional structured activity fields within HealthLog; verify/reuse the scanner; add a restricted AI-assisted record-review endpoint; isolate account caches and detect cloud conflicts; translate, test and inspect the existing UI. No new main page or scanner was added.

## 1. Completed features

- One Food & Glucose Insights card in the existing meal companion. Existing saved meal history and editing sit inside its expandable timeline, avoiding a second meal history.
- Activity & Glucose inside Daily Log's existing Activity selection. Default entry is walking, 15 minutes and the current time. Optional intensity and notes; edit/delete; today and rolling seven-calendar-day summaries; nearby manual readings.
- Optional activity reminders visible across the application while it is open. They are stored with AppData; no background push is claimed.
- Online Copilot record selection behind sign-in, successful sync and per-session consent, with safe local summaries when unavailable.
- Account-specific caches, offline dirty markers, timestamp checks, retry-on-reconnect, conflict pause and local JSON backup export.
- English, Bahasa Melayu and Simplified Chinese interfaces. Existing compact white/blue card design and large touch controls retained.

## 2. Files created and modified

Created:

- `src/lib/activity.ts`: validated structured activity operations, history and nearby readings.
- `src/lib/food-insights.ts`: confirmed-meal filtering, contextual matching and conservative repeated associations.
- `src/lib/copilot-grounding.ts`: minimal AI context and record-selection validation.
- `src/lib/record-answers.ts`: translated, deterministic summaries calculated from records.
- `src/lib/copilot.server.ts`: secure online classification/selection endpoint.
- `src/lib/persistence.ts`: account cache keys, empty new-account records and equivalent timestamp comparisons.
- `src/lib/translations-companions.ts`: new three-language wording.
- `src/components/FoodGlucoseInsights.tsx`, `ActivityCompanion.tsx`, `RecordNotices.tsx`.
- `src/routes/api.copilot.ts`.
- `supabase/migrations/20261016000100_copilot_quota.sql`.
- `src/lib/companions.test.ts`, `copilot.server.test.ts`, `store-isolation.test.tsx` and `src/components/ActivityCompanion.test.tsx`.
- This report and `activity-companion-preview.jpg`.

Modified:

- `src/lib/types.ts`, `store.tsx`, `copilot-service.ts`, `translations.ts`, `i18n.tsx`.
- `src/components/MealCompanion.tsx`, `MealCompanion.test.tsx`, `AppShell.tsx`.
- `src/routes/health.tsx`, `copilot.tsx`, generated `src/routeTree.gen.ts`, `src/server.ts`.
- `.env.meal.example` adds an empty `COPILOT_MODEL` placeholder.

## 3. Food & Glucose Insights

Only `source: user` meal logs that pass the complete confirmed-meal schema are used. Legacy notes remain readable but are not assigned invented nutrients. Nutrition values retain unknown versus zero and portion multipliers. Confirmed AI estimates remain estimates.

Only manual glucose readings are used for personal meal associations. Sample and current `device` records are excluded because current device records are simulated. The nearby window is three hours each side. A before-meal label requires explicit before-meal context and a reading within the preceding hour. An after-meal label requires explicit after-meal context and timing 90–150 minutes later. Another recorded user meal within three hours makes the meal link uncertain. Random-context readings are displayed without inferring a post-meal relationship. Signed minute offsets and measurement source accompany readings.

Repeated associations require at least three non-overlapping paired observations of identically named foods, portions and serving counts, all with higher later readings. This is a conservative record association, not a validated prediction or causal finding. Missing medication, stress, illness and other contextual information remain potential confounders. Unsupported observations show an explicit insufficient-data state. Malaysian food names and existing nonjudgmental portion/drink suggestions are reused. No universal carb target or new treatment threshold is introduced.

## 4. Activity & Glucose

Structured activity is an optional field on the existing HealthLog, not a separate database or log collection. Supported types are walking, light exercise, cycling, household activity and other activity. Duration must be an integer from 1–720 minutes (an input validation bound, not an exercise prescription); future/invalid start times are rejected. Existing free-text notes remain in History and are not converted into guessed minutes. Edits replace the same ID; deletion is limited to user activity logs.

The history reports logged minutes, not measured steps or fitness achievement. Nearby manual readings span one hour before activity start to two hours after its recorded end. No exercise effect, insulin adjustment or personal exercise prescription is inferred. General safety wording asks patients with low glucose or symptoms to follow their care team's safety plan. No real smartwatch activity integration exists.

## 5. AI meal scanner status

The existing scanner is preserved: upload, mobile camera file input, client image preparation, server-side analysis, Malaysian dish support, estimated carbs/calories, editable portions, explicit confirmation, duplicate submission prevention and meal saving. Saving a confirmed meal feeds the new insights automatically. Unconfirmed detections never enter those insights.

Credentials/deployment were not supplied, so no live scan is claimed. Missing configuration continues to offer manual entry. Camera hardware/permission handling and actual recognition accuracy require device testing after deployment. No additional scanner component was introduced.

## 6. AI Copilot status

`/api/copilot` supports GET configuration status and POST requests. POST requires exact same origin, JSON content type, a bounded streamed request, verified Supabase bearer token, an owner-scoped patient_data read, explicit consent and a persistent per-user quota (five requests per hour). Model/key values are server-only. Errors return generic codes without logging patient records.

The AI classifies supported questions and selects existing confirmed meal IDs. It does **not** supply clinical prose or calculate patient numbers. Supported intents cover today's estimated carbs, largest recorded meal estimates, readings around selected meals, logged walking, combined summaries and doctor discussion preparation. Strict JSON validation rejects unknown IDs and incomplete/refused/invalid outputs. App code renders translated answers and computes totals from the actual saved record. This constrained approach provides AI-assisted question understanding while reducing hallucinated health claims; it is not a general clinical chatbot or medical reference retrieval service.

Before online review, deterministic local checks handle urgent symptoms, possible low/high symptoms, medication change requests and explicitly stated concerning mmol/L readings using the app's existing reference thresholds. Personal local answers now exclude sample/device measurements. Doctor prompts do not assume a morning spike exists. Account changes clear consent, conversation and form drafts, and invalidate pending replies.

Consent explains that the question and limited saved meals/glucose/activity go to OpenAI. Profile name, clinic/doctor details, medication schedules, general notes and activity notes are excluded from the generated context. Food names and portion descriptions are included, so patients should avoid identity details in questions and food descriptions. The request uses `store: false`, which is not a promise of zero provider retention. See the [official Responses migration documentation](https://developers.openai.com/api/docs/guides/migrate-to-responses) and [provider data controls](https://developers.openai.com/api/docs/guides/your-data).

Live AI is not configured or verified with provider credentials. The local record-review fallback remains functional. Online mode uses the saved cloud record, not unsynced browser changes.

## 7. Persistence and security

The guest key remains `diamonitor-demo-v1`. Each signed-in account gets `diamonitor-account-v1:<user-id>`, with its own dirty/version metadata. Existing cloud records are pulled without deleting the guest record. New accounts start empty rather than inheriting another person's sample/profile/history. Unassigned legacy browser data remains accessible in guest mode and is not silently attributed to a newly signed-in account.

AppData is still one JSON row per user in `public.patient_data`; existing owner-only RLS remains required. Optional fields preserve legacy compatibility. Dirty cached changes survive reconnect/reload. Cloud updates use the previously read updated_at value as a condition; a changed cloud version pauses synchronization and retains local data. Equivalent timezone encodings are compared by instant. Stale account fetches and save callbacks are ignored. In-flight changes are not marked clean by an older save. Online reconnect and the Retry sync control attempt recovery. A visible error notice offers local JSON backup export.

Conflicting branches are **not** merged automatically. Backup and manual reconciliation remain necessary for a genuine conflict; no import/reconciliation editor was added. localStorage is not encrypted storage, and account-specific keys provide application isolation rather than protection against someone with access to this browser profile. Cross-device sync and real owner-RLS behavior require authenticated deployment testing. No legacy patient records were intentionally deleted or migrated to normalized tables.

## 8. Validation

- Production build: passed after feature integration.
- TypeScript: passed.
- Final full suite: **121 passed, three existing caregiver fixture failures (124 tests across 21 files)**. Results are recorded in `companions-final-tests.log`.
- Focused food/activity/API tests initially passed 28/28; later activity UI, account-isolation, safety and multilingual run passed 51/51. Latest meal-history/timezone/translation checks passed 37/37 before the final account callback safeguards.
- Changed implementation files lint: zero errors; existing hook/Fast Refresh warnings in the shared store and translation provider remain. Repository-wide lint remains blocked by existing formatting debt (recorded run: 1,635 errors, 16 warnings), largely untouched translation and legacy source formatting. Full and focused outputs are retained locally in `companions-*.log` / `companions-full-lint.json`.
- Existing three caregiver failures expect one alert where the unchanged pattern fixture creates two distinct eligible alerts. They were present before this upgrade; caregiver rules were not changed to satisfy those assertions.
- Browser inspection verified the activity form and Daily Log integration. At a 390px viewport, document content width was 375px (no horizontal overflow). Existing desktop navigation and compact layout remain. New activity controls were rendered in BM and Chinese in component tests. A screenshot is saved in `activity-companion-preview.jpg`.
- Live AI calls, live cloud account switching/RLS, migrations, phone camera hardware and external push delivery were not run. No credentials were available and external push is not implemented.

## 9. Deployment requirements

Set these only in the server/worker secret environment, never as VITE-prefixed public variables:

```
OPENAI_API_KEY=<server secret>
MEAL_VISION_MODEL=<vision-capable Responses model enabled for your account>
COPILOT_MODEL=<Responses model supporting strict structured output>
SUPABASE_URL=<your Supabase project URL>
SUPABASE_PUBLISHABLE_KEY=<project publishable key>
```

Apply the existing `20261015000100_meal_analysis_quota.sql` and new `20261016000100_copilot_quota.sql` migrations to the intended Supabase project. Both quota tables use RLS and authenticated security-definer claim functions; patient data is not stored there. Confirm the existing `patient_data` owner-only policies and updated_at field. Deploy the TanStack Start/Nitro server/Cloudflare worker, not only static client assets. Use HTTPS for the deployed app and verify authentication redirects, provider access, quotas and camera behavior. Do not paste actual secrets into the example file or commit them.

## 10. Remaining simulations and limits

Connected Health, CGM/watch connections, Guardian scenario readings and caregiver alerts remain clearly marked simulations. No SMS/WhatsApp is sent, no real steps are fabricated, and doctor mode remains a volatile default-off simulation. Activity reminders require the app to be open. Nutrition remains estimated. Food associations are observational, sensitive to incomplete logging and not clinically validated. No Smart Foot Care, extra main dashboard or treatment dosing feature was added.

This report accompanies the application source. Production deployment and server-secret configuration remain separate setup steps.
