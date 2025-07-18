import { ModConfig, ModData, ModHandler } from '@/types/mods';

// Storage key for mod settings
const MODS_STORAGE_KEY = 'nutritrack_mods_config';

export class ModManager {
  private static instance: ModManager;
  private mods: Map<string, ModHandler> = new Map();
  private configs: Map<string, ModConfig> = new Map();

  private constructor() {
    this.loadModConfigs();
  }

  static getInstance(): ModManager {
    if (!ModManager.instance) {
      ModManager.instance = new ModManager();
    }
    return ModManager.instance;
  }

  // Load mod configurations from localStorage
  private loadModConfigs(): void {
    try {
      const stored = localStorage.getItem(MODS_STORAGE_KEY);
      if (stored) {
        const configs = JSON.parse(stored);
        Object.entries(configs).forEach(([id, config]) => {
          this.configs.set(id, config as ModConfig);
        });
      }
    } catch (error) {
      console.error('Error loading mod configs:', error);
    }
  }

  // Save mod configurations to localStorage
  private saveModConfigs(): void {
    try {
      const configs = Object.fromEntries(this.configs);
      localStorage.setItem(MODS_STORAGE_KEY, JSON.stringify(configs));
    } catch (error) {
      console.error('Error saving mod configs:', error);
    }
  }

  // Register a new mod
  registerMod(mod: ModHandler): void {
    this.mods.set(mod.id, mod);
    
    // Initialize config if it doesn't exist
    if (!this.configs.has(mod.id)) {
      const config: ModConfig = {
        id: mod.id,
        name: mod.name,
        description: mod.description,
        enabled: true, // Default to enabled
        version: '1.0.0',
        author: 'System'
      };
      this.configs.set(mod.id, config);
      this.saveModConfigs();
    }
  }

  // Get all registered mods
  getMods(): ModHandler[] {
    return Array.from(this.mods.values());
  }

  // Get enabled mods
  getEnabledMods(): ModHandler[] {
    return this.getMods().filter(mod => this.isModEnabled(mod.id));
  }

  // Get mod by ID
  getMod(id: string): ModHandler | undefined {
    return this.mods.get(id);
  }

  // Get mod config by ID
  getModConfig(id: string): ModConfig | undefined {
    return this.configs.get(id);
  }

  // Check if mod is enabled
  isModEnabled(id: string): boolean {
    const config = this.configs.get(id);
    return config?.enabled ?? false;
  }

  // Enable/disable a mod
  setModEnabled(id: string, enabled: boolean): void {
    const config = this.configs.get(id);
    if (config) {
      config.enabled = enabled;
      this.saveModConfigs();
    }
  }

  // Get all mod configs
  getAllModConfigs(): ModConfig[] {
    return Array.from(this.configs.values());
  }

  // Update mod config
  updateModConfig(id: string, updates: Partial<ModConfig>): void {
    const config = this.configs.get(id);
    if (config) {
      Object.assign(config, updates);
      this.saveModConfigs();
    }
  }

  // Get mod data for a specific mod
  getModData(modId: string): ModData | null {
    const config = this.configs.get(modId);
    const mod = this.mods.get(modId);
    
    if (!config || !mod) return null;

    return {
      config,
      data: mod
    };
  }
} 