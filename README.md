# Sage Wealth 🪙 — Smart Expense Tracker & Alternative Investment Hub

Sage Wealth is a premium, high-fidelity financial dashboard built to help users seamlessly log daily expenses, monitor monthly budgets, view deep visual analytics, and simulate investments in high-yield assets, ranging from standard SIPs and ETFs to alternative aviation co-ownership models.

![Sage Wealth Dashboard Mockup](./dashboard_mockup.png)

---

## 🚀 Key Features

### 1. Advanced Expense Management
* **Dynamic Expense Logging**: Add, edit, and delete expenses with customizable categories (Food, Rent, Shopping, Entertainment, Utilities, and Travel).
* **Smart Budget Thresholds**: Set a monthly budget and receive warning banners and modal alerts when spending exceeds critical thresholds (e.g. 80% or 100% of the budget).
* **Granular Filtering**: Filter transactions instantly by category or narrow down histories by date ranges.

### 2. Deep Visual Analytics
* **Category Distribution Charts**: High-performance interactive doughnut charts detailing category-wise spending using Chart.js.
* **Daily Averages & Progress**: Display metrics on daily averages, total spent, remaining budgets, and overall financial health percentages.

### 3. Investment Hub & Simulation Engine
* **Savings Analyzer**: Evaluates monthly budget vs active spent to calculate real-time savings potential.
* **Financial Health Index**: Proprietary calculation rating users' cash-flow health.
* **SIP Recommendations & Planner**: Calculates compound growth outputs across low (8%), medium (12%), and high-risk (15%) mutual funds.
* **Goal-Based Growth Simulator**: Dynamic SVG-rendered interest compound curves responding in real-time to sliders (invested capital vs interest yield vs duration).
* **Aero Elite Aviation Assets**: Co-own fractional shares in luxury charter aircraft, eVTOL urban flight syndicates, and airport lounge infrastructure. Includes an interactive yield simulator (potential yields, flight hours co-ownership allocation, and CO₂ offset metrics) with a direct link to the [Aero Platform](https://aero-landingpage.netlify.app/).
* **ETF Discovery**: Look up, analyze, and filter popular indices (like Nifty 50, Gold, IT, and Nasdaq 100) using miniature sparkline trends.
* **Interactive Learn Cards**: Swipeable cards explaining compound interest, SIPs, emergency funds, and investment risk profiles.

---

## 🛠️ Technology Stack

### Frontend (`/frontend`)
* **Core**: React 19 + TypeScript + Vite
* **Styling**: Tailwind CSS 4 + Modern glassmorphic vanilla CSS design system
* **Visuals**: Chart.js + React-Chartjs-2 + custom SVGs
* **Icons**: Lucide React
* **Unit Testing**: Jest + React Testing Library

### Backend (`/backend`)
* **Core**: Node.js + Express
* **Database**: Supabase client connection for secure user transactions
* **Testing**: Babel + Jest setup

---

## ⚙️ Installation & Setup

### Prerequisites
* [Node.js](https://nodejs.org/) (v18+ recommended)
* npm (v9+)

---

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables. Create a `.env` file (refer to `.env.example`):
   ```env
   PORT=3001
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_anon_key
   ```
4. Start the backend server:
   ```bash
   npm start
   ```
   The backend will run on `http://localhost:3001`.

---

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:5173`.

---

## 🧪 Running Tests

### Frontend Tests
Run the frontend Jest test suite to check UI components, modals, API clients, and calculations:
```bash
cd frontend
npm test
```

### Backend Tests
Run the backend test suite:
```bash
cd backend
npm test
```

---

## 📬 Deployment

* **Netlify**: Frontend configuration files (`netlify.toml` and redirection rules) are pre-configured in the repository for serverless routing and CDN deployments.
