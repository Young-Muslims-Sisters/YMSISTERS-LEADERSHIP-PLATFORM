# YM Sisters Leadership Platform

Collects YM Sisters leadership information each year and makes it searchable.

| Page | What it does | Who can open it |
|---|---|---|
| `/` | Annual leadership form | Anyone with the link |
| `/directory` | Search leaders, view profiles, export contacts | Anyone with a `@ymsisters.com` account |
| `/admin` | View responses and email status | Listed IT emails only |
| `/glossary` | YM terms | Anyone |

**Built with:** Next.js, TypeScript, Tailwind, Supabase (database and Google sign-in).

## Run it locally

You need [Node.js](https://nodejs.org) and [Docker Desktop](https://www.docker.com/products/docker-desktop/).

**First time**

1. Open Docker Desktop.
2. Install packages: `npm --prefix apps/web install`
3. Start the local database: `npm run db:start`
4. Copy `apps/web/.env.example` to `apps/web/.env.development.local`. Fill in the URL and keys shown by `npm run db:status`.
5. Load the lists and sample people: `npm run db:reset`

**Every time**

1. Open Docker Desktop.
2. Run `npm run dev`
3. Go to http://localhost:3000. On the login page, use the test buttons.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Run the app with the local database |
| `npm run typecheck` / `npm run lint` | Check the code |
| `npm run db:test` | Test database rules |
| `npm run test:e2e` | Test the app in a browser (local only) |
| `npm run db:reset` | Rebuild the local database. **Deletes local data.** |
| `npm run build`, then `npm start` | Run the production build. **Uses the live database.** |

## Two databases

| | Local | Live |
|---|---|---|
| Runs in | Docker | Supabase cloud |
| Settings file | `.env.development.local` | `.env.local` |
| Data | Fake people | **Real people** |

Settings files are never committed. Never share `SUPABASE_SERVICE_ROLE_KEY`.

## Deploy

1. **Vercel:** import this repo and set **Root Directory** to `apps/web`.
2. **Environment variables:**

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (mark **Sensitive**) |
   | `FORM_CYCLE_YEAR` | `2027` |

3. **Supabase > Authentication > URL Configuration:** set the Site URL to your site, and add `https://YOUR-SITE/auth/callback**` to Redirect URLs.

<details>
<summary>Google sign-in setup (once per project)</summary>

1. In Google Cloud, create an **Internal** OAuth client of type Web application.
2. Add the redirect URI `https://<project-ref>.supabase.co/auth/v1/callback`.
3. In Supabase > Authentication > Providers, turn **Google** on with that client ID and secret, and turn **Email** off.
4. Keep "Allow new users to sign up" on. The database decides who sees anything.

</details>

## Common changes

| To change | Do this |
|---|---|
| Database structure | Add a file in `supabase/migrations/`, then `npx --prefix apps/web supabase db push --remote` |
| Locations, positions, teams, skills | Edit `supabase/seeds/reference.sql`, then run it on the live database |
| Allowed email domain | Run `insert into private.allowed_domains values ('new-domain.org');` and update `apps/web/src/lib/ym.ts` |
| IT access | Run `insert into private.it_admins values ('name@ymsisters.com');` |
| Glossary | Edit `apps/web/src/lib/glossary.ts` |

Never run `seeds/local_auth.sql` or `seed.sql` on the live database.

## Not built yet

- Sending SRC emails ([what's needed](docs/SRC_EMAILS.md))
- Spam protection on the form
- Correcting answers from the IT dashboard

## Where things are

```
apps/web/src/app/         Pages
apps/web/src/components/  Form, directory, dashboard
apps/web/src/lib/         Validation and server code
supabase/migrations/      Database structure and access rules
supabase/seeds/           Lists used by the form
docs/                     Product rules and architecture
```

More: [product rules](docs/README.md) · [architecture](docs/ARCHITECTURE.md) · [design](docs/FIGMA_ASSETS.md)
