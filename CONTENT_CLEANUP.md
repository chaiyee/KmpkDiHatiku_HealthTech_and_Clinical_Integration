# Patient content cleanup — 17 October 2026

## Result

Refined the existing interface without adding routes or changing records, calculations, schedules, consent, escalation or sync behavior. Repeated introductory disclaimer blocks were removed rather than replaced with new banners. Existing readable typography, large controls and card layouts remain.

## Copy and presentation

| Area | Cleanup |
| --- | --- |
| Overview | Removed the demonstration-reference paragraph and closing generic diagnosis disclaimer. Latest reading, source, important alerts and next action remain prominent. |
| My Health | Shorter monitoring introduction, reference-band caption and range badges. Reading tables and chart tooltips explicitly identify Sample, Simulated or Patient-entered sources. Rule details use an expandable disclosure. |
| Copilot | Removed the introductory disclaimer card. Kept suggested questions and accurately labelled guided/online replies. Online consent is under Online review options; source information is under About this guidance. Urgent and medication safety responses are unchanged. |
| Care Plan | Medication Tracker uses a short dosing instruction. Removed repeated generic advice from daily tips and example-goal cards. Sample care plans and feedback remain labelled. |
| Doctor Visit | Removed the generic introductory paragraph, duplicated disclaimer language and technical explanation footnote. Preserved patient questions, summaries, notes, printing, follow-up details and read-only feedback. Mixed sample/simulated reports carry a concise source label. |
| Food | Retained Estimated values, incomplete-nutrient states, confirmation and actual AI uncertainty/questions. Reduced generic nutrition paragraphs to short source/portion captions. The MyFCD reference link remains. |
| Activity | Short movement introduction; a visible low-glucose/unwell reminder remains. Detailed activity/medication safety information is accessible under Activity safety. |
| Connected Health and Guardian | Kept Simulated devices, simulated reading counts and preview labels. Shortened repeated sensor/step explanations. Emergency help, check-in results, consent and no-delivery statuses are preserved. |
| Caregiver | Uses Preview only · no messages sent and concise sharing descriptions. Replaced Doing well with No pending alerts so a notification status does not imply a health assessment. |
| Shared header | Uses short record-source labels instead of the workspace notice. Scenario tools use Preview options and reset wording explicitly says records return to sample data. |

Examples of replacement wording:

- Medication Tracker
- Follow prescribed doses. Never take extra medication because of a reminder.
- Within reference / Above reference / Below reference
- Confirmed meals · nutrition estimates
- Sample care plan / Sample feedback
- Preview only · no messages sent
- Questions, records and next steps.

## Safety preserved

- Low-glucose rescue flow, timer and emergency instructions were not edited.
- Urgent symptom and medication dosing refusal branches are unchanged.
- Prescription-entry instructions, skipped-dose controls and medication scheduling remain intact. Not Logged is still distinguished from missed doses.
- Activity still shows a short visible safety instruction and retains the full medication-risk guidance in an accessible disclosure.
- The fasting trend's medication warning remains visible, and its short caption states that the trend is not a forecast.
- Nutrition estimates, missing values, food confirmation and record matching retain their existing behavior.
- Sample/device readings, caregiver preview delivery status and sample clinician feedback remain distinguishable.
- Existing clinician-editing store guards remain; the patient-facing Doctor Preview remains removed.
- Local records, Supabase, consent functions and Guardian escalation were not changed.

The following files were also compared against the GitHub checkout and confirmed unchanged (ignoring line endings): store, shared types, glucose patterns, medications, meals, activity, food-insight calculations, both AI server endpoints, caregiver rules and LowGlucoseRescue.

## Files modified

Routes:

- `src/routes/index.tsx`, `health.tsx`, `copilot.tsx`, `care-plan.tsx`, `doctor.tsx`, `caregiver.tsx`, `__root.tsx` (metadata wording).

Shared and feature components:

- `src/components/AppShell.tsx`, `common.tsx`, `GlucoseChart.tsx`, `ConsultationBrief.tsx`.
- `ConnectedHealth.tsx`, `CaregiverSupport.tsx`, `HealthReplay.tsx`.
- `MedicationReminders.tsx`, `DailyCareGuide.tsx`, `ActivityCompanion.tsx`.
- `FoodGlucoseInsights.tsx`, `MealCompanion.tsx`, `PersonalInsights.tsx`, `FastingForecastCard.tsx`.

Copy helpers and translations:

- `src/lib/copilot-service.ts` and `record-answers.ts`: ordinary response wording only; no safety or calculation changes.
- Added `src/lib/translations-content.ts` for English-keyed BM/Chinese copy.
- Updated `translations.ts`, `translations-design.ts`, `translations-companions.ts`, `translations-meals.ts`, `translations-brief2.ts`, `translations-brief3.ts`, `translations-connected.ts`.
- Removed **41 unused bilingual dictionary entries**, including the specified repeated disclaimer paragraphs. Keys still required by contextual guidance were retained.

Tests:

- Added `src/test/content-cleanup.test.tsx` (11 tests).
- Updated `src/test/preview-polish.test.tsx` for the expandable online-consent UI.
- Updated `src/components/ConnectedHealth.test.tsx` for shorter simulated-reading copy.

Local report/screenshots: this file, `content-care-plan-preview.jpg`, `content-overview-preview.jpg`.

## Validation

- Production build: passed.
- TypeScript: passed.
- Focused lint: zero errors, four existing Fast Refresh export warnings in common/ConnectedHealth/DailyCareGuide. Large legacy translation files were not reformatted as part of the focused lint check.
- Final regression run: **142 passed, three known caregiver fixture failures, 145 tests across 23 files**. Those fixtures expect one alert where the unchanged rules produce two eligible alerts. No new assertion failures remained.
- Final translation/content check after dictionary cleanup: **16 passed across two files**.
- New tests cover translated source labels in all three languages, visible medication dosing guidance, accessible activity safety, rendering Overview/My Health/Care Plan without the removed paragraphs and absence of record mutations while rendering.
- Existing tests cover rescue flow, Guardian help/okay behavior, medication logic, food/activity matching, doctor report printing, patient questions, truthful Copilot fallback and secure server handling.
- An initial concurrent build/test run hit resource-related timeouts. The final suite ran without file parallelism and completed with only the existing caregiver failures.
- Browser review covered all five main pages, monitoring and meal entry. The Doctor report reflowed at 390px without horizontal overflow. Malay and Chinese language switching and translated report labels were checked; the original English preference and normal viewport were restored afterward. No patient records or consent settings were changed during browser checks.

## Remaining limits

Device readings and caregiver delivery remain simulated/previewed. Live AI configuration is still required for online operation; local assistance remains accurately labelled. No clinical integration, credentials, deployment or GitHub push was performed for this content-only request.
