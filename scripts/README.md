# Scripts

This directory contains utility scripts for the calorie tracker application.

## Available Scripts

### `init-db.ts`
Initializes the database with the required tables and schema.

**Usage:**
```bash
npm run init-db
```

### `backup-db.ts`
Creates a backup of the database data in JSON format. The backup includes all ingredients and meal combos with their relationships.

**Usage:**
```bash
npm run backup-db
```

**Output:** Creates a timestamped backup file in the `data-backup/` directory.

### `generate-meal-plan-prompt.ts`
Fetches all ingredients and meals from the database, condenses the information, and generates an AI prompt for meal planning.

**Usage:**
```bash
npm run generate-meal-prompt
```

**Output:** Creates a timestamped text file in the `output/` directory containing:
- List of all available ingredients with their macros
- List of existing meals with their ingredients and macros
- A formatted prompt ready to use with AI tools for meal planning

**What the prompt includes:**
- Available ingredients with calories, protein, carbs, and fat per unit
- Existing meals with their ingredient lists and macros
- Instructions for the AI to help create meal plans
- Suggestions for new meal combinations and modifications

**Example use case:**
1. Run the script to generate the prompt
2. Copy the generated prompt from the output file
3. Paste it into an AI tool (like ChatGPT, Claude, etc.)
4. Add your specific macro goals to the prompt
5. Get personalized meal plan suggestions

## Modular Architecture

The meal plan generation functionality is now modularized for reuse across the application:

### Core Module: `src/lib/meal-planning/prompt-generator.ts`
- **`MealPlanPromptGenerator`** class with static methods
- **`fetchMealPlanData()`** - Fetches and condenses database data
- **`generatePrompt()`** - Creates AI prompts from data
- **`generateCompletePrompt()`** - Complete workflow with optional user goals

### API Endpoint: `api/generate-meal-plan.js`
- POST endpoint for frontend integration
- Accepts optional `userGoals` parameter
- Returns prompt and summary data

### Frontend Integration: `src/hooks/useMealPlanGenerator.ts`
- React hook for frontend components
- Handles API communication and state management
- Provides loading states and error handling

### UI Component: `src/components/MealPlanGenerator.tsx`
- Complete React component with user interface
- Allows users to input goals and generate prompts
- Provides copy/download functionality

## Running Scripts

All scripts can be run using npm:

```bash
# Initialize database
npm run init-db

# Backup database
npm run backup-db

# Generate meal plan prompt
npm run generate-meal-prompt
```

## Requirements

- Node.js and npm installed
- Database connection configured (POSTGRES_URL environment variable)
- TypeScript support (tsx is used to run the scripts) 