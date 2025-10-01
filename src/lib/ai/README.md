# AI Features for Calorie Tracker

This directory contains AI-powered features for the calorie tracker application.

## 🔐 Authentication

AI features require authentication with passcode: `1212`

## 🤖 Features

### AI Food Analyzer
- Describe what you ate in natural language
- AI analyzes the description and estimates nutritional information
- Edit the AI's suggestions before adding to your meals
- Adjust portion sizes

## 🔧 Setup

### Development (Mock Data)
The app will use mock data when no API key is configured.

### Production (Google Gemini - FREE!)
1. Get a free Google Gemini API key from https://makersuite.google.com/app/apikey
2. Create a `.env` file in your project root:
   ```bash
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

### Free Tier Limits
- **Google Gemini**: 15 requests/minute, 1M tokens/day (FREE!)
- **No credit card required**
- **No expiration date**

## 📁 Files

- `auth.ts` - Authentication system for AI features
- `config.ts` - Configuration for AI services
- `foodRecognition.ts` - Food analysis service
- `AIFoodRecognitionModal.tsx` - UI for AI food recognition
- `AIAuthGuard.tsx` - Authentication guard component

## 🚀 Usage

1. User enters passcode `1212` to unlock AI features
2. User describes their meal: "Grilled chicken breast with rice and vegetables"
3. AI analyzes and returns estimated macros
4. User can edit the suggestions
5. User adjusts portion size
6. Meal is added to today's meals

## 🔒 Security

- Passcode authentication prevents unauthorized API usage
- API calls are rate-limited
- Mock data available for development
