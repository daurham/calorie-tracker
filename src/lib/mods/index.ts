import { ModManager } from './modManager';
import { costcoPizzaMod } from './costcoPizzaMod';

// Initialize mod manager
const modManager = ModManager.getInstance();

// Register all available mods
export function initializeMods(): void {
  // Register Costco Pizza mod
  modManager.registerMod(costcoPizzaMod);
  
  // Future mods can be registered here
  // modManager.registerMod(someOtherMod);
}

// Export the mod manager instance
export { modManager };

// Export individual mods for direct access if needed
export { costcoPizzaMod }; 