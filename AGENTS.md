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

- All pages read one shared `AppData` via `useStore()` (src/lib/store.tsx); never duplicate sample data per page — keeps charts, report and insights consistent.
- Storage is isolated in store.tsx load/save (localStorage for now) so a backend can replace it without touching pages.
- Pattern detection lives in src/lib/patterns.ts as deterministic rules with tests; never let an LLM decide safety alerts.
- AI chat goes through src/lib/copilot-service.ts only; it must return demo-labelled answers and never fabricated sources until a real retrieval service is wired in.
- Store-dependent UI renders after client hydration (store starts null) to avoid SSR/locale date mismatches.
