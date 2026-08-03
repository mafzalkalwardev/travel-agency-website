# Security notes for maintainers

## Secrets

- Never commit `.env`, `.env.local`, or credential dumps.
- Required production secrets live in **Vercel** and **GitHub Actions → Secrets**.
- If this repository is public, assume all *code* is readable — only *secrets* stay private.
- Rotate `CRON_SECRET`, database passwords, and provider passwords if exposure is suspected.

## Admin

- Use a unique strong admin password.
- Prefer Supabase Auth users with `role=admin` over shared weak passwords.

## Cron endpoints

- All `/api/cron/*` routes require `Authorization: Bearer $CRON_SECRET`.
- Do not publish `CRON_SECRET` in README, issues, or screenshots.
