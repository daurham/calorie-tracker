export interface GroupUndoLog {
  id: number;
  group_id: string | null;
}

export interface GroupUndoSelection {
  groupId: string;
  createdLogIds: number[];
  currentLogs: GroupUndoLog[];
}

export interface GroupUndoTargets {
  logIdsToDelete: number[];
  skippedLogIds: number[];
  remainingGroupLogIds: number[];
  deleteGroup: boolean;
}

export const selectGroupUndoTargets = ({
  groupId,
  createdLogIds,
  currentLogs,
}: GroupUndoSelection): GroupUndoTargets => {
  const created = new Set(createdLogIds);
  const logIdsToDelete = currentLogs
    .filter(log => created.has(log.id) && log.group_id === groupId)
    .map(log => log.id);
  const skippedLogIds = createdLogIds.filter(id => !logIdsToDelete.includes(id));
  const remainingGroupLogIds = currentLogs
    .filter(log => log.group_id === groupId && !logIdsToDelete.includes(log.id))
    .map(log => log.id);

  return {
    logIdsToDelete,
    skippedLogIds,
    remainingGroupLogIds,
    deleteGroup: remainingGroupLogIds.length === 0,
  };
};

export const applyGroupUndoToState = <T extends { id: number }>(
  logs: T[],
  targets: GroupUndoTargets
): T[] => logs.filter(log => !targets.logIdsToDelete.includes(log.id));
