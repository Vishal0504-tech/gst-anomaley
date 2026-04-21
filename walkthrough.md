# GST Anomaly Detection Dashboard — Complete Engineering Walkthrough

---

## 1. Problem & Purpose

### What Problem Does It Solve?

India's GST (Goods & Services Tax) system collects trillions of rupees annually. However, a significant portion is **lost to tax evasion** — businesses under-report their turnover to pay less tax. Manual auditing is:

- **Slow** — A team of auditors can investigate only a handful of businesses per month
- **Biased** — Human auditors may miss patterns hidden across thousands of records
- **Reactive** — Fraud is caught only *after* significant revenue is lost

**Our system solves this** by using an AI/ML anomaly detection model that:
1. Scans thousands of businesses instantly
2. Flags statistically suspicious ones using cross-signal analysis (electricity usage vs reported turnover vs employee count)
3. Ranks them by risk score so auditors know exactly *who to audit first*

### Target Users

| User | Role |
|------|------|
| 🏛️ GST Officers | Audit suspicious businesses |
| 📊 Department Analysts | Study sector-wide trends |
| 🧑‍💼 Department Heads | View macro reports, approve audits |
| 🤖 Data Scientists | Validate the ML model outputs |

### What Makes It Different?

| Traditional System | Our System |
|--------------------|------------|
| Manual spreadsheet review | AI-powered automatic flagging |
| No explainability | Shows *why* a business was flagged |
| No prioritisation | Ranks businesses by revenue impact |
| Single static report | 6 interactive live pages |
| Auditor decides randomly | Audit Priority Queue with CRITICAL/High/Medium |

---

## 2. Requirements Gathering

### Functional Requirements (Must-Have Features)

| # | Requirement | Where It's Implemented |
|---|-------------|------------------------|
| F1 | Show all businesses with risk scores | Dashboard Page (`/`) |
| F2 | Filter only suspicious businesses | Directory Page (`/directory`) |
| F3 | Search by Business ID | Directory + Investigation pages |
| F4 | Deep-dive into a single business | Investigation Page (`/investigation`) |
| F5 | Explain *why* a business was flagged | AI Explainability block in Investigation |
| F6 | Compare business ratios to industry average | Grouped Bar Chart in Investigation |
| F7 | Analyse scatter of ratios per sector | Industry Ratios Page (`/industry`) |
| F8 | Rank businesses by audit priority | Priority Queue Page (`/priority`) |
| F9 | Show city-level anomaly density | Reports Page (`/reports`) |
| F10 | Export suspicious businesses to CSV | Export button in Reports |

### Non-Functional Requirements

| # | Requirement | How We Handle It |
|---|-------------|------------------|
| NF1 | **Fast load** — pages must load in < 2s | Vite bundler, lazy data fetching |
| NF2 | **Error resilience** — graceful backend-down handling | `ErrorState` component on every page |
| NF3 | **Responsive** — works on laptop/desktop | Tailwind responsive grid (`grid-cols-1 lg:grid-cols-2`) |
| NF4 | **Accessible** — semantic HTML, IDs on all inputs | `id` attributes on every interactive element |
| NF5 | **Real-time** — data always fresh from API | Every page fetches on mount with `useEffect` |
| NF6 | **Readable code** — maintainable for hackathon judges | Component-per-file, descriptive names |

---

## 3. Technology Stack (and WHY each was chosen)

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│  React 18 → Component-based, huge ecosystem, hooks          │
│  Vite     → 10x faster than CRA build tool                  │
│  Tailwind → Utility classes = fast, consistent styling       │
│  React Router DOM → Multi-page SPA without page reloads     │
│  Axios    → Better than fetch: auto JSON parse, interceptors │
│  Recharts → React-native charting, Recharts = pure SVG       │
│  Lucide React → 1000+ clean SVG icons as React components   │
└─────────────────────────────────────────────────────────────┘
                             │ HTTP REST calls
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                              │
│  FastAPI (Python) → async, auto-docs, fast validation       │
│  Anomaly Detection ML (Isolation Forest / custom model)      │
│  CSV/Excel data source → loaded at startup                   │
└─────────────────────────────────────────────────────────────┘
```

### Why React 18 over Vue or Angular?
- **Hooks** (`useState`, `useEffect`, `useMemo`, `useCallback`) make state management clean and predictable
- Massive community — every chart library, icon pack, and router has React support
- **React 18 Concurrent Rendering** makes the UI feel instantaneous

### Why Vite over Create React App?
- CRA takes 30–60 seconds to start; Vite starts in **< 1 second**
- Hot Module Replacement (HMR) — changes appear in browser instantly without full reload

### Why Tailwind over custom CSS?
- No CSS file switching — styles live right next to JSX
- Design system built-in (spacing, colors, shadows all consistent)
- **No dead CSS** — only classes you use get included in the final build

### Why Recharts over Chart.js?
- Recharts is built **for React** — each chart part is a React component (`<BarChart>`, `<Bar>`, `<XAxis>`)
- Chart.js needs imperative DOM manipulation — not the "React way"
- Recharts is responsive out-of-the-box via `<ResponsiveContainer>`

---

## 4. System Design & Architecture

### Overall Architecture: Client-Server SPA

```
Browser (React SPA)
    │
    │  HTTP GET /api/scan          ← fetches all businesses at page load
    │  HTTP GET /api/business/{id} ← fetches single business on search
    ▼
FastAPI Server (localhost:8000)
    │
    │  Loads CSV data
    │  Runs ML model (Isolation Forest / custom)
    │  Computes Risk_Score, Is_Suspicious, Explanation
    ▼
Returns JSON responses
```

### Frontend File Structure

```
src/
├── main.jsx           → Entry: mounts React into <div id="root">
├── App.jsx            → Route map: which URL → which page
├── index.css          → Global styles: Tailwind + custom component classes
│
├── services/
│   └── api.js         → ALL API calls live here (single source of truth)
│
├── components/        → Reusable UI "bricks" (used by multiple pages)
│   ├── Layout.jsx     → Page shell = Sidebar + Header + <main>
│   ├── Sidebar.jsx    → Left nav with 6 links
│   ├── Header.jsx     → Top bar: page title + live indicator
│   ├── KPICard.jsx    → Metric card (icon + number + description)
│   ├── RiskBar.jsx    → Color-coded progress bar
│   ├── Spinner.jsx    → Loading animation
│   └── ErrorState.jsx → Backend-down error UI
│
└── pages/             → One file per page (the 6 routes)
    ├── Dashboard.jsx
    ├── Directory.jsx
    ├── Investigation.jsx
    ├── Industry.jsx
    ├── Priority.jsx
    └── Reports.jsx
