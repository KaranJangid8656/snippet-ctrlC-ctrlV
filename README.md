# ✦ Snippet Saver

> A minimal, fast, and beautiful full-stack app to save, search, and manage reusable code snippets, links, and notes.

![Dark Mode UI](./frontend/preview.png)

---

## 🗂 Folder Structure

```
SnippetCV/
├── backend/
│   ├── models/
│   │   └── Snippet.js       ← Mongoose schema
│   ├── routes/
│   │   └── snippets.js      ← REST API routes
│   ├── server.js            ← Express entry point
│   ├── .env                 ← Environment config
│   └── package.json
└── frontend/
    ├── index.html
    ├── style.css
    └── script.js
```

---

## 🏗 Tech Stack

| Layer      | Tech                          |
|------------|-------------------------------|
| Frontend   | HTML · CSS · Vanilla JS       |
| Backend    | Node.js · Express             |
| Database   | MongoDB · Mongoose            |
| Extras     | highlight.js (syntax colors)  |

---

## ⚡ Running the Project Locally

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MongoDB](https://www.mongodb.com/try/download/community) running locally on port `27017`

---

### Step 1 — Start MongoDB

Make sure MongoDB is running. On Windows you can start it via:

```powershell
# If installed as a service, it may already be running.
# Or start manually:
mongod --dbpath "C:\data\db"
```

---

### Step 2 — Install & Start Backend

```powershell
cd backend
npm install
npm run dev        # uses nodemon for auto-reload
# OR: npm start   # production start
```

Server will be live at: **http://localhost:5000**

---

### Step 3 — Open Frontend

Simply open `frontend/index.html` in your browser:

```powershell
# From project root:
start frontend\index.html
```

Or serve it with any static server:

```powershell
npx serve frontend
```

---

## 🚀 API Endpoints

| Method | Endpoint                    | Description                          |
|--------|-----------------------------|--------------------------------------|
| GET    | `/snippets`                 | Get all snippets (newest first)      |
| POST   | `/snippets`                 | Create a new snippet                 |
| GET    | `/snippets/search?q=query`  | Search by title or tags              |
| PATCH  | `/snippets/:id/favorite`    | Toggle favorite                      |
| DELETE | `/snippets/:id`             | Delete a snippet                     |

### POST `/snippets` — Request Body

```json
{
  "title": "Debounce Utility",
  "content": "function debounce(fn, delay) { ... }",
  "tags": ["javascript", "utility"]
}
```

---

## ✨ Features

- 💾 **Save snippets** — title, content, tags
- 🔍 **Real-time search** — filter by title or tag
- 🏷 **Tag filtering** — click any tag to filter cards
- ★  **Favorites** — star your most-used snippets
- ⧉  **Copy to clipboard** — one-click copy with toast
- 🗑  **Delete** — smooth animated removal
- 🌙  **Dark mode** — premium dark UI with glassmorphism cards
- 📱  **Responsive** — works on mobile & desktop
- 🎨  **Syntax highlighting** — via highlight.js (atom-one-dark)
