# Meal Companion

The Daily Log meal section provides photo capture/upload, editable food components,
carbohydrate-first nutrition estimates, portion scaling, manual entry, confirmation,
editing, and source-separated nearby glucose review. Existing meal notes are retained.
Photos are held in memory, resized to at most 1600 pixels, redrawn to strip metadata,
and held only during meal review, then cleared when saving or leaving the editor. Photos are never saved in
localStorage or patient_data. Nutritional records remain in the existing AppData JSON.

## Enable photo analysis

Manual entry works without an account or AI credentials. Photo analysis requires:

1. A vision-capable OpenAI model supporting Responses JSON-schema output.
2. These **server-side** environment variables (never use a VITE_ prefix):
   - `OPENAI_API_KEY`
   - `MEAL_VISION_MODEL` (the model ID supported by your account)
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY` (public key for verifying sessions with owner access)
3. Apply `supabase/migrations/20261015000100_meal_analysis_quota.sql` to the connected
   database. It adds an operational quota, not a new patient-record storage model.
4. Restart the server / redeploy with its server runtime enabled. `/api/meal-analysis`
   is handled by the existing `src/server.ts`; static-only hosting cannot run it.
5. Sign in, select a photo, and consent to sending only the photo and meal notes to
   OpenAI. Do not enter secrets in frontend settings, source code or Git.

For local use, set server environment variables in the terminal before `npm run dev`,
or use your runtime's private environment-file support. `.env.meal.example` contains
names only; do not commit a populated file. The current deployment has not been
configured, and no live analysis or database migration was performed by this change.

## API and safeguards

GET `/api/meal-analysis` reports whether the four configuration variables exist,
not whether billing, model permissions, or the database migration work.
POST accepts JSON `{image, context, language, consent:true}` with a Bearer session.
It checks same-origin requests, JPEG/PNG/WebP signatures, decoded image size (2 MB),
streamed request size (3 MB), consent, a server-verified Supabase user, persistent
five-per-hour account quota, and process-level burst/global ceilings before calling
OpenAI. Requests time out, results pass a strict schema, and incomplete/refused/
invalid/non-food responses return an error with manual entry available. Errors never
include provider responses, photos, user records, credentials or request notes.
`store:false` is set for Responses; this does not promise zero provider retention.
Provider account retention settings still apply.

## Interpretation

All nutrients are estimates per one **described portion**. Number of portions scales
known nutrients; changing ingredients or sweetness does not invent replacement
nutrition. Unknown values remain null and totals are explicitly partial. Original
estimates are retained for comparison. The MyFCD link is a reference for patients to
consult, not an automated lookup or evidence that AI values were verified there.

No universal carbohydrate target, food safety rating, diagnosis, insulin dosing,
predicted glucose outcome or medication adjustment is generated. Suggestions are
limited to relevant food context and the patient's existing care plan. The Copilot
remains rule-based and answers meal questions from confirmed user records only.

Nearby glucose means within three hours and matches the meal's source. Recurring
observations require at least three same-title confirmed user meals, actual manually
recorded pre-meal values within one hour and after-meal values 90–150 minutes later,
with no overlapping meal logs. This is an observational matching window, **not** a
recommended testing schedule. Sample/device data never contribute to this conclusion.
Meal identity depends on matching titles; portions, illness, timing and other factors
can differ, so the message states association rather than causation.

Recheck reminders are optional, explicitly selected according to a patient's care-team
schedule. They appear only while the app is open, can be dismissed, and never collect a
reading automatically. There is no background notification or messaging integration.

## References

- [OpenAI vision inputs](https://developers.openai.com/api/docs/guides/images-vision)
- [OpenAI structured output](https://developers.openai.com/api/docs/guides/structured-outputs)
- [Malaysian Food Composition Database](https://myfcd.moh.gov.my/)

Remaining deployment work: provision credentials/model access, apply the quota
migration, verify photo-analysis consent and provider privacy terms for the intended
deployment, and perform an end-to-end live scan. This feature makes no regulatory
compliance claim.

## Files changed

- `src/components/MealCompanion.tsx`: meal editor, saved meal review, editing dialog,
  and open-app reminders; replaces the previous photo-only panel in Daily Log.
- `src/routes/health.tsx`, `src/components/AppShell.tsx`: Daily Log, timeline editing,
  simulation labels, and reminder integration.
- `src/lib/meals.ts`, `src/lib/types.ts`, `src/lib/store.tsx`: optional structured meal
  fields, validated saves, duplicate prevention, portion totals and glucose matching.
- `src/lib/meal-photo.ts`, `src/lib/meal-analysis.server.ts`,
  `src/routes/api.meal-analysis.ts`, `src/server.ts`: image preprocessing, authenticated
  server endpoint, request quotas, schema validation and provider integration.
- `src/lib/meal-copilot.ts`, `src/lib/copilot-service.ts`, `src/routes/copilot.tsx`:
  confirmed-record answers, safety priority, and professional capability wording.
- `src/lib/translations-meals.ts`, `src/lib/translations.ts`: English/BM/Chinese copy.
- `src/routeTree.gen.ts`: generated API route registration; no additional patient page.
- `src/lib/meals.test.ts`, `src/lib/meal-analysis.server.test.ts`,
  `src/lib/meal-photo.test.ts`, `src/lib/meal-copilot.test.ts`,
  `src/components/MealCompanion.test.tsx`: focused integration and safety tests.
- `supabase/migrations/20261015000100_meal_analysis_quota.sql`, `.env.meal.example`,
  `.gitignore`, and this guide: deployment/configuration documentation.

## Verification

- Production build and TypeScript validation passed.
- All **24 new meal tests** passed, including image preprocessing, consent/fallback,
  response validation, portion editing, storage, source separation and translations.
- Full suite before the additional preprocessing tests: **77 passed / 3 failed**
  across 80 tests. The three caregiver-alert test failures reproduce on the unchanged
  GitHub checkout: the fixture creates two valid rule alerts while tests expect one.
  Existing caregiver logic was preserved rather than changing its behaviour for this feature.
- New meal source/test files passed focused lint. Repository source lint reports
  existing formatting violations and unrelated `prefer-const` / `no-useless-escape`
  errors in the Supabase preview storage and doctor page. Generated files and the
  secondary `.github-sync` checkout were excluded for the source lint audit.
- GET `/api/meal-analysis` was exercised on the updated port-8081 preview and returned
  `{ "configured": false }`, as expected without credentials.
- Production browser assets were checked for provider URLs and secret variable names;
  the OpenAI server integration was absent from the public bundle.
- Browser automation timed out, so desktop/mobile visual QA could not be completed.
- No live provider request was made and no quota migration was deployed. Database
  execution and live food recognition remain configuration-dependent checks.