```

### Data Flow (what happens when you open the app)

```
1. User opens http://localhost:5173/
2. Browser loads index.html → downloads main.jsx bundle
3. React mounts, BrowserRouter activates
4. App.jsx matches "/" → renders Dashboard inside Layout
5. Layout renders Sidebar + Header + Dashboard
6. Dashboard's useEffect fires → calls fetchAllBusinesses()
7. Axios sends GET http://localhost:8000/api/scan
8. FastAPI responds with JSON array of 1000 businesses
9. React setState stores data → re-renders with KPI cards + charts
```

### API Contract

**`GET /api/scan`** — used by: Dashboard, Directory, Industry, Priority, Reports
```json
{
  "status": "success",
  "total_records": 1000,
  "data": [
    {
      "Business_ID": "GSTIN_37D516C6",
      "City": "Dahej",
      "Industry": "IT Services",
      "Reported_Turnover": 4925370.67,
      "Risk_Score": 39.0,
      "Is_Suspicious": true,
      "ElectricityBill": 51234.5,
      "Employee_Count": 12
    }
  ]
}
```

**`GET /api/business/{id}`** — used by: Investigation page only
```json
{
  "status": "success",
  "data": {
    "business_data": { ...same fields + "Explanation": "High electricity ratio..." },
    "industry_averages": {
      "avg_electricity_ratio": 0.000045,
      "avg_employee_ratio": 0.0000023
    }
  }
}
```

---

## 5. UI/UX Design

### Design Language: Enterprise Light Theme

| Element | Style Decision | Reason |
|---------|---------------|--------|
| Background | `bg-gray-50` (very light gray) | Reduces eye strain in long sessions |
| Cards | White + `shadow-sm` + `rounded-xl` | Feels premium, modern |
| Sidebar | White + `border-r border-gray-200` | Clean separation |
| Primary action | `bg-blue-600` | Trust/professional color |
| Danger/Risk | `text-red-600`, `bg-red-50` | Universal danger signal |
| Success/Normal | `text-green-600`, `bg-green-50` | Universal safe signal |
| Font | Inter (Google Fonts) | Most readable sans-serif |
| Icons | Lucide React | Consistent stroke width, clean |

### Responsive Design

- **Sidebar:** Fixed 256px on all screens (hides on mobile with `md:block` in production)
- **KPI Cards:** `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4` — 1 col on mobile, 4 on wide screens
- **Charts:** `<ResponsiveContainer width="100%">` — chart always fills its container

### UX Micro-Interactions

- Sidebar active link: highlighted with blue background and right chevron `›`
- Table rows: `hover:bg-gray-50/70` — subtle row highlight on hover
- Spinner: custom CSS animation, not browser-default loading
- Risk bar: CSS `transition-all duration-500` — bar width animates in
- Buttons: `hover:bg-blue-700` + `transition-colors` — smooth color shift
- Sort arrows in Priority table: ChevronUp/Down icons change with sort direction

---

## 6. Database Design

> The "database" here is a CSV/Excel file read by the FastAPI backend at startup. The ML model processes it and returns enriched data.

### Data Schema (what the API sends back)

| Field | Type | Description |
|-------|------|-------------|
| `Business_ID` | string | Unique GSTIN identifier (e.g. `GSTIN_37D516C6`) |
| `City` | string | City of operation |
| `Industry` | string | Sector (Retail, Logistics, IT Services, Manufacturing) |
| `Reported_Turnover` | float | Self-reported annual revenue (₹) |
| `ElectricityBill` | float | Annual electricity expenditure (₹) |
| `Employee_Count` | int | Number of employees |
| `Risk_Score` | float | AI-computed 0–100 risk score |
| `Is_Suspicious` | bool | True if the ML model flagged this business |
| `Explanation` | string | Human-readable reason for flagging |

### Why These Fields for Anomaly Detection?

The ML model detects fraud by checking **signal vs turnover ratios:**

```
Electricity Ratio = ElectricityBill / Reported_Turnover
Employee Ratio    = Employee_Count  / Reported_Turnover
```

**If a business is genuinely doing ₹10 Cr revenue**, it should have:
- Proportional electricity usage (machines, lights, AC)
- Proportional employees (can't run a factory with 2 people)

**If the ratios are WAY above the industry average** → the company is consuming like a big business but reporting a tiny turnover → **suspected fraud**.

---

## 7. Security Basics

> This is a read-only analytics dashboard for internal government use (no user-generated data). Here's how security applies:

### What We Have

| Security Aspect | Implementation |
|-----------------|---------------|
| **CORS** | FastAPI allows `*` origins in dev (should be locked to frontend domain in prod) |
| **Input sanitisation** | `encodeURIComponent(id)` when building the URL in `api.js` — prevents URL injection |
| **No sensitive data stored** | All data is fetched live — no LocalStorage, no cookies |
| **Error messages** | Backend errors shown nicely but full stack traces are not exposed to users |
| **HTTPS** | Required in production — all traffic encrypted (Vite dev uses HTTP) |

### What Should Be Added for Production

| Attack | Fix |
|--------|-----|
| **Unauthorised access** | Add JWT authentication (department officers login first) |
| **CSRF** | Token-based request validation on FastAPI |
| **Data leaks** | Replace `allow_origins=["*"]` with specific frontend domain |
| **XSS** | React auto-escapes JSX — already protected |
| **SQL Injection** | Not applicable (no SQL DB) — but parameterised queries if DB added |

---

## 8. Scalability & Performance

### Current Performance Optimisations

| Optimisation | Code | Benefit |
|-------------|------|---------|
| `useMemo` | `Directory.jsx`, `Industry.jsx`, `Priority.jsx` | Expensive filter/sort only re-runs when data changes — not every render |
| `useCallback` | Every page's `load()` function | Stable function reference — prevents unnecessary re-renders |
| `ResponsiveContainer` | All Recharts | Chart only renders SVG paths it can display |
| Vite tree-shaking | `vite.config.js` | Dead code removed from bundle automatically |
| Tailwind purge | `tailwind.config.js` content array | Only used CSS classes shipped to browser |

### useMemo Example (Directory page)

```js
// WITHOUT useMemo — runs every keystroke, even for unrelated state changes
const filtered = businesses.filter(b => b.Business_ID.includes(search))

