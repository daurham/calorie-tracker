# 🍏 Caloric Tracker

A modern, intuitive calorie and macro tracking application built with Vite and TypeScript. Track your daily nutrition goals with ease and precision.

## ✨ Features

- **Smart Meal Tracking**
  - Log individual meals and track daily calorie intake
  - Monitor macronutrients (protein, carbs, fat)
  - Create and save custom meal combinations
  - Beautiful progress visualization

- **Ingredient Management**
  - Add custom ingredients with nutritional information
  - Create a personal ingredient database
  - Automatic macro calculations
  - Easy ingredient search and selection

- **Meal Combinations**
  - Create and save meal combinations
  - Reuse favorite meal combinations
  - Automatic nutritional calculations
  - Flexible ingredient quantities

- **User Experience**
  - Clean, modern UI with dark mode support
  - Responsive design for all devices
  - Intuitive navigation
  - Real-time progress tracking

## 🛠️ Tech Stack

- **Frontend**
  - Vite
  - TypeScript
  - Tailwind CSS
  - Shadcn UI Components
  - Lucide Icons

- **Backend**
  - Vercel Postgres
  - PostgreSQL for data management
  - RESTful API endpoints

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/calorie-tracker.git
   cd calorie-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```env
   DATABASE_URL=your_database_url
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000) in your browser**

## 📁 Project Structure

```
calorie-tracker/
├── api/                # API endpoints
├── src/
│   ├── components/     # React components
│   ├── lib/           # Utility functions and data handling
│   ├── pages/         # Next.js pages
│   └── styles/        # Global styles
├── public/            # Static assets
└── package.json       # Project dependencies
```

## 🔧 Configuration

The application uses several configuration files:

- `settings.config.ts` - Default nutritional goals
- `tailwind.config.js` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Vercel](https://vercel.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lovable](https://lovable.com/)
