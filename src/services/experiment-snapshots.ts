import { createSnapshot, getSnapshot } from '@/api/admin';
import type { Snapshot } from '@/api/methods.schemas';

function waitForSnapshotPoll(signal: AbortSignal): Promise<void> {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, 500);
    function onAbort() {
      clearTimeout(timeout);
      reject(signal.reason);
    }
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

/** Save one analysis and wait for its result under the caller's cancellation/deadline. */
export async function createExperimentSnapshot(
  organizationId: string,
  datasourceId: string,
  experimentId: string,
  signal: AbortSignal,
): Promise<Snapshot> {
  signal.throwIfAborted();
  const { id } = await createSnapshot(organizationId, datasourceId, experimentId, { signal });
  while (true) {
    signal.throwIfAborted();
    const { snapshot } = await getSnapshot(organizationId, datasourceId, experimentId, id, { signal });
    signal.throwIfAborted();
    if (snapshot.status === 'failed') {
      const message = snapshot.details?.message;
      throw new Error(typeof message === 'string' ? message : 'Could not save the analysis snapshot.');
    }
    if (snapshot.status === 'success') {
      if (snapshot.data === null) throw new Error('The saved snapshot has no analysis data.');
      return snapshot;
    }
    await waitForSnapshotPoll(signal);
  }
}
