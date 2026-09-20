import { useRef, useState } from 'react';
import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Input, Label } from '@/components/ui';
import { estimateFoodRequest } from '@/lib/food-estimate/api-client';
import { MAX_FOOD_PHOTO_DIMENSION, resizeImageFile } from '@/lib/packaged-foods/image';
import type { EstimateDraft } from '@/types/food-interpretation';

interface PhotoEstimateFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDraft: (draft: EstimateDraft) => void;
  onError: (message: string, code?: string) => void;
}

const PhotoEstimateFlow = ({ open, onOpenChange, onDraft, onError }: PhotoEstimateFlowProps) => {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [description, setDescription] = useState('');
  const [isWorking, setIsWorking] = useState(false);

  const handleFile = async (file: File) => {
    setIsWorking(true);
    try {
      const image = await resizeImageFile(file, { maxDimension: MAX_FOOD_PHOTO_DIMENSION });
      const outcome = await estimateFoodRequest({ image, text: description.trim() || undefined });
      if (outcome.status === 'error') {
        onError(outcome.message, outcome.code);
        return;
      }
      onDraft(outcome.draft);
      onOpenChange(false);
      setDescription('');
    } catch (error) {
      onError(error instanceof Error ? error.message : "Couldn't estimate this food.");
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Estimate from photo</DialogTitle>
          <DialogDescription>The photo is used only to identify the food, then discarded.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
              event.target.value = '';
            }}
          />
          <div className="space-y-2">
            <Label htmlFor="photo-context">Optional description</Label>
            <Input
              id="photo-context"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="homemade chicken enchiladas, two of them"
            />
          </div>
          <Button type="button" className="w-full bg-emerald-500 hover:bg-emerald-600" disabled={isWorking} onClick={() => fileRef.current?.click()}>
            {isWorking ? 'Estimating…' : 'Take or choose photo'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PhotoEstimateFlow;
