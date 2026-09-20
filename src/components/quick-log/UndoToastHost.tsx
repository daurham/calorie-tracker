import { useEffect, useRef } from 'react';
import { ToastAction } from '@/components/ui/toast';
import { toast } from '@/hooks/useToast';
import { undoMessage, type UndoAction } from '@/lib/quick-log';

interface UndoToastHostProps {
  action: UndoAction | null;
  onUndo: (action: UndoAction) => Promise<void>;
}

const UndoToastHost = ({ action, onUndo }: UndoToastHostProps) => {
  const lastActionRef = useRef<UndoAction | null>(null);

  useEffect(() => {
    if (!action || action === lastActionRef.current) return;
    lastActionRef.current = action;
    toast({
      title: `✓ ${undoMessage(action)} · ${action.calories} cal`,
      action: (
        <ToastAction
          altText="Undo"
          onClick={() => {
            void onUndo(action).catch(() => {
              toast({
                title: 'Could not undo',
                description: 'Please try again.',
                variant: 'destructive',
              });
            });
          }}
        >
          Undo
        </ToastAction>
      ),
    });
  }, [action, onUndo]);

  return null;
};

export default UndoToastHost;
