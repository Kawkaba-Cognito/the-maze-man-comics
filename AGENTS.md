# Agent instructions

## Cursor Cloud (mobile / web agents)

- **GitHub:** `kawkaba-cognito/the-maze-man-comics`
- **Repo context:** See `CLAUDE.md` for overview, scripts, deploy (`npm run build` + `gh-pages`), and security/Supabase checklist.
- **Dependencies:** Use `npm install --legacy-peer-deps` (also set in `.cursor/environment.json` as the cloud `install` step).
- **Dev server:** `npm run dev` — Vite prints a local URL; GitHub Pages base path in dev is `/the-maze-man-comics/` (see `vite.config.js` `base`).
- **Verify build:** `npm run build`
- **Secrets:** Do not commit API keys. Add Supabase URL/anon key and any other env vars in **Cursor Dashboard → Cloud Agents → Secrets** when integration is wired; never put service role keys in the frontend.

## Local-only notes

Episode HTML and static assets live under `public/`; case-sensitive hosting expects `Assets` as built by Vite (`build.assetsDir`).
