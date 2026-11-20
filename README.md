# Kirpa Truck Dispatch & Logistics — Admin Panel

Next.js 15 (App Router) + MongoDB (Mongoose) admin panel for managing drivers, trucks,
trailers, companies, dispatches (loads), invoices, and training material.

## Features

- **Top navigation bar** — Dashboard, Driver, Truck, Trailer, Company, Dispatch, Syllabus, Daily Lectures;
  profile menu with My Profile, Staff & Dispatchers and Data Backup (admins).
- **Dashboard** — active loads, monthly revenue, unpaid invoices, driver/truck availability,
  6-month revenue chart, live tracking of loads on the road, compliance alerts
  (CDL, DOT medical card, registration/IRP, annual DOT inspection, insurance, IFTA, HVUT expiring within 30 days).
- **Dispatch** — trip setup, main + team drivers, truck/trailer assignment, broker load # / PO #, BOL #,
  PARS / PAPS # for US ⇄ Canada loads, multiple pickups and deliveries (shipper / receiver), line haul
  (flat rate / per mile / per hour / per unit), fuel surcharge per mile, accessorials (detention, layover,
  lumper, TONU, tarp…), optional Canadian GST / HST, live invoice summary, auto invoice numbers
  (`KD-1001`…), printable invoice.
- Built for the USA and Canada: US dollars (or CAD), miles, lbs, all US states + Canadian provinces,
  MC / USDOT numbers, ZIP / postal codes.
- **Tracking** — 8-step load progress, check calls (status + location + note) with history.
  Driver, truck and trailer status automatically switch to *On Trip / In Use* when a load is
  active and back to *Available* when it's delivered, cancelled or deleted.
- **Drivers** — CDL number/class/endorsements, DOT medical card, MVR and drug test dates, FAST card / passport
  for cross-border drivers, pay type (per mile, % of load, flat, hourly, salary) and documents.
- **Trucks & Trailers** — VIN, plate & state/province, ELD, registration (IRP), annual inspection, insurance,
  IFTA, HVUT (2290) and documents.
- **Companies** — brokers, shippers, receivers, customers, factoring companies with MC / DOT, tax ID and terms.
- **Syllabus & Daily Lectures** — topics with PDFs and lecture links per batch.
- **Staff & Dispatchers** (admin only) — logins with roles (`admin`, `dispatcher`), profile and
  documents (resume, photo ID, work authorization, training certificate, agreement).
- **Document uploads** — PDF, images and Word files up to 15 MB, stored inside MongoDB (works on Vercel),
  only visible to logged-in users.
- **Backups** — `npm run backup` writes everything to `backup/<date-time>/`; admins can also download a
  backup from **Data Backup** in the app. `npm run restore` puts a backup back.

## Setup

Requirements: Node.js 20+ and MongoDB (local or MongoDB Atlas).

```bash
npm install
cp .env.example .env.local     # then edit MONGODB_URI, JWT_SECRET, seed admin login
npm run seed                   # creates the admin account + demo data
npm run dev                    # http://localhost:3000
```

- `npm run seed -- --no-demo` creates only the admin account (use this for the client's real database).
- `npm run seed -- --reset-demo` deletes all drivers, trucks, trailers, companies, dispatches, syllabus
  and lectures, then adds fresh demo data (logins are kept). Never run it on a database with real data.
- Optional: set `NEXT_PUBLIC_COMPANY_ADDRESS`, `NEXT_PUBLIC_COMPANY_PHONE`, `NEXT_PUBLIC_COMPANY_MC`,
  `NEXT_PUBLIC_COMPANY_DOT` and `NEXT_PUBLIC_COMPANY_GST_HST` to print them on invoices, and
  `NEXT_PUBLIC_CURRENCY=CAD` to bill in Canadian dollars (restart / redeploy after changing them).
- Log in with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` from `.env.local`, then change the
  password under **Staff & Dispatchers**.

## Production

```bash
npm run build
npm start
```

Uploaded documents are stored in MongoDB (collections `uploads` and `upload_chunks`), so they work on
Vercel and are included in backups. Files are sent in 3 MB pieces to stay under Vercel's request limit.

## Backups

```bash
npm run backup                                   # -> backup/<date-time>/
npm run restore -- backup/<folder or file.json>   # adds missing records
npm run restore -- backup/<folder> --replace      # makes the database match the backup exactly
```

The `backup/` folder is not pushed to GitHub because it contains private data.

## Where things live

| Path | What |
|---|---|
| `src/lib/resources.js` | Field config for drivers, trucks, trailers, companies, staff, syllabus, lectures — drives schemas, forms, tables and filters |
| `src/lib/dispatch.js` | Dispatch statuses, fee types, accessorials, tax and invoice math |
| `src/lib/files.js` | Upload limits and file types |
| `src/models/index.js` | Mongoose models |
| `src/app/api/` | REST API (`/api/[resource]`, `/api/track/[id]`, auth, uploads) |
| `src/components/` | UI: shell, lists, forms, dispatch form/view/invoice |
| `scripts/seed.mjs` | Admin + demo data |
| `scripts/backup.mjs`, `scripts/restore.mjs` | Backup and restore |
