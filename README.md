# 🍓 Berrylicious Dashboard

A modern, professional kiosk management dashboard for Berrylicious - track sales, costs, inventory, and profits in real-time.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-Ready-green?logo=supabase)

## ✨ Features

- **📊 Dashboard Overview** - Real-time profit/loss tracking, revenue metrics, and visual charts
- **🛒 Sales Log** - Record and track daily sales with auto-calculated costs based on ingredient batches
- **📦 Products & Costs** - Manage products with auto-calculated or manual cost configurations
- **💰 Fixed Costs** - Track monthly fixed expenses with visual breakdowns
- **🥘 Ingredients & Inventory** - Manage ingredients, track batches, and monitor stock levels
- **🗑️ Waste Tracking** - Log spoiled or wasted ingredients for accurate inventory
- **💳 Transaction Classifier** - Automatically classify POS transactions into products

## 🎨 Design Features

- **Dark/Light Mode** - Automatic theme switching with system preference support
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Toast Notifications** - Real-time feedback for all actions
- **Confirmation Dialogs** - Safety prompts for destructive actions
- **CSV Export** - Export sales and waste data for reporting
- **Loading Skeletons** - Smooth loading states throughout the app

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/berrylicious-dashboard.git
cd berrylicious-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment example file:
```bash
cp env.example .env.local
```

4. (Optional) Configure Supabase for cloud sync:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🗄️ Database Setup (Optional)

For cloud data persistence, set up Supabase:

1. Create a new Supabase project
2. Run the schema in `supabase/schema.sql` in the SQL editor
3. Add your Supabase credentials to `.env.local`

Without Supabase, data is stored locally in your browser's localStorage.

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── globals.css        # Global styles & theme variables
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx           # Main dashboard page
├── components/
│   ├── dashboard/         # Dashboard-specific components
│   ├── layout/            # Layout components (sidebar, theme toggle)
│   ├── providers/         # Context providers
│   ├── ui/                # Reusable UI components
│   └── views/             # Feature view components
├── hooks/
│   └── use-app-state.ts   # Main application state hook
├── lib/
│   ├── database.ts        # Supabase database operations
│   ├── supabase.ts        # Supabase client
│   └── utils.ts           # Utility functions
└── types/
    ├── database.ts        # Database types
    └── index.ts           # Application types
```

## 🛠️ Built With

- [Next.js 16](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS 4](https://tailwindcss.com/) - Styling
- [Radix UI](https://www.radix-ui.com/) - Accessible components
- [Recharts](https://recharts.org/) - Charts and visualizations
- [Supabase](https://supabase.com/) - Backend & database
- [Sonner](https://sonner.emilkowal.ski/) - Toast notifications
- [Lucide Icons](https://lucide.dev/) - Icons

## 📱 PWA Support

This app supports Progressive Web App features:
- Install on mobile/desktop
- Offline data access (localStorage)
- Theme-aware splash screen

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is private and proprietary to Berrylicious.

---

Made with ❤️ for Berrylicious Kiosk
