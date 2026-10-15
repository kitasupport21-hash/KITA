/**
 * KITA - Automatic 6-Hour Real Job Synchronization Scheduler
 */
import { getDatabase, saveDatabase } from '../db/database.js';
import { syncOfficialVacancies, checkLiveSourceConnectivity } from './importer.js';

export interface SchedulerStatus {
  isSchedulerActive: boolean;
  intervalHours: number;
  intervalMs: number;
  lastSyncStartedAt: string | null;
  lastSyncCompletedAt: string | null;
  nextScheduledSyncAt: string | null;
  lastSyncResult: {
    success: boolean;
    totalInspected: number;
    newImported: number;
    duplicatesSkipped: number;
    expiredMarked: number;
    syncLogId: string;
    liveConnectivity?: {
      karirhub: { status: number; reachable: boolean; latencyMs: number; notes: string };
      paskerid: { status: number; reachable: boolean; latencyMs: number; notes: string };
    };
    error?: string;
  } | null;
  consecutiveFailures: number;
}

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
let timerInstance: NodeJS.Timeout | null = null;
let isSyncInProgress = false;

const schedulerState: SchedulerStatus = {
  isSchedulerActive: false,
  intervalHours: 6,
  intervalMs: SIX_HOURS_MS,
  lastSyncStartedAt: null,
  lastSyncCompletedAt: null,
  nextScheduledSyncAt: null,
  lastSyncResult: null,
  consecutiveFailures: 0
};

export async function executeSyncCycle(isManual: boolean = false): Promise<NonNullable<SchedulerStatus['lastSyncResult']>> {
  if (isSyncInProgress) {
    return {
      success: false,
      totalInspected: 0,
      newImported: 0,
      duplicatesSkipped: 0,
      expiredMarked: 0,
      syncLogId: 'already_running',
      error: 'Proses sinkronisasi lain sedang berjalan.'
    };
  }

  isSyncInProgress = true;
  const startedAt = new Date().toISOString();
  schedulerState.lastSyncStartedAt = startedAt;

  try {
    const db = await getDatabase();
    const liveConnectivity = await checkLiveSourceConnectivity().catch((err) => ({
      karirhub: { status: 0, reachable: false, latencyMs: 0, notes: err.message },
      paskerid: { status: 0, reachable: false, latencyMs: 0, notes: err.message }
    }));

    const result = await syncOfficialVacancies(db);
    saveDatabase(db);

    const completedAt = new Date().toISOString();
    schedulerState.lastSyncCompletedAt = completedAt;
    schedulerState.nextScheduledSyncAt = new Date(Date.now() + SIX_HOURS_MS).toISOString();
    schedulerState.consecutiveFailures = 0;
    schedulerState.lastSyncResult = {
      success: true,
      totalInspected: result.totalInspected,
      newImported: result.newImported,
      duplicatesSkipped: result.duplicatesSkipped,
      expiredMarked: result.expiredMarked,
      syncLogId: result.syncLogId,
      liveConnectivity
    };

    return schedulerState.lastSyncResult;
  } catch (error: any) {
    schedulerState.consecutiveFailures++;
    schedulerState.lastSyncResult = {
      success: false,
      totalInspected: 0,
      newImported: 0,
      duplicatesSkipped: 0,
      expiredMarked: 0,
      syncLogId: 'failed',
      error: error.message || 'Kesalahan sinkronisasi.'
    };
    return schedulerState.lastSyncResult;
  } finally {
    isSyncInProgress = false;
  }
}

export function initScheduler(): void {
  if (timerInstance) {
    clearInterval(timerInstance);
  }

  schedulerState.isSchedulerActive = true;
  schedulerState.nextScheduledSyncAt = new Date(Date.now() + SIX_HOURS_MS).toISOString();

  setTimeout(() => {
    executeSyncCycle(false).catch(() => {});
  }, 1500);

  timerInstance = setInterval(() => {
    executeSyncCycle(false).catch(() => {});
  }, SIX_HOURS_MS);
}

export function stopScheduler(): void {
  if (timerInstance) {
    clearInterval(timerInstance);
    timerInstance = null;
  }
  schedulerState.isSchedulerActive = false;
  schedulerState.nextScheduledSyncAt = null;
}

export function getSchedulerStatus(): SchedulerStatus {
  return { ...schedulerState };
}
