# Peblo Notes 📝✨

> **AI-powered collaborative notes workspace** — Built for the Peblo Full-Stack Developer Challenge.

A full-stack application that lets users create and manage notes, organise them with tags, generate AI-powered summaries, search and filter content, share notes publicly, and view productivity insights — all in a polished, dark-mode-capable UI.

---

## ✨ Features

| Feature | Details |
|---|---|
| **Authentication** | JWT-based signup/login, bcrypt password hashing, persistent sessions |
| **Notes Workspace** | Create, edit, delete, archive notes with auto-save (1.5s debounce) |
| **AI Integration** | Gemini 1.5 Flash: summaries, action items, suggested titles |
| **Search & Filter** | Keyword search, tag filter, sort by updated/created date |
| **Public Share** | One-click public link, no-auth read access, copyable URL |
| **Insights Dashboard** | Notes count, AI usage, activity chart (7 days), most-used tags |
| **Dark Mode** | System-preference aware, persisted in localStorage |
| **Markdown Preview** | Toggle between edit and rendered markdown (Ctrl+M) |
| **Keyboard Shortcuts** | `Ctrl+S` to save, `Ctrl+M` for markdown preview |
| **Optimistic UI** | Notes appear instantly on create; roll back on failure |

---

## 🏗️ Architecture

```
peblo_task/
├── backend/                   # Node.js + Express API
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js    # SQLite init + schema
│   │   ├── middleware/
│   │   │   ├── auth.js        # JWT verification
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   │   ├── auth.js        # POST /auth/signup, /auth/login, GET /auth/me
│   │   │   ├── notes.js       # Full notes CRUD + AI + share
│   │   │   ├── shared.js      # GET /shared/:shareId (public)
│   │   │   └── insights.js    # GET /insights
│   │   ├── services/
│   │   │   └── aiService.js   # Gemini integration + mock fallback
│   │   └── server.js
│   ├── __tests__/
│   │   ├── auth.test.js
│   │   └── notes.test.js
│   ├── .env.example
│   └── package.json
│
├── frontend/                  # React 18 + Vite + Tailwind CSS
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.js      # Axios instance with interceptors
│   │   │   └── notes.js       # API wrapper functions
│   │   ├── components/
│   │   │   ├── NoteCard.jsx   # Note list item
│   │   │   ├── NoteEditor.jsx # Full editor with AI panel
│   │   │   ├── Sidebar.jsx    # Navigation + user info
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ThemeContext.jsx
│   │   ├── hooks/
│   │   │   ├── useDebounce.js
│   │   │   └── useNotes.js
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── InsightsPage.jsx
│   │   │   └── SharedNotePage.jsx
│   │   └── utils/date.js
│   └── package.json
│
├── sample_outputs/
│   ├── api_responses/         # Example JSON API responses
│   └── sample_dump.sql        # Sample SQLite database
│
└── README.md
```

---

## 🚀 Setup Instructions

### Prerequisites

