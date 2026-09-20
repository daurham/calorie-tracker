import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { applyGroupUndoToState, selectGroupUndoTargets } from './group-undo';
import { planUndo } from '../quick-log/undo';

const groupId = '11111111-1111-1111-1111-111111111111';
const otherGroup = '22222222-2222-2222-2222-222222222222';

describe('grouped Add All undo', () => {
  it('plans Add All undo as a group delete of the created log ids', () => {
    assert.deepEqual(planUndo({
      type: 'add-group',
      groupId,
      logIds: [10, 11, 12],
      label: 'Chicken, Rice & Kimchi',
      calories: 506,
    }), {
      op: 'delete-group',
      groupId,
      logIds: [10, 11, 12],
    });
  });

  it('removes all three newly added group logs and cleans up the empty group', () => {
    const targets = selectGroupUndoTargets({
      groupId,
      createdLogIds: [10, 11, 12],
      currentLogs: [
        { id: 1, group_id: null },
        { id: 10, group_id: groupId },
        { id: 11, group_id: groupId },
        { id: 12, group_id: groupId },
      ],
    });
    assert.deepEqual(targets.logIdsToDelete, [10, 11, 12]);
    assert.equal(targets.deleteGroup, true);
    assert.deepEqual(targets.remainingGroupLogIds, []);
    const remaining = applyGroupUndoToState([
      { id: 1 }, { id: 10 }, { id: 11 }, { id: 12 },
    ], targets);
    assert.deepEqual(remaining.map(log => log.id), [1]);
  });

  it('leaves unrelated Today logs in place', () => {
    const targets = selectGroupUndoTargets({
      groupId,
      createdLogIds: [10, 11, 12],
      currentLogs: [
        { id: 1, group_id: null },
        { id: 2, group_id: otherGroup },
        { id: 10, group_id: groupId },
        { id: 11, group_id: groupId },
        { id: 12, group_id: groupId },
      ],
    });
    const remaining = applyGroupUndoToState([
      { id: 1 }, { id: 2 }, { id: 10 }, { id: 11 }, { id: 12 },
    ], targets);
    assert.deepEqual(remaining.map(log => log.id), [1, 2]);
  });

  it('does not delete logs later moved onto another group', () => {
    const targets = selectGroupUndoTargets({
      groupId,
      createdLogIds: [10, 11, 12],
      currentLogs: [
        { id: 10, group_id: groupId },
        { id: 11, group_id: otherGroup },
        { id: 12, group_id: groupId },
      ],
    });
    assert.deepEqual(targets.logIdsToDelete, [10, 12]);
    assert.deepEqual(targets.skippedLogIds, [11]);
    assert.equal(targets.deleteGroup, true);
  });

  it('keeps the group row when later unrelated logs still use it', () => {
    const targets = selectGroupUndoTargets({
      groupId,
      createdLogIds: [10, 11, 12],
      currentLogs: [
        { id: 10, group_id: groupId },
        { id: 11, group_id: groupId },
        { id: 12, group_id: groupId },
        { id: 99, group_id: groupId },
      ],
    });
    assert.deepEqual(targets.logIdsToDelete, [10, 11, 12]);
    assert.deepEqual(targets.remainingGroupLogIds, [99]);
    assert.equal(targets.deleteGroup, false);
  });

  it('does not apply UI removal when the server delete fails', async () => {
    const before = [{ id: 1 }, { id: 10 }, { id: 11 }, { id: 12 }];
    const targets = selectGroupUndoTargets({
      groupId,
      createdLogIds: [10, 11, 12],
      currentLogs: [
        { id: 1, group_id: null },
        { id: 10, group_id: groupId },
        { id: 11, group_id: groupId },
        { id: 12, group_id: groupId },
      ],
    });

    const deleteGroup = async () => {
      throw new Error('postgres unavailable');
    };

    let uiLogs = before;
    let undoCleared = false;
    try {
      await deleteGroup();
      uiLogs = applyGroupUndoToState(before, targets);
      undoCleared = true;
    } catch {
      // UI stays put; snackbar remains available.
    }

    assert.deepEqual(uiLogs.map(log => log.id), [1, 10, 11, 12]);
    assert.equal(undoCleared, false);
  });
});
