# EduVantage School Management Platform

**Next.js 14 · Turso (libSQL) · Africa's Talking · M-Pesa Daraja**

> "Empowering Education Excellence" — A production-grade Next.js App Router SaaS platform
> for centralized school operations, automated academic tracking, and real-time parent engagement.

---

## Project Structure

```
paav-school-portal/
│
├── app/
│   ├── layout.js                     Root layout (fonts, global CSS, shell)
│   ├── PortalShell.js                Client shell (navbar, inactivity, announcements)
│   ├── page.js                       Login (Sign In / Register / Forgot)
│   │
│   ├── dashboard/page.js             Role-based home (stats, fee bars, recent payments)
│   │
│   ├── learners/
│   │   ├── page.js                   Student list (search, filter, add, promote)
│   │   └── [id]/page.js              Profile + marks + fee statement
│   │
│   ├── grades/
│   │   ├── page.js                   CBC marks entry table (lock/unlock)
│   │   └── report-card/[id]/page.js  A4 printable report card
│   │
│   ├── classes/[grade]/page.js       Class & stream view
│   ├── merit-list/page.js            Top learners (CBC points ranked)
│   │
│   ├── fees/
│   │   ├── page.js                   All receipts + payment log
│   │   ├── [id]/receipt/page.js      Single learner printable receipt
│   │   └── pay/page.js               Public M-Pesa STK Push for parents
│   │
│   ├── teachers/
│   │   ├── page.js                   Staff list (add/edit/deactivate/SMS creds)
│   │   └── subjects/page.js          Assign subjects to teachers per grade
│   │
│   ├── sms/
│   │   ├── page.js                   Bulk SMS (parents/teachers/custom)
│   │   └── api/send/route.js         Re-exports /api/sms
│   │
│   ├── settings/
│   │   ├── streams/page.js           Rename class streams per grade
│   │   └── grading/page.js           Adjust CBC score thresholds
│   │
│   └── api/
│       ├── auth/route.js             Login / logout / register / Google / reset
│       ├── db/route.js               Turso KV proxy (get/set/delete/timestamps)
│       └── sms/route.js              Secure SMS sender (Africa's Talking)
│
├── components/
│   ├── Navbar.js                     Role-based top navigation
│   ├── QuickAccess.js                Smart shortcut grid
│   ├── RoleGuard.js                  Client-side route/section protection
│   ├── TabState.js                   Persisted tab state (sessionStorage)
│   ├── ReportCard.js                 PDF-ready A4 report card component
│   └── MeritList.js                  Ranked CBC scores table + podium
│
├── lib/
│   ├── db.js                         Turso client + kvGet/kvSet/kvDelete helpers
│   ├── auth.js                       JWT session, role checker, password hashing
│   ├── cbe.js                        CBC grading engine (gInfo, buildMeritList, …)
│   ├── sms-client.js                 Africa's Talking SMS integration
│   └── mpesa.js                      Safaricom M-Pesa STK Push
│
├── styles/globals.css                All CSS (extracted from index-122.html)
├── package.json
├── next.config.js
├── tailwind.config.js
├── vercel.json
└── .env.example
```

---

## Quick Start

### 1. Clone & install

```bash
git clone https://github.com/eduvantage-app/school-portal.git
cd school-portal
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
# Edit .env.local and fill in your Turso, AT, M-Pesa and JWT secrets
```

### 3. Run locally

```bash
npm run dev
# Open http://localhost:3000
```

### 4. Deploy to Vercel

```bash
vercel --prod
# Set environment variables in the Vercel dashboard (Settings → Environment Variables)
# or use `vercel env add` for each variable in .env.example
```

---

## Roles & Access

| Role    | Pages accessible |
|---------|-----------------|
| admin   | Everything |
| teacher | Dashboard, Learners, Grades, Attendance, Merit List, Classes |
| staff   | Dashboard, Fees, Duties |
| parent  | Parent Home, My Child's Report, Fee Statement |

---

## CBC Grading Engine (`lib/cbe.js`)

- **Primary / Pre-School (KG–Grade 6):** 4-level scale (EE → BE), 4 pts/subject
- **JSS / Senior (Grade 7–12):** 8-level scale (EE1 → BE2), 8 pts/subject
- Admin can adjust thresholds per level via **Settings → Grading**

### Key functions

```js
import { gInfo, buildMeritList, calcLearnerPoints } from '@/lib/cbe';

// Grade a single score
const { lv, pts, bg, c, desc } = gInfo(75, 'GRADE 8');
// → { lv: 'ME1', pts: 6, bg: '#BFDBFE', c: '#1D4ED8', desc: '...' }

// Build a ranked class list
const ranked = buildMeritList(learners, marks, 'GRADE 7', 'T1', 'mt1');
```

---

## Database (`lib/db.js`)

All data is stored as JSON blobs in a single Turso `kv` table:

| Key | Content |
|-----|---------|
| `paav6_learners` | All learner records |
| `paav6_staff` | Staff / parent accounts |
| `paav6_marks` | All marks entries |
| `paav6_fees` / `paav6_feecfg` | Fee payments + config |
| `paav6_paylog` | Payment audit log |
| `paav7_sms` | SMS log |
| `paav7_audit` | General audit log |
| `paav8_grad` | Custom grading thresholds |
| `paav7_streams` | Stream names per grade |
| `paav_announcement` | Announcement banner |
| `paav_paybill` | M-Pesa Paybill number |
| `paav_teacher_assignments` | Subject → teacher mapping |

---

## SMS (`lib/sms-client.js`)

Uses **Africa's Talking**. Set `AT_USERNAME=sandbox` for testing.

```js
import { sendSMS, sendBulkSMS } from '@/lib/sms-client';

await sendSMS({ to: '0712345678', message: 'Hello from EduVantage Portal!' });
await sendBulkSMS(['+254712345678', '+254723456789'], 'School closed tomorrow.');
```

---

## M-Pesa (`lib/mpesa.js`)

Implements the **STK Push** (Lipa na M-Pesa Online) flow.

```js
import { stkPush } from '@/lib/mpesa';

const result = await stkPush({
  phone:      '0712345678',
  amount:     3000,
  accountRef: '101',          // learner adm no.
  description: 'School Fees',
});
```

---

## Original HTML → Next.js mapping

| HTML section (`id`) | Next.js route |
|---------------------|---------------|
| `#auth` + login logic | `app/page.js` |
| `#pg-dashboard` | `app/dashboard/page.js` |
| `#pg-learners` | `app/learners/page.js` |
| `#pg-profile` | `app/learners/[id]/page.js` |
| `#pg-grades` | `app/grades/page.js` |
| `#pg-report-card` | `app/grades/report-card/[id]/page.js` |
| `#pg-merit` | `app/merit-list/page.js` |
| `#pg-fees` | `app/fees/page.js` |
| `#pg-receipt` | `app/fees/[id]/receipt/page.js` |
| `#pg-sms` | `app/sms/page.js` |
| `#pg-staff` | `app/teachers/page.js` |
| `_cloudSv` / `_cloudLd` | `app/api/db/route.js` (POST) |
| `sendSMS()` | `app/api/sms/route.js` |
| `_stkPush()` | `lib/mpesa.js` → `/api/mpesa/stk` |
| `gInfo()` | `lib/cbe.js → gInfo()` |

---

## License

MIT — EduVantage SaaS Platform. All Rights Reserved 2026.
