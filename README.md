# Stella Tracker 🌟

Stella Tracker is a modern, interactive web application built with **React**, **Vite**, **Tailwind CSS**, and **Firebase**. It helps users track daily learning challenges, record progress topics, log updates, view activity statistics, and interact with community dashboards.

---

## ✨ Features

- **Challenge Tracker**: Define custom learning challenges with start and end dates.
- **Interactive Calendar**: View daily progress, topics covered, and updates in an intuitive calendar format.
- **Streak & Analytics**: Track active streaks, completion rates, and total learning days.
- **Firebase Integration**: User authentication, Firestore data persistence, and Firebase Storage support.
- **Responsive UI**: Tailored for both desktop and mobile screens with dark/light themes and sleek Tailwind styling.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Icons**: Lucide React
- **Backend & Auth**: Firebase Auth, Cloud Firestore, Firebase Storage
- **Utilities**: canvas-confetti, PostCSS, Autoprefixer

---

## 🚀 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) (v16 or higher) and `npm` installed on your machine.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/stella-tracker.git
   cd stella-tracker
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory (or copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```
   Fill in your Firebase credentials in `.env`:
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_firebase_app_id
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:5173`.

---

## 📦 Scripts

- `npm run dev` - Launches the Vite local development server.
- `npm run build` - Bundles production assets into the `dist/` directory.
- `npm run preview` - Previews the production build locally.
- `npm run lint` - Runs ESLint to check for code quality issues.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
