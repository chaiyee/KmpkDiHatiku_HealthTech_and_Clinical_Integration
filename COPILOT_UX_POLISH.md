# Copilot and patient presentation update

## Changes

- `src/routes/copilot.tsx`: ordinary replies use a 2,500 ms minimum measured from submission. Slow online requests do not wait again. Safety replies and failures bypass this delay. The existing conversation now has a two-stage assistant bubble, subtle reduced-motion-aware typing dots, synchronous duplicate-submit protection and abortable requests/delays. Account changes and unmounts invalidate pending replies. Existing response content, source references, online consent and guided/online/safety labels remain intact.
- `src/components/common.tsx`: shared compact record provenance, including accessible source names and expandable explanations for generated examples and simulated device readings. User readings say “Manually recorded.”
- `src/routes/index.tsx` and `src/routes/health.tsx`: use this provenance treatment in the latest reading, recent readings and timeline instead of prominent source badges.
- `src/components/AppShell.tsx`: My Profile and Your health companion wording; less prominent Demonstration Tools with dataset disclosure. Both restore and scenario selection explain and confirm replacement before calling the existing handlers.
- `src/routes/care-plan.tsx`, `src/routes/doctor.tsx` and `src/components/ConnectedHealth.tsx`: example care plan, example clinician feedback and device demonstration wording. Physical connection and notification delivery are never claimed.
- `src/lib/translations-content.ts`: English-keyed terminology with Bahasa Melayu and Simplified Chinese translations.
- Tests: `src/test/copilot-loading.test.tsx`, `src/test/content-cleanup.test.tsx` and `src/test/preview-polish.test.tsx`.

## Verification

- TypeScript validation passed.
- Production build passed.
- Initial focused run: 53 tests passed across loading, Copilot safety/service, existing preview and content suites.
- Final run after strengthening duplicate submission and replacement tests: 32 tests passed across loading and content suites.
- Focused lint: no errors; existing component/module export warnings in common.tsx and ConnectedHealth.tsx.
- Browser checks: desktop 1280 × 900 and mobile 390 × 844. No horizontal overflow observed. English, Malay and Chinese loading states were checked. Generated record explanation remains accessible. Browser viewport and English language were restored.

## Preserved

No medical response content, clinical calculations, emergency guidance, reading values, timestamps, stored sources, medication schedules, caregiver permissions/history, authentication or cloud synchronization implementation was changed. No records were reset or scenarios loaded during browser verification. Online response timing, success/fallback labels and cancellation were tested with mocked requests; no external AI credentials were introduced.
