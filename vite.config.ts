import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { calorieTrackerApiDevPlugin } from "./src/server/dev-api-plugin";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    calorieTrackerApiDevPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));