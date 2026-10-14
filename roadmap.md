# DiaMonitor Part 1
- [x] Restore the attached existing source without changing its design, routes, or patient storage.
- [x] Complete EN/BM/Chinese translations and persistent language selection.
- [x] Clarify latest measurement time and today's action on Overview.
- [x] Improve wrapping, labels, and mobile control sizes.
- [x] Verify all five pages and existing patient workflows; report translation exclusions (proper names, units, and patient-entered text stay unchanged).

# DiaMonitor Part 2
- [x] Add editable medication schedules, daily statuses, and in-app reminders using existing persistence.
- [x] Show the next medication reminder on Overview.
- [x] Add a rotating educational Daily Care Guide without changing doctor goals.
- [x] Translate new labels and verify actions, persistence, and existing workflows (18 tests passed; all five pages, medication actions, refresh persistence, unchanged legacy data, BM/Chinese mobile layouts checked).

# DiaMonitor Part 3
- [x] Add persisted simulated caregiver mode, selected-alert consent, and revocation inside My Care Plan.
- [x] Generate deduplicated deterministic alerts with evidence, timestamps, history, and acknowledgement.
- [x] Add Overview notification details and extend the existing printable doctor report.
- [x] Translate new content and verify the full demonstration journey and mobile layouts (24 tests passed; multilingual end-to-end journey, evidence modal, print view, saved acknowledgement, revoked sharing, all five pages checked).

# Patient usability improvements
- [x] Inspect and restore the existing uploaded source without dependencies or backend services.
- [x] Fix narrow-phone navigation overflow, glucose dialog readability and direct access to medication reminders.
- [x] Extend the existing educational guide to selectable Monday–Sunday suggestions using existing translations.
- [x] Skip working medication schedules, statuses, upcoming reminders and doctor-report history.
- [x] Audit caregiver detection and preserve working consent, evidence, deduplication and acknowledgement; missing repeated-low and baseline-sharing detection is deferred beyond this credit-limited run.
- [x] Verify narrow-phone layout, glucose validation/save/confirmation/refresh, medication shortcut, seven selectable days and EN/BM/Chinese; 23 existing targeted tests passed, no browser runtime errors.

# Consultation and care-plan refinement
- [x] Organise Doctor Visit into preparation, read-only feedback, and follow-up; retain full printing and add patient questions.
- [x] Add explicitly simulated doctor editing, guarded in the shared store and defaulting to Patient Mode without authentication.
- [x] Group today's suggestions, existing weekly guide, check-ins, doctor goals and medication tracking without changing other pages.
- [x] Translate new labels and verify patient restrictions, demo doctor saving, refresh persistence, complete report printing, care-plan readback, check-ins, weekly selection and EN/BM/Chinese mobile layouts; 18 existing tests passed with no browser runtime errors.
# Approved clinical-logic refinements
- [x] Doctor Visit glycemic summary: lowest, highest, average, within-range share of discrete readings, count and date range, with explicit not-CGM-Time-in-Range disclaimer.
- [x] Symptom safety prompt after logging a symptom: urges an immediate glucose check with a jump to the glucose tab and 999 urgent-care guidance; dismissible.
- [x] De-clustered repeated-pattern detection: same-day re-measurements count once per day for repeated fasting/after-meal highs; immediate safety alerts unchanged; caregiver alerts inherit the fix.
- [x] EN/BM/Chinese translations for all new text; 24 tests passed; verified in preview (doctor summary, symptom prompt, distinct-days wording).
- [x] Module 3 smart care plan & Module 4 Malaysian-aware Copilot with pinned questions

# Backend
- [x] Accounts (email + Google) and per-user online saving of all records, demo still works without an account.
- [x] Briefs 1-3 built (browser checking pending, at user request)
