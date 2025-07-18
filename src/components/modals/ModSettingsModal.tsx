import { useState, useEffect } from 'react';
import { Settings, ToggleLeft, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui';
import { Button } from '@/components/ui';
import { Switch } from '@/components/ui';
import { Label } from '@/components/ui';
import { modManager } from '@/lib/mods';
import { ModConfig } from '@/types/mods';

interface ModSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ModSettingsModal = ({ open, onOpenChange }: ModSettingsModalProps) => {
  const [modConfigs, setModConfigs] = useState<ModConfig[]>([]);

  useEffect(() => {
    if (open) {
      setModConfigs(modManager.getAllModConfigs());
    }
  }, [open]);

  const handleToggleMod = (modId: string, enabled: boolean) => {
    modManager.setModEnabled(modId, enabled);
    setModConfigs(modManager.getAllModConfigs());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Mod Settings
          </DialogTitle>
          <DialogDescription>
            Enable or disable modular features. These mods add special meal calculation capabilities.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {modConfigs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No mods available</p>
            </div>
          ) : (
            modConfigs.map((config) => (
              <div key={config.id} className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium">{config.name}</h4>
                    <p className="text-sm text-muted-foreground">{config.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Version: {config.version}</span>
                      {config.author && <span>By: {config.author}</span>}
                    </div>
                  </div>
                  <Switch
                    checked={config.enabled}
                    onCheckedChange={(enabled) => handleToggleMod(config.id, enabled)}
                  />
                </div>
              </div>
            ))
          )}

          <div className="pt-4 border-t">
            <div className="flex justify-end">
              <Button onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModSettingsModal; 