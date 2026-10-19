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

- Financial data is read/written from the browser via the Cloud client with RLS (owns_business helper) as the security boundary; ownership columns are frozen by update triggers. Why: no privileged server logic needed for the MVP.
- Money math goes through src/lib/finance.ts (integer paise) and is covered by src/test/finance.test.ts. Why: avoids float drift.
