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

- Keep pure deterministic financial formulas in `src/calculations` with rule-level tests, separate from presentation, so assumptions remain consistent throughout the journey.
- Use a client-only index for the R3F experience; keep the visual scene and guided stages in focused modules and financial content in browser-safe data files.
- Keep the educational demo session-local, with an explicit downloadable roadmap; no account or backend is needed for this UI-focused experience.
- Read 3D colors from global semantic CSS tokens and use local generated texture assets and Lightformer lighting rather than runtime third-party media.
- Keep frame-driven orbital and hover motion in a focused scene-motion module and DOM transitions in Motion; visual animation must never alter financial calculations.
