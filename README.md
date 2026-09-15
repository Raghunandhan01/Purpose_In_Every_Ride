# 🛵 Purpose In Every Ride

**Scooter** — A comprehensive earnings and expense tracker for gig-economy delivery and ride partners, built with a simple promise: *purpose in every ride.*

Track income across every platform you ride for, log expenses, plan for emergencies, and let AI turn your ride history into insights you can act on.

---

## 📌 About the Project

Gig workers on platforms like Swiggy, Zomato, Rapido, Uber, Blinkit, Zepto, Instamart, and BigBasket often juggle earnings and expenses across multiple apps with no single place to see the full picture. **Purpose In Every Ride** solves that by giving riders one dashboard to:

- Log daily work sessions (hours, orders, earnings, expenses) per platform
- See consolidated analytics and platform-wise performance
- Get AI-powered earnings predictions and insights
- Plan and manage an emergency fund with a savings simulator
- Generate and schedule weekly reports
- Use the app in multiple languages, with light/dark themes

---

## ✨ Key Features

- **Multi-Platform Tracking** — Log and monitor earnings/expenses across 8+ delivery and ride-hailing platforms out of the box
- **Dashboard & Analytics** — Visual breakdown of earnings, expenses, and trends using interactive charts
- **AI Predictor** — Gemini-powered predictions and personalized insights based on historical work logs
- **Emergency Fund Planner** — Fund cards, transaction tracking, and an AI advisor + simulator to plan savings goals
- **Reports** — Auto-generated and scheduled weekly performance reports
- **Platform Connections** — OAuth-based platform integrations, statement importer, and order tracker
- **Auth & Security** — JWT-based authentication with Google/Facebook OAuth, rate limiting, and Helmet-secured Express backend
- **Multi-language Support** — Built-in translation layer for a wider audience of riders
- **Responsive UI** — Clean, mobile-first dashboard built with Tailwind CSS and Framer Motion animations

---

## 🛠️ Tech Stack

**Frontend**
- React 19 + TypeScript
- React Router DOM
- Tailwind CSS 4
- Recharts (data visualization)
- Framer Motion / Motion (animations)
- React Hook Form, React Hot Toast

**Backend**
- Node.js + Express
- MongoDB with Mongoose
- JWT authentication + bcryptjs
- Google Gemini API (`@google/genai`) for AI predictions & translation
- Helmet, CORS, express-rate-limit for security
- Google & Facebook OAuth

**Tooling**
- Vite (build tool)
- esbuild (server bundling)
- TypeScript

---

## 📂 Project Structure

```
Purpose_In_Every_Ride/
├── server/                 # Express backend
│   ├── controllers/        # Route handlers (auth, analytics, predictions, reports, etc.)
│   ├── routes/              # API route definitions
│   ├── services/            # Business logic (reports, analytics, work logs, emergency fund)
│   ├── models/               # Mongoose schemas
│   ├── middleware/          # Auth middleware
│   ├── validators/           # Request validation
│   └── config/               # Database configuration
├── src/                    # React frontend
│   ├── pages/                # Route-level pages (Dashboard, Earnings, Analytics, etc.)
│   ├── components/           # Reusable UI, dashboard, charts, and app components
│   ├── layouts/               # Auth, Public, and Dashboard layouts
│   ├── context/                # Auth and Language/Theme context providers
│   └── lib/                    # API client and translation utilities
├── server.ts               # Express server entry point
└── vite.config.ts          # Vite configuration
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB (local instance or MongoDB Atlas)
- A Google Gemini API key (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/<your-username>/Purpose_In_Every_Ride.git
   cd Purpose_In_Every_Ride
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   APP_URL=http://localhost:3000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   PORT=3000
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   FACEBOOK_APP_ID=your_facebook_app_id
   FACEBOOK_CLIENT_SECRET=your_facebook_client_secret
   ```

4. **Run in development mode**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   npm start
   ```

6. **(Optional) Seed the database**
   ```bash
   npm run seed
   ```

---

## 🖥️ Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build the frontend and bundle the server for production |
| `npm start` | Run the production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Type-check the project |
| `npm run seed` | Seed the database with sample data |

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome. Feel free to check the [issues page](../../issues) or open a pull request.

---

## 📄 License

This project is licensed under the Apache-2.0 License.

---

## 👤 About Me

**Raghu Nandhan**

Bachelor of Engineering student in Computer and Communication Engineering at VSB Engineering College, Karur (expected graduation: 2027). I've completed internships at **Brainary Spot Technology** and **Infosys Springboard**, and hold certifications from **Salesforce**, **TCS iON**, **AWS**, and **Infosys**.

My core stack includes Java, C, HTML, CSS, JavaScript, MySQL, and Git, with growing hands-on experience in Python, Flask, React.js, TypeScript, and REST APIs. I build practical projects like this one to sharpen my full-stack skills alongside academic coursework and regular problem-solving practice.

- 💻 Actively building full-stack and AI-integrated projects
- 📚 Currently pursuing my engineering degree, graduating 2027
- 🌱 Open to internship and collaboration opportunities

---

<p align="center">Made with purpose, one ride at a time. 🛵</p>
