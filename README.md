# DiaMonitor Clarity

Improve my EXISTING DiaMonitor Global application with MINIMUM LOVABLE CREDIT USAGE.

MAIN GOAL:
Make the application easier, clearer, and more convenient for patients to use while completing only genuinely missing functionality.

CRITICAL RULE:
DO NOT rebuild, redesign, or recreate features that already work. Inspect existing code first and SKIP completed tasks.

## PRIORITY 1 — MAKE THE APP EASIER TO USE

Improve usability across the existing pages, especially for elderly patients.

Make only small, necessary UI improvements:

- Make important buttons easier to see and tap on mobile.
- Improve readability with clear labels, sufficient contrast, and comfortable text sizes.
- Simplify confusing medical explanations into patient-friendly language.
- Make it obvious how to add a glucose reading, view reminders, and check the care plan.
- Show clear confirmation messages after saving or updating information.
- Provide helpful error messages when information is missing or invalid.
- Make the most important information easy to find on the Overview dashboard.
- Reduce unnecessary clicks where existing functionality allows.
- Ensure layouts work on smaller phone screens.
- Keep navigation consistent across all five existing pages.
- Make sure language switching remains easy to find.

IMPORTANT:
Reuse existing UI components and styling. Do not introduce a new design system, dashboard, onboarding flow, or additional pages.

Only change usability problems that genuinely exist. Do not restyle working components unnecessarily.

## PRIORITY 2 — SEVEN-DAY CARE PLAN

Inspect the existing Daily Care Guide.

If a complete seven-day plan already works, SKIP.

Otherwise, extend the existing guide to Monday–Sunday with:
- Breakfast suggestions
- Lunch suggestions
- Dinner suggestions
- Simple physical activity suggestions
- One daily lifestyle tip

Use familiar Malaysian foods and predefined educational suggestions.

Reuse existing components and translations.

Do not use AI generation or create a new care-plan system.

## PRIORITY 3 — MEDICATION REMINDERS

Inspect the existing medication reminder feature.

If it works correctly, DO NOT modify it.

Only fix genuine problems involving:
- Reminder schedules
- Taken / Skipped / Remind Later actions
- Medication history
- Upcoming reminders
- Saving and restoring records

Make the medication schedule easy to read and the main actions easy to tap.

Do not treat unlogged medication as a missed dose.

Do not add external notifications.

## PRIORITY 4 — CAREGIVER ALERTS

Inspect the existing caregiver alert system.

Keep working caregiver settings, consent, notifications, and acknowledgement features unchanged.

Only add genuinely missing detection for:
- Repeated high glucose readings
- Repeated low glucose readings
- Meaningful changes from an established baseline, when enough data exists
- Persistent out-of-range patterns

Reuse existing deterministic pattern detection and configured thresholds.

Make alert messages easy to understand and show the supporting readings.

Preserve consent and avoid duplicate alerts.

Do not invent emergency thresholds, create a caregiver dashboard, or implement external notifications.

## PRIORITY 5 — MULTILINGUAL USABILITY

Check English, Bahasa Melayu, and Simplified Chinese.

Only fix missing translations or text that is difficult to understand.

Ensure new text and usability improvements work in all three languages.

Do not replace the existing translation system.

## STRICT CREDIT-SAVING RULES

1. Inspect before editing.
2. Skip completed features.
3. Modify only necessary files.
4. Reuse existing components and functions.
5. Do not install new dependencies.
6. Do not rebuild the application.
7. Do not change unrelated features.
8. Do not introduce backend services.
9. Do not refactor working code.
10. Do not create additional pages.
11. Do not redesign the entire UI.
12. Do not repeat previously completed tasks.
13. Avoid unnecessary testing loops.
14. Perform one targeted verification of changed functionality.
15. Keep the final explanation short.

## IMPLEMENTATION ORDER

First: Fix the three most important existing usability problems, prioritising mobile navigation, readability, and completing common patient tasks.

Second: Complete the seven-day care plan only if incomplete.

Third: Fix medication reminders only if broken.

Fourth: Improve caregiver alert detection only if missing.

Fifth: Fix translations affected by these changes.

If a task is already complete, skip it immediately.

If the work is too large for one run, stop after completing the current priority. Do not start unrelated work.

## FINAL RESPONSE

Briefly report:
- What was already working and skipped
- What was improved
- Which files changed
- Whether the changes were verified

MOST IMPORTANT:
Use the fewest possible code changes and Lovable credits while making DiaMonitor Global easier to use, especially for elderly patients.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7860c1db-824e-44d4-864c-b3a008a96f0b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