// WITH useMemo — only re-runs when businesses or search actually changes
const filtered = useMemo(() =>
  businesses.filter(b => b.Business_ID.includes(search)),
  [businesses, search]
)
```

### How to Scale for 1 Million+ Businesses

| Scale Issue | Solution |
|-------------|----------|
| 1M records too slow to send | Server-side pagination (`GET /api/scan?page=1&limit=50`) |
| Charts slow with 1M points | Backend pre-aggregation → send only summary data |
| Multiple cities/departments | Multi-tenant architecture with Department ID in API |
| Heavy ML model | Run ML offline (batch job) → store results in PostgreSQL |

---

## 9. Version Control

### Git Repository Structure

```
gst-detection/
├── .git/              ← Git tracking
├── backend/
│   ├── main.py        ← FastAPI server
│   ├── ml/            ← ML model
│   └── data/          ← CSV files
└── frontend/          ← Our React app (this project)
    ├── src/
    └── package.json
```

### Recommended Branching Strategy

```
main          ← stable, production-ready
  └── dev     ← integration branch
        ├── feature/dashboard-kpi-cards
        ├── feature/investigation-page
        └── bugfix/risk-bar-color
```

### Commit Message Convention

```
feat: add CSV export to Reports page
fix: handle 404 response in Investigation
refactor: extract RiskBar into shared component
docs: add API contract to walkthrough
```

---

## 10. Testing

### Unit Tests (What You Would Test)

| Component | Test Case |
|-----------|-----------|
| `RiskBar` | score=85 → red bar; score=50 → amber; score=30 → green |
| `KPICard` | renders label, value, and icon correctly |
| `fetchAllBusinesses` | returns array; throws on network error |
| `buildHistogram` | 10 buckets; business with score=95 lands in bucket 9 |
| `getPriority` | score=97 → CRITICAL; score=90 → High; score=70 → Medium |

### Integration Tests

- Dashboard loads: mocked API returns 5 businesses → 4 KPI cards render with correct values
- Directory filter: search "GSTIN_37" → only matching rows shown
- Investigation: type ID + click Investigate → shows profile card

### End-to-End Tests (with Playwright or Cypress)

```
1. Visit /
2. Assert 4 KPI cards visible
3. Click "View All" → URL becomes /directory
4. Type "GSTIN" in search → table rows update
5. Navigate to /investigation → enter ID → click Investigate
6. Assert "AI Explainability" section appears
7. Navigate to /reports → click "Export Audit List to CSV"
8. Assert file download triggered
```

---

## 11. Deployment & DevOps

### Development (Current)

```
npm run dev  →  Vite dev server on http://localhost:5173
              (FastAPI must also be running on http://localhost:8000)
```

### Production Build

```bash
npm run build   # Vite compiles + minifies → dist/ folder
npm run preview # Preview the production build locally
```

### Deployment Options

| Platform | Command | Best For |
|----------|---------|----------|
| **Vercel** | `vercel deploy` | Easiest — auto-deploy on git push |
| **Netlify** | `netlify deploy` | Similar to Vercel |
| **AWS S3 + CloudFront** | Manual upload | Enterprise production |
| **Docker** | `docker build + docker run` | Containerised deployment |

### Docker Setup (Production)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
# Serve with nginx
FROM nginx:alpine
COPY --from=0 /app/dist /usr/share/nginx/html
```

### Environment Variable for Backend URL

```js
// src/services/api.js — production-ready version
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api',
})
```

```bash
# .env.production
VITE_API_URL=https://api.gst-shield.gov.in/api
```

---

## 12. Monitoring & Maintenance

### What to Monitor in Production

| Signal | Tool | Alert When |
|--------|------|-----------|
| Frontend errors | Sentry (free tier) | Any JS exception |
| API latency | FastAPI middleware logs | Response time > 2s |
| API uptime | UptimeRobot | 5xx error rate > 1% |
| Usage analytics | Vercel Analytics | Page views, bounce rate |

### Adding Error Logging to the App

```js
// In api.js — log all failed requests
api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('[API Error]', err.config.url, err.response?.status)
    // Sentry.captureException(err)  ← uncomment in production
    return Promise.reject(err)
  }
)
```

---

## 13. Legal & Compliance

| Concern | Details |
|---------|---------|
| **Data Privacy** | Businesses' financial data is **government-collected** GST data — not personal consumer data. Still, access should be restricted to authorised officers. |
| **GDPR** | Not directly applicable (India uses DPDPA 2023 — Digital Personal Data Protection Act). Business financial data is not "personal data" under DPDPA. |
| **Library Licenses** | React (MIT), Tailwind (MIT), Recharts (MIT), Lucide (ISC), Axios (MIT) — all permissive open source. ✅ Safe for government use. |
| **AI Explainability** | Under India's draft AI governance framework, AI systems used in government decisions must be explainable — our "AI Explainability" block satisfies this. |
| **Audit Trail** | In production, every API call should be logged with: which officer, which Business_ID, timestamp. |

---

## 14. Documentation

### Code Documentation: Key Functions Explained

#### `api.js` — The Bridge Between Frontend and Backend

```js
// Creates a pre-configured Axios instance
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 15000,   // If backend doesn't respond in 15s → error
})

// Called by: Dashboard, Directory, Industry, Priority, Reports
export async function fetchAllBusinesses() {
  const res = await api.get('/scan')  // GET /api/scan
  return res.data.data // Unwrap: { status, total_records, data: [...] } → just the array
}

// Called by: Investigation page only
export async function fetchBusinessById(id) {
  const res = await api.get(`/business/${encodeURIComponent(id)}`)
  return res.data.data // Returns { business_data: {...}, industry_averages: {...} }
}
```

#### `RiskBar.jsx` — The Color-Coded Bar Logic

```js
// score: number 0–100 (from Risk_Score field)
const pct   = Math.min(Math.max(score, 0), 100)  // clamp between 0 and 100

const color =
  pct >= 80 ? 'bg-red-500'    // 80–100 = RED (dangerous)
  : pct >= 50 ? 'bg-amber-400' // 50–79  = AMBER (warning)
  : 'bg-green-500'             // 0–49   = GREEN (safe)

// The bar is: a fixed gray container with a colored inner div
// The inner div's width = pct% → visually shows the score
<div style={{ width: `${pct}%` }} />
```

#### Priority Calculation (`Priority.jsx`)

```js
// Formula given in the requirements:
// Est_Revenue_Impact = Reported_Turnover × (Risk_Score / 100) × 0.2

// Meaning: Of this business's reported turnover,
// (Risk_Score%) of it is likely fraudulent,
// and we estimate we can recover 20% of the fraud through audit.

const Est_Revenue_Impact = b.Reported_Turnover * (b.Risk_Score / 100) * 0.2

// Priority Level:
const priority =
  score >= 95 ? 'CRITICAL'  // Top 5% risk → raid immediately
  : score >= 85 ? 'High'    // 85-94 → schedule this quarter
  : 'Medium'                // Below 85 → in the queue
```

#### CSV Export (`Reports.jsx`)

```js
function exportCSV(businesses) {
  // Step 1: Filter only suspicious businesses
  const suspicious = businesses.filter((b) => b.Is_Suspicious)

  // Step 2: Define columns
  const headers = ['Business_ID', 'City', 'Industry', ...]

  // Step 3: Build CSV string
  const rows = suspicious.map((b) =>
    headers.map((h) => `"${b[h]}"`).join(',')
  )
  const csv = [headers.join(','), ...rows].join('\n')

  // Step 4: Create a temporary download link
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const a   = document.createElement('a')
  a.href     = url
  a.download = 'gst_audit_targets.csv'
  a.click()                  // Triggers browser file download
  URL.revokeObjectURL(url)   // Clean up memory
}
```

#### `useCallback` vs `useMemo` — Why Both?

```js
// useCallback → memoises a FUNCTION (so it doesn't get recreated every render)
const load = useCallback(async () => {
  const data = await fetchAllBusinesses()
  setBusinesses(data)
}, [])  // [] = "create this function once, never recreate it"

// useMemo → memoises a VALUE (computed result)
const filtered = useMemo(() =>
  businesses.filter(b => b.Industry === selected),
  [businesses, selected]  // "recompute only when these change"
)
```

---

## 15. Budget & Time Planning

### Development Time Breakdown

| Phase | Time Spent |
|-------|-----------|
| Backend (FastAPI + ML model) | ~8–12 hours |
| Project setup (Vite + Tailwind) | ~30 minutes |
| Layout + Sidebar + Header | ~1 hour |
| Shared components (KPICard, RiskBar, Spinner, ErrorState) | ~1 hour |
| Dashboard Page | ~2 hours |
| Directory Page | ~1 hour |
| Investigation Page | ~2 hours |
| Industry Page | ~1.5 hours |
| Priority Page | ~1.5 hours |
| Reports Page | ~1.5 hours |
| Bug fixes + polish | ~2 hours |
| **Total Frontend** | **~14 hours** |

### Infrastructure Cost (Production)

| Service | Cost |
|---------|------|
| Vercel (frontend hosting) | Free for govt/edu |
| AWS EC2 t3.medium (FastAPI) | ~₹3,500/month |
| Domain name | ~₹800/year |
| SSL Certificate | Free (Let's Encrypt) |
| **Total** | **~₹3,500/month** |

### Future Scaling Cost

| Scale | Additional Cost |
|-------|----------------|
| 10 concurrent users | No extra cost |
| 100 concurrent users | AWS Load Balancer + ~₹2,000/month |
| Real-time WebSocket alerts | AWS API Gateway WebSocket + ~₹1,000/month |
| PostgreSQL for millions of records | AWS RDS t3.micro + ~₹2,500/month |

---

## Page-by-Page Technical Breakdown

### PAGE 1: Global Dashboard (`/`)

**Purpose:** Command centre — first thing an officer sees. Shows the big picture.

**Data Source:** `GET /api/scan` → all 1000 businesses

**Key Functions:**
- `buildHistogram(businesses)` — groups businesses into 10 score buckets (0–10, 10–20, ... 90–100), counts Normal vs Suspicious in each
- `buildIndustryData(businesses)` — groups by Industry, counts Normal vs Suspicious per sector, sorts by highest suspicious count

**State:**
```
businesses: Business[]   ← raw API data (1000 items)
loading: boolean         ← shows Spinner while fetching
error: string|null       ← shows ErrorState if backend down
```

**What renders:**
1. 4 KPI Cards (derived from `businesses` array)
2. Industry Bar Chart (from `buildIndustryData`)
3. Risk Histogram (from `buildHistogram`)
4. Top-5 table → `[...suspicious].sort((a,b) => b.Risk_Score - a.Risk_Score).slice(0, 5)`

---

### PAGE 2: Suspicious Directory (`/directory`)

**Purpose:** "Give me everything that's flagged — I want to browse and search."

**Data Source:** `GET /api/scan` → filtered to `Is_Suspicious === true`

**Key Functions:**
- `useMemo` filtered list — searches Business_ID text AND filters by industry simultaneously
- Sort — always sorted by Risk_Score descending (highest risk first)
- `industries` array — extracted from suspicious data only (dropdown options)

**State:**
```
businesses: Business[]   ← only suspicious ones (filtered at load time)
search: string           ← text input value
industry: string         ← dropdown selection ('All' or specific industry)
```

---

### PAGE 3: Business Drill-Down (`/investigation`)

**Purpose:** "I have a specific ID, tell me everything about this business."

**Data Source:** `GET /api/business/{id}` — called only when user submits the search form

**Key Functions:**
- `handleSearch(e)` — prevents default form submit, calls `fetchBusinessById(query)`, handles 404 separately
- `comparisonData` — builds the grouped bar chart data:
  ```js
  [
    { metric: 'Electricity / Turnover',
      'This Business': biz.ElectricityBill / biz.Reported_Turnover,
      'Industry Avg': avg.avg_electricity_ratio },
    { metric: 'Employees / Turnover',
      'This Business': biz.Employee_Count / biz.Reported_Turnover,
      'Industry Avg': avg.avg_employee_ratio }
  ]
  ```
- AI Explainability block — uses `biz.Explanation` from backend OR generates a default message

**State:**
```
query: string            ← search input
result: {business_data, industry_averages} | null
loading: boolean         ← shows spinner on Investigate button
error: string|null       ← shows inline error (e.g. "Not found")
```

---

### PAGE 4: Industry Ratios (`/industry`)

**Purpose:** "Show me ALL businesses in one sector — who are the outliers?"

**Data Source:** `GET /api/scan` → filtered by selected industry

**Key Functions:**
- `electricData` (useMemo) — maps each business to `{ x: index, y: ElectricityBill/Turnover, suspicious: bool, id: string }`
- `employeeData` (useMemo) — same but for Employee_Count/Turnover
- `avgElec` / `avgEmp` — average of all ratios in the sector (shown as dashed reference line)
- `<Cell fill={suspicious ? '#ef4444' : '#22c55e'}>` — each scatter dot gets its own color

**State:**
```
businesses: Business[]   ← all businesses (all industries)
selected: string         ← currently chosen industry
```

---

### PAGE 5: Audit Priority Queue (`/priority`)

**Purpose:** "Tell me the exact order in which to schedule audits."

**Data Source:** `GET /api/scan` → filtered to `Is_Suspicious === true`

**Key Functions:**
- `Est_Revenue_Impact = Reported_Turnover × (Risk_Score / 100) × 0.2` — computed per row
- `getPriority(score)` — returns `{ label, cls }` (CRITICAL/High/Medium with Tailwind class)
- Sortable table — `handleSort(key)` toggles sort direction, `useMemo` re-sorts when `sortKey`/`sortDir` changes
- Ranked badge — first 3 rows get gold/silver/bronze circle numbers

**State:**
```
businesses: Business[]   ← only suspicious
sortKey: string          ← which column is sorted ('Est_Revenue_Impact')
sortDir: 'asc'|'desc'   ← sort direction
```

---

### PAGE 6: Reports & Analytics (`/reports`)

**Purpose:** "I need to brief the department head and email the audit list."

**Data Source:** `GET /api/scan` → used for all charts + export

**Key Functions:**
- `cityData` (useMemo) — groups by City, counts Suspicious/Normal, sorts by highest Suspicious
- `scatterData` (useMemo) — maps businesses to `{x: Turnover, y: ElectricityBill, suspicious, id}`
- `exportCSV(businesses)` — filters suspicious, builds CSV string, creates Blob URL, triggers download, cleans up

**State:**
```
businesses: Business[]   ← all (1000 businesses)
```

---

## 🔥 The Simple Flow In Our Project

```
Idea → Hackathon problem: GST revenue fraud detection
  ↓
Research → Studied how auditors flag businesses (electricity/employee cross-check)
  ↓
Plan → 6 pages: Dashboard, Directory, Investigation, Industry, Priority, Reports
  ↓
Design → Enterprise light theme, Tailwind, Inter font, blue/red/green palette
  ↓
Develop → React 18 + Vite + Recharts + Axios → 14 hours frontend
  ↓
Test → Browser verification: all 6 routes, API calls, CSV export
  ↓
Deploy → npm run build → Vercel / AWS
  ↓
Maintain → Monitor errors (Sentry), update ML model, add new cities/industries
```
