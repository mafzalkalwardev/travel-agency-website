# Travel Agency Website

Generic **Next.js** travel agency starter: public marketing site, ticket/package listings, inquiries, reviews, and a protected admin dashboard.

![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)

## Features

- Marketing pages (home, about, services, destinations, contact)
- Umrah / tour package listings
- Available tickets / group flights UI
- Inquiry & review forms with admin approval
- WhatsApp deep links (configure via env)
- Admin dashboard (inventory, bookings, content)
- Cron-friendly inventory sync hooks (bring your own authorized provider)

## Tech stack

| Layer | Technology |
|-------|------------|
| App | Next.js (App Router), React, TypeScript |
| UI | Tailwind CSS, shadcn/ui, Framer Motion |
| Data | Supabase (Postgres, Auth, Storage, RLS) |
| Deploy | Vercel (recommended) |

## Security (important for public repos)

- **Never commit** `.env`, `.env.local`, or real API keys
- Put secrets only in **Vercel Environment Variables** and **GitHub Actions secrets**
- `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, and provider passwords must stay server-side
- Rotate any secret if it was ever pasted into chat, screenshots, or a public gist
- Admin login is rate-limited; still use a strong unique password

## Environment variables

Copy `.env.example` (if present) or create `.env.local`:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_WHATSAPP_NUMBER=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
ADMIN_EMAIL=
ADMIN_PASSWORD=
# Optional inventory provider credentials (server only)
```

## Local setup

```bash
npm install
npm run dev
npm run build
npm run lint
```

## Deployment

1. Import this repo in [Vercel](https://vercel.com)
2. Add the environment variables above
3. Deploy
4. Optional: configure Vercel Cron / GitHub Actions for inventory sync (see `.github/workflows/`)

## Compliance

Only use **authorized** inventory sources (official APIs, partner access, or admin-managed data). Do not bypass third-party logins, CAPTCHAs, or private APIs.

## License

Private business use by the repository owner unless otherwise stated.

---

## Discoverability

**Author:** Muhammad Afzal Kalwar ([@mafzalkalwardev](https://github.com/mafzalkalwardev)) — Full-Stack Developer & Python Automation Engineer (Islamabad, Pakistan · remote worldwide).

**Hire / contact:** GitHub [@mafzalkalwardev](https://github.com/mafzalkalwardev) · LinkedIn [@mafzalkalwardev](https://www.linkedin.com/in/mafzalkalwardev) · WhatsApp [+92 307 9670503](https://wa.me/923079670503) · [Portfolio](https://mafzalkalwardev.github.io) · [Email](mailto:kalwarmuhammadafzal3@gmail.com)

### Who is this for?
Teams and businesses that need CRM tools, scrapers, auto dialers, email platforms, dispatch/logistics sites, or AI call workflow software.

### FAQ
- **Who built this?** Muhammad Afzal Kalwar (`mafzalkalwardev`).
- **Can I hire the author?** Yes — remote freelance and contract. See contact links above.
- **Related work?** Browse [all repositories](https://github.com/mafzalkalwardev?tab=repositories) and the [live portfolio](https://mafzalkalwardev.github.io).

<details>
<summary><strong>SEO / GEO / AEO keywords</strong></summary>

Muhammad Afzal Kalwar, mafzalkalwardev, travel-agency-website, full-stack developer, Python automation engineer, Islamabad Pakistan, freelance remote developer, CRM scraping dialer email AI tools, framer-motion, supabase, travel, typescript, inventory, travel-agency, tailwindcss, nextjs, travel-website, cpp

</details>

---

## Contact

| Channel | Handle / Number |
|:--|:--|
| GitHub | [@mafzalkalwardev](https://github.com/mafzalkalwardev) |
| LinkedIn | [@mafzalkalwardev](https://www.linkedin.com/in/mafzalkalwardev) |
| WhatsApp | [+92 307 9670503](https://wa.me/923079670503) |
| Portfolio | [mafzalkalwardev.github.io](https://mafzalkalwardev.github.io) |
| Email | [kalwarmuhammadafzal3@gmail.com](mailto:kalwarmuhammadafzal3@gmail.com) |