- **Node.js** v18+ ([download](https://nodejs.org))
- **npm** v9+
- A **Google Gemini API key** (optional — app works with mock AI if not provided)
  - Get one free at: https://aistudio.google.com/app/apikey

---

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/peblo_task.git
cd peblo_task
```

---

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file from template
cp .env.example .env

# Edit .env — at minimum, set JWT_SECRET
# If you have a Gemini API key, set LLM_API_KEY too
nano .env   # or use any text editor
```

**Minimum `.env` configuration:**
```env
PORT=5000
DATABASE_URL=./data/peblo.db
JWT_SECRET=replace_with_a_long_random_string
JWT_EXPIRES_IN=7d
LLM_API_KEY=your_gemini_api_key   # optional — mock used if absent
FRONTEND_URL=http://localhost:5173
```

**Start the backend:**
```bash
# Development (auto-restarts on changes)
npm run dev

# Production
npm start
```

The backend will start at **http://localhost:5000**. On first run, it automatically creates the SQLite database at `./data/peblo.db`.

---

### 3. Frontend Setup

```bash
# From the project root
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will start at **http://localhost:5173**. API calls are proxied to the backend automatically (configured in `vite.config.js`).

---

### 4. Open the App

Visit **http://localhost:5173** in your browser.

1. Click **Sign up** to create an account
2. Create notes, add tags, and write content in Markdown
3. Click **AI Summary** in the editor toolbar to generate an AI summary
4. Click **Share** to get a public link to a note
5. Visit **Insights** in the sidebar for productivity stats

---

## 🧪 Running Tests

```bash
# Backend integration tests (uses in-memory SQLite — no setup needed)
cd backend
npm test
```

Tests cover:
- Auth: signup, login, token validation, duplicate email
- Notes: CRUD, keyword search, tag filtering, share/unshare

---

## 🔧 Environment Variables Reference

```env
# ─── Backend (.env) ───────────────────────────────────────────
PORT=5000                        # Server port
NODE_ENV=development             # development | production | test
DATABASE_URL=./data/peblo.db     # SQLite file path
JWT_SECRET=your_secret_here      # Any long random string
JWT_EXPIRES_IN=7d                # Token expiry: 7d, 24h, 30d etc.
LLM_API_KEY=your_gemini_key      # Google Gemini API key (optional)
GEMINI_MODEL=gemini-1.5-flash    # Gemini model name
FRONTEND_URL=http://localhost:5173  # Allowed CORS origin
```

> ⚠️ **Never commit your real `.env` file.** Only `.env.example` (with placeholder values) is committed.

---

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/signup` | — | Register new user |
| POST | `/auth/login` | — | Log in, receive JWT |
| GET | `/auth/me` | ✅ | Current user profile |
| GET | `/notes` | ✅ | List notes (search + filter) |
| POST | `/notes` | ✅ | Create note |
| GET | `/notes/:id` | ✅ | Get single note |
| PATCH | `/notes/:id` | ✅ | Update note (auto-save) |
| DELETE | `/notes/:id` | ✅ | Delete note |
| POST | `/notes/:id/generate-summary` | ✅ | AI summary + action items |
| POST | `/notes/:id/share` | ✅ | Make note public |
| POST | `/notes/:id/unshare` | ✅ | Make note private |
| GET | `/shared/:shareId` | — | Read public note (no auth) |
| GET | `/insights` | ✅ | Productivity stats |
| GET | `/health` | — | Health check |

---

## 🤖 AI Integration Details

**Provider:** Google Gemini 1.5 Flash

**Prompt strategy:** Structured JSON output prompt asking the model for:
- `summary` — 2-3 sentence summary
- `action_items` — array of extracted tasks
- `suggested_title` — improved title suggestion

**Graceful fallback:** If `LLM_API_KEY` is not set or an API error occurs, the service returns a realistic mock response. The `model_used` field in the response indicates whether live AI or the mock was used.

---

## 🛢️ Database Schema

```sql
-- Users
CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TEXT DEFAULT (datetime('now'))
);

-- Notes
CREATE TABLE notes (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL DEFAULT 'Untitled',
  content     TEXT NOT NULL DEFAULT '',
  tags        TEXT NOT NULL DEFAULT '[]',   -- JSON array
  is_archived INTEGER NOT NULL DEFAULT 0,
  is_public   INTEGER NOT NULL DEFAULT 0,
  share_id    TEXT UNIQUE,
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);

-- AI Usage / Summary History
CREATE TABLE ai_usage (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  note_id         TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  summary         TEXT,
  action_items    TEXT NOT NULL DEFAULT '[]',  -- JSON array
  suggested_title TEXT,
  model_used      TEXT,
  created_at      TEXT DEFAULT (datetime('now'))
);
```

---

## 🎨 Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React 18 + Vite | Fast HMR, modern component model |
| Styling | Tailwind CSS v3 | Utility-first, dark mode, rapid UI |
| Routing | React Router v6 | Declarative routes, protected routes |
| Charts | Recharts | Composable chart primitives |
| Markdown | react-markdown + remark-gfm | Full GFM markdown rendering |
| Backend | Node.js + Express | Lightweight, well-understood REST server |
| Database | SQLite (better-sqlite3) | Zero-config, portable, inspectable schema |
| Auth | JWT + bcrypt | Stateless, secure token auth |
| AI | Google Gemini API | Strong structured output, free tier |
| Testing | Jest + Supertest | Real HTTP integration tests |

---

## 📂 Sample Outputs

See the `sample_outputs/` directory for:
- `api_responses/auth_responses.json` — Auth API examples
- `api_responses/notes_responses.json` — Notes CRUD examples
- `api_responses/ai_summary_responses.json` — AI summary examples (live + mock)
- `api_responses/insights_response.json` — Insights dashboard example
- `sample_dump.sql` — Sample SQLite database with test data

---

## 🗝️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + S` | Save note immediately |
| `Ctrl + M` | Toggle markdown preview |

---

*Built with ❤️ for the Peblo Full-Stack Developer Challenge.*
