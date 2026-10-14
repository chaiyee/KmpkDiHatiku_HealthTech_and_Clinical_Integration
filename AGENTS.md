<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Architecture rules
- Preserve the uploaded five-route application, shared browser storage keys and translation provider; this is an improvement of the existing prototype, not a new application.
- The existing Daily Care Guide uses seven predefined Monday–Sunday entries and existing translated suggestions, independent of doctor goals; educational browsing must not change clinical plans.
- Use the existing medication scheduling and consent-aware caregiver functions without external services; unlogged medication is not a missed dose and caregiver sharing remains a local simulation.

- Consultation doctor editing is a volatile, default-off simulation flag in the existing store with guarded doctor mutators, not authentication or a persisted user role; this prevents ordinary patient-mode edits without claiming security.
- Store consultation questions, response timestamps and follow-up instructions as optional fields in the existing demo record; retain all legacy keys, goals, check-ins and educational guide entries for compatibility.
- The doctor report uses native expandable sections that are opened temporarily for printing so collapsed on-screen content remains in the full report.
- Copilot-pinned consultation questions are an optional pinnedQuestions list in the existing demo record, kept separate from the free-text consultationQuestions for backward compatibility.
- Patient records stay in localStorage for the no-account demo; when signed in, the whole AppData record is synced as one JSON row per user in public.patient_data (owner-only RLS), pulled on sign-in and upserted after changes.
