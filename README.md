# ✈️ TravelPlanner — CSC456 Project 3

A full-stack travel planning web application built with **Node.js, Express, MongoDB, Mongoose, and EJS**, following the **MVC architecture**.

---

## 🗂 Domain: Travel Planning

### Entities & Relationships
| Entity | Description |
|--------|-------------|
| **User** | Authenticated users (admin / user roles) |
| **Country** | Top-level geography |
| **City** | Belongs to a Country — has timezone, language, currency |
| **Trip** | Created by a User — has embedded Activity sub-documents |

### Relationships
- **One-to-Many**: Country → Cities (one country has many cities)
- **One-to-Many**: User → Trips (one user has many trips)
- **Many-to-Many**: Trips ↔ Cities (a trip visits many cities; a city appears in many trips)
- **Many-to-Many**: Users ↔ Cities via `bucketList` / `visitors` (users save cities to their bucket list)
- **Embedded**: Trip → Activities (sub-documents, one-to-many embedded)

---

## ⚙️ Tech Stack
- **Backend**: Node.js + Express
- **Database**: MongoDB Atlas + Mongoose
- **Views**: EJS templates (server-side rendering)
- **Auth**: JWT (cookies) + bcrypt password hashing
- **Architecture**: MVC

---

## 🚀 Local Setup

```bash
# 1. Clone the repo
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>

# 2. Install dependencies
npm install

# 3. Create your .env file
cp .env.example .env
# Fill in MONGO_URI and JWT_SECRET

# 4. Run in development
npm run dev

# 5. Open http://localhost:3000
```

---

## 🔐 Authentication & Roles

| Action | admin | user |
|--------|-------|------|
| Register / Login | ✅ | ✅ |
| View trips / cities / countries | ✅ | ✅ |
| Create & manage own trips | ✅ | ✅ |
| Add city to bucket list | ✅ | ✅ |
| Create / edit / delete Cities & Countries | ✅ | ❌ |
| Manage all users | ✅ | ❌ |

> **First registered user automatically becomes admin.**

---

## ☁️ Deployment

### MongoDB Atlas
1. Create a free cluster at https://mongodb.com/atlas
2. Create a database user and whitelist `0.0.0.0/0`
3. Copy the connection string into your `.env` as `MONGO_URI`

### Render
1. Push your code to GitHub
2. Go to https://render.com → New Web Service → connect your repo
3. Set environment variables: `MONGO_URI`, `JWT_SECRET`, `NODE_ENV=production`
4. Set build command: `npm install`
5. Set start command: `node server.js`
6. Copy the **Deploy Hook URL** from Render settings

### CI/CD Pipeline (GitHub Actions)
1. In your GitHub repo → Settings → Secrets → Actions
2. Add secret: `RENDER_DEPLOY_HOOK_URL` = the URL from Render
3. Every `git push` to `main` will automatically redeploy the app

**CI/CD Flow:**
```
VS Code → git commit → git push → GitHub → GitHub Actions → Render redeploy
```

---

## 📁 Project Structure

```
project3/
├── server.js                  # App entry point
├── .env.example               # Environment variable template
├── .github/
│   └── workflows/
│       └── deploy.yml         # GitHub Actions CI/CD
├── models/
│   ├── User.js                # User schema (auth + roles)
│   ├── City.js                # City schema (many-to-many trips & users)
│   ├── Country.js             # Country schema
│   └── Trip.js                # Trip schema (embedded activities)
├── controllers/
│   ├── authController.js
│   ├── dashboardController.js
│   ├── tripController.js
│   ├── cityController.js
│   └── countryController.js
├── routes/
│   ├── authRoutes.js
│   ├── dashboardRoutes.js
│   ├── tripRoutes.js
│   ├── cityRoutes.js
│   └── countryRoutes.js
├── middleware/
│   └── authMiddleware.js      # JWT verify, requireAuth, requireAdmin
├── views/
│   ├── partials/              # head, sidebar, foot
│   ├── auth/                  # login, register
│   ├── dashboard/             # index, users
│   ├── trips/                 # index, new, show, edit
│   ├── cities/                # index, new, show, edit
│   ├── countries/             # index, new, show, edit
│   ├── 404.ejs
│   └── 403.ejs
└── public/
    └── css/style.css
```
