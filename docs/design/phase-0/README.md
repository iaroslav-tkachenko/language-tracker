# Phase 0 authentication foundation

This checkpoint introduces the responsive authentication surface and the server-side Supabase session boundary.

- [Desktop sign-in — 1366 × 768](auth-sign-in-desktop.png)
- [Mobile sign-in — 390 × 844](auth-sign-in-mobile.png)
- [Mobile sign-up — 390 × 844](auth-sign-up-mobile.png)

The screens are clickable without Supabase credentials and expose validation and configuration states. Registration, confirmation email, sign-in, sign-out, and recovery become end-to-end functional after a Supabase project is connected through `.env.local` and the version-controlled migrations are applied.

The previous Study Time prototype remains available at `/demo` while authenticated production data is implemented.
