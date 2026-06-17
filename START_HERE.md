# Shivakumar Dev App — Start & Run Guide

Quick reference for starting the app fresh or after changes.

---

## Prerequisites (one-time)

| Tool | Check | Install |
|---|---|---|
| Node.js 18+ | `node -v` | https://nodejs.org |
| PostgreSQL 14+ | `psql --version` | https://postgresql.org |
| Ollama | `ollama --version` | https://ollama.com |

---

## 1. First-Time Setup

### 1a. Install dependencies

Open two terminals — one in `backend/`, one in `frontend/`.

```bash
# Terminal 1 — Backend
cd SecurePayApp/backend
npm install

# Terminal 2 — Frontend
cd SecurePayApp/frontend
npm install
```

### 1b. Configure backend environment

Open `backend/.env` and fill in:

```env
# PostgreSQL — match your local Postgres credentials
DB_HOST=localhost
DB_PORT=5432
DB_NAME=Securepaydb
DB_USER=postgres
DB_PASSWORD=chrpindia@123

# Gmail SMTP — for contact form emails
SMTP_USER=shivakumar.chrp@gmail.com
SMTP_PASS=your_gmail_app_password_here    ← paste 16-char App Password here
SMTP_TO=shivakumar.chrp@gmail.com

# Ollama model
OLLAMA_MODEL=llama3.2:latest
```

> **How to get Gmail App Password:**
> 1. Google Account → Security → Enable 2-Step Verification
> 2. Security → App Passwords → Select "Mail" → Generate
> 3. Copy the 16-character password (no spaces) → paste as `SMTP_PASS`

### 1c. Create the PostgreSQL database

```bash
psql -U postgres -c "CREATE DATABASE \"Securepaydb\";"
```

### 1d. Run database setup (creates ALL tables)

```bash
cd SecurePayApp/backend
npm run db:setup
```

Expected output:
```
✅ Database tables created/updated successfully
```

Tables created:
- `users`, `otps`, `refresh_tokens`, `audit_logs`
- `notes`, `interview_questions`
- `portfolio_config`, `resume_data`
- `learning_resources` ← new
- `todos` ← new
- `bookmarks` ← new
- `projects` ← new

### 1e. Seed the super admin account

```bash
cd SecurePayApp/backend
npm run seed:admin
```

Login credentials → phone: `+917991234567` / password: `SuperAdmin@123`

### 1f. Pull the Ollama model (for AI portfolio chat)

```bash
ollama pull llama3.2:latest
```

---

## 2. Start the App (Every Time)

Open **3 terminals**:

### Terminal 1 — Ollama (AI chat)
```bash
ollama serve
```
Runs on `http://localhost:11434`

### Terminal 2 — Backend
```bash
cd SecurePayApp/backend
npm run dev
```
Runs on `http://localhost:5000`

### Terminal 3 — Frontend
```bash
cd SecurePayApp/frontend
npm run dev
```
Runs on `http://localhost:5173` (or 5174 — check terminal output)

---

## 3. URLs

| Page | URL |
|---|---|
| Public Portfolio | http://localhost:5173/ |
| Login | http://localhost:5173/login |
| Dashboard | http://localhost:5173/dashboard |
| Notes | http://localhost:5173/notes |
| Interview Prep | http://localhost:5173/interview |
| Resume Builder | http://localhost:5173/resume |
| Learning Tracker | http://localhost:5173/learning |
| Todo Board | http://localhost:5173/todos |
| Bookmark Manager | http://localhost:5173/bookmarks |
| Project Tracker | http://localhost:5173/projects |
| Edit Portfolio | http://localhost:5173/portfolio-editor |

---

## 4. After Pulling New Code Changes

If someone (or Claude) added new DB tables, re-run setup — it's safe, uses `CREATE TABLE IF NOT EXISTS`:

```bash
cd SecurePayApp/backend
npm run db:setup
```

Then restart backend:
```bash
npm run dev
```

---

## 5. Common Issues

### "Cannot connect to database"
```bash
# Check Postgres is running
pg_ctl status -D "C:/Program Files/PostgreSQL/16/data"

# Start if stopped
pg_ctl start -D "C:/Program Files/PostgreSQL/16/data"
```

### "Port 5000 already in use"
```bash
# Find and kill the process (PowerShell)
netstat -ano | findstr :5000
taskkill /PID <pid_number> /F
```

### "Ollama model not found"
```bash
ollama pull llama3.2:latest
```

### "Email not sending"
- Make sure `SMTP_PASS` in `.env` is a Gmail **App Password**, not your Google account password
- Check that 2-Step Verification is enabled on the Gmail account
- Restart backend after changing `.env`

### Frontend shows blank / 404
- Make sure backend is running on port 5000
- Check `frontend/vite.config.js` proxy points to `http://localhost:5000`

---

## 6. Project Structure

```
SecurePayApp/
├── backend/
│   ├── .env                    ← credentials & config
│   ├── src/
│   │   ├── app.js              ← Express entry point
│   │   ├── config/
│   │   │   ├── setupDb.js      ← run once: creates all tables
│   │   │   └── seedSuperAdmin.js
│   │   ├── controllers/        ← business logic
│   │   ├── routes/             ← API endpoints
│   │   └── middleware/
└── frontend/
    ├── index.html              ← PWA meta + manifest link
    ├── public/
    │   ├── manifest.json       ← PWA manifest
    │   └── sw.js               ← Service worker (offline)
    └── src/
        ├── main.jsx            ← registers service worker
        ├── App.jsx             ← all routes
        ├── pages/
        │   ├── Portfolio.jsx   ← public portfolio + chatbot
        │   ├── Dashboard.jsx   ← dashboard + sidebar (reused)
        │   ├── LearningTracker.jsx
        │   ├── TodoBoard.jsx
        │   ├── BookmarkManager.jsx
        │   └── ProjectTracker.jsx
        └── services/api.js     ← all API calls
```
