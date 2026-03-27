# ⛳ ParScore — Golf Charity Subscription Platform

A full-stack web application that combines **golf scoring, subscriptions, and charity contributions** into a single platform with a **monthly prize draw system**.

---


## ⚠️ Important Note About Repository

Due to **GitHub push/pull issues (origin not working and sync conflicts)** in the initial repository, the final working version of the project has been pushed to a new repository.

👉 **Final Source Code (Active Repo):**
https://github.com/piyushkushe19/golf-charity-platform-2

👉 **Old Repo (Partial / Deprecated):**
https://github.com/piyushkushe19/golf-charity-platform

---

## 🚀 Live Demo

🌐 Live Website: https://golf-charity-platform-2.vercel.app/

👤 User Dashboard: https://golf-charity-platform-2.vercel.app/dashboard

🛠️ Admin Panel: https://golf-charity-platform-2.vercel.app/admin

---

## 📌 Project Overview

ParScore is a subscription-based platform where users:

* Subscribe (monthly/yearly)
* Enter golf scores
* Allocate a portion to charity
* Participate in automated monthly prize draws

Admins can manage users, charities, and draw operations.

---

## ✨ Features

### 👤 User Features

* Authentication (Signup/Login)
* Subscription system (Stripe)
* Add & manage golf scores
* Rolling last 5 scores logic
* Charity contribution selection
* View draw results & winnings

### 🛠️ Admin Features

* Admin dashboard
* Manage users & roles
* Create and run draw periods
* Simulate & publish results
* Manage charities
* Approve/reject winners

---

## 🧠 Core Logic

* Only **last 5 scores** are considered
* Score range: **1–45**
* Minimum **10% charity contribution**
* Prize split:

  * 🥇 40%
  * 🥈 35%
  * 🥉 25%
* Jackpot rollover supported
* Subscription required for dashboard access

---

## 🏗️ Tech Stack

**Frontend:**

* React.js (Vite)
* Tailwind CSS
* React Router

**Backend:**

* Supabase (PostgreSQL, Auth, Storage)
* Supabase Edge Functions

**Payments:**

* Stripe (Subscriptions + Webhooks)

**Deployment:**

* Vercel

---

## ⚙️ Setup Instructions

### 1. Clone Repo

```bash
git clone https://github.com/piyushkushe19/golf-charity-platform-2
cd golf-charity-platform-2/frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Add Environment Variables

Create `.env` file:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_STRIPE_PUBLISHABLE_KEY=
VITE_STRIPE_PRICE_MONTHLY=
VITE_STRIPE_PRICE_YEARLY=
```

### 4. Run Project

```bash
npm run dev
```

---

## 🧪 Test Flow

1. Sign up a new user
2. Subscribe using test card: `4242 4242 4242 4242`
3. Access dashboard
4. Add scores
5. Admin runs and publishes draw

---

## 🚧 Challenges Faced

* GitHub push/pull origin issues (resolved by migrating repo)
* Dependency & environment setup (npm/Vite issues)
* Stripe integration & webhook setup
* Supabase profile sync & RLS configuration
* Deployment debugging on Vercel

---

## 📈 Future Improvements

* Email notifications
* Better UI/UX animations
* Advanced analytics dashboard
* Mobile optimization

---


---

## ⭐ Summary

This project demonstrates:

* Full-stack development
* Authentication & role-based access
* Payment integration
* Real-world business logic
* Deployment & debugging skills

---
