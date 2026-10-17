# Patient preview polish — 17 October 2026

## Changes

- Removed the Doctor Visit consultation-mode disclosure, patient/doctor switcher, Doctor Preview button, clinician-only editing form and their route-only state/imports. The patient page no longer reads the doctor simulation flag or calls doctor mutators, even if that flag is already true.
- Preserved consultation records as read-only content, glucose and medication summaries, concerns, patient questions, pinned questions, follow-up information and print/PDF controls. Printing still opens all report details temporarily and restores previously collapsed sections afterward. Shared store guards and existing saved data were not deleted.
- Replaced prominent AI configuration/availability headings and status notices with “Help understanding your records.” Local answers carry one unobtrusive “Guided record review” or “Guided diabetes education” label. Only successful online record-review responses carry “AI-assisted record review.” Safety replies keep their safety label and urgent instructions.
- Failed online requests retain existing supported local guidance and its accurate guided label. A genuine answer failure uses “This answer couldn't be generated. Please try another question.” No stack trace, configuration code or provider error is shown.
- Changed the Doctor Visit explanation label from “AI-generated · demo” to “Record summary,” with a brief invitation to review it with the healthcare team. Its content and underlying healthcare rules were not changed.
- Replaced the meal scanner's normal missing-configuration notice with a manual-entry prompt. Failed photo estimation still gives a natural explanation and offers manual entry; it never claims a successful scan.
- Updated English, Bahasa Melayu and Simplified Chinese wording and removed unused preview/availability dictionary entries where safe. Sample/device/caregiver simulation labels and medical safety guidance remain.

## Files

Modified:

- `src/routes/doctor.tsx`
- `src/routes/copilot.tsx`
- `src/lib/copilot-service.ts` (comments and presentation wording only)
- `src/lib/translations-design.ts`
- `src/lib/translations-companions.ts`
- `src/lib/translations-meals.ts`
- `src/lib/translations.ts`
- `src/components/MealCompanion.tsx`
- `src/components/MealCompanion.test.tsx`

Added:

- `src/test/preview-polish.test.tsx`
- This report, `doctor-patient-preview.jpg` and `copilot-guided-preview.jpg`.

## Verification

- TypeScript: passed.
- Production build: passed.
- Focused ESLint check covering changed implementation files, translation modules and preview tests: passed, zero reported errors or warnings. The legacy aggregate translation file was not reformatted or included in this focused lint check.
- **43 tests passed across six files**, including ten new preview UI tests. Coverage includes removal of doctor controls even with the legacy doctor flag enabled, preservation of recorded feedback, patient-question saving, report print expansion/restoration, three-language guided replies, failed online request fallback, truthful successful-online labels, urgent safety escalation, meal saving, translations and server safety behavior.
- Browser verified the patient report and a local guided Copilot reply. Doctor Visit and Copilot both had content width 375px at a 390px viewport, with no horizontal page overflow. Desktop report reviewed at 1440px. Temporary viewport overrides were reset, and the preview was left on Doctor Visit. Saved records were not edited during browser checks.
- The full repository suite was not rerun for this focused UI change; its previously documented caregiver fixture failures were not altered.

## Limits

Live AI still needs the existing server configuration; no live provider request was claimed or tested with real credentials. Online behavior was tested with controlled responses. Doctor simulation functions remain in the shared store for compatibility and retain their guards, but patient UI exposes no way to enable or use them. Existing simulated feedback remains clearly labelled and read-only. These changes are local and have not been pushed to GitHub as part of this request.
