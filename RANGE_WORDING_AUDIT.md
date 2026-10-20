# Range and source wording audit

## Changes

Updated component calls and English dictionary keys together: Within Range, Above Range, Below Range, Glucose Range, fasting threshold and medical sources. Complete sentences, caregiver descriptions, the emergency-card footer and care-plan source badge use natural wording without the obsolete term. Malay and Chinese translations were updated, including the informational-estimate warning without weakening its medication-safety instruction.

Inspected local Copilot generators, record-answer formatting, online prompt instructions and source display. The online endpoint selects record IDs/intents via structured output; it does not return free-form prose or invented medical citations. Existing source lists remain intact. The source-status explanation now says “medical sources.” No patient-entered text is sanitized or rewritten.

## Verification

- TypeScript passed; production build passed.
- 63 relevant tests passed. The final 34-test rerun additionally verified all six pages in English, Malay and Chinese, the complete translation dictionary and expanded print-report content.
- Chart tests preserve every numeric value, timestamp, threshold and stored source.
- Browser inspected Overview, My Health, My Care Plan, Doctor Visit, Emergency and an actual local Copilot response with expanded source information. No obsolete standalone wording appeared. Malay and Chinese source information were also checked.
- The local preview was freshly reloaded after the build, showing the updated badges and chart caption. It uses the current Vite source; the production bundle was separately validated.
- No reset, scenario loading, patient-record editing, threshold change or external AI submission was performed during browser verification. No medical calculations, authentication, storage, synchronization or source-attribution behavior was changed. The caregiver module change is one wording-only message constant.

## Remaining case-insensitive raw search matches

These are intentionally retained technical identifiers, comments or unrelated words. None produces the unwanted patient-facing wording.

| File and line | Reason |
| --- | --- |
| `src/components/GlucoseChart.tsx:7` | Recharts `ReferenceArea` import; library API, not UI text. |
| `src/components/GlucoseChart.tsx:8` | Recharts `ReferenceLine` import; library API, not UI text. |
| `src/components/GlucoseChart.tsx:72` | `ReferenceArea` JSX element; renders chart shading, not its name. |
| `src/components/GlucoseChart.tsx:78` | `ReferenceLine` JSX element; renders the unchanged threshold line. |
| `src/components/ui/chart.tsx:51` | `.recharts-reference-line` CSS selector; required styling identifier. |
| `src/lib/types.ts:71` | Internal threshold documentation comment; not rendered. |
| `src/components/ConnectedHealth.tsx:317` | “sharing preferences”; unrelated word, not “references.” |
| `src/components/ConnectedHealth.tsx:322` | “Change preferences”; unrelated word. |
| `src/components/HealthReplay.tsx:213` | “Change preferences”; unrelated word. |
| `src/lib/translations-connected.ts:42` | Translation key containing “sharing preferences.” |
| `src/lib/translations-connected.ts:43` | Translation key “Change preferences.” |
| `supabase/migrations/20261015000100_meal_analysis_quota.sql:3` | SQL foreign-key `references` keyword; never rendered. |
| `supabase/migrations/20261016000100_copilot_quota.sql:3` | SQL foreign-key `references` keyword; never rendered. |

Case-insensitive searches covered the active production `src` tree and supporting `public`, `supabase` and `drizzle` sources. No `rujukan` or `参考` remains in the production translation dictionaries. Build artifacts, dependencies and the separate `.github-sync` upload checkout are not active application source.
