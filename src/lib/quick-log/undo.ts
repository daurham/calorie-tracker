import type { FoodLogInput } from '../../types/food-log';

export type UndoAction =
  | { type: 'add'; logId: number; label: string; calories: number }
  | { type: 'add-group'; groupId: string; logIds: number[]; label: string; calories: number }
  | { type: 'delete'; snapshot: FoodLogInput; label: string; calories: number }
  | { type: 'duplicate'; logId: number; label: string; calories: number };

export type UndoPlan =
  | { op: 'delete'; logId: number }
  | { op: 'delete-group'; groupId: string; logIds: number[] }
  | { op: 'create'; snapshot: FoodLogInput };

export const planUndo = (action: UndoAction): UndoPlan => {
  if (action.type === 'delete') {
    return { op: 'create', snapshot: action.snapshot };
  }
  if (action.type === 'add-group') {
    return { op: 'delete-group', groupId: action.groupId, logIds: action.logIds };
  }
  return { op: 'delete', logId: action.logId };
};

export const undoMessage = (action: UndoAction) => {
  if (action.type === 'add') return `${action.label} added`;
  if (action.type === 'delete') return `${action.label} deleted`;
  return `${action.label} duplicated`;
};
