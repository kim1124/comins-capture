import type { OperationContext } from '../engine/contract.js';
import { CaptureError, type CaptureStage } from '../errors.js';
export interface OperationOptions { signal?: AbortSignal; timeoutMs?: number }
export interface ManagedOperation extends OperationContext {
  stage: CaptureStage;
  readonly pending: number;
  wait<T>(work: () => T | PromiseLike<T>, discard?: (value: T) => void): Promise<T>;
  cancel(code?: 'ABORTED' | 'TIMEOUT' | 'DISPOSED'): void;
  drained(): Promise<void>;
  close(): void;
}
/** Cooperatively aborts work; retains pending tasks so owners cannot release resources early. */
export function createOperation(stage: CaptureStage, options: OperationOptions = {}): ManagedOperation {
  const timeout = options.timeoutMs ?? 30_000;
  // Timers above the platform signed 32-bit range are not reliable deadlines.
  if (!Number.isFinite(timeout) || timeout <= 0 || timeout > 2_147_483_647)
    throw new CaptureError('INVALID_OPTIONS', stage);
  try {
    if(options.signal!==undefined) Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted')!.get!.call(options.signal);
  } catch { throw new CaptureError('INVALID_OPTIONS',stage); }
  const deadline=performance.now()+timeout;
  const controller = new AbortController(), tasks = new Set<Promise<void>>();
  let reason: 'ABORTED' | 'TIMEOUT' | 'DISPOSED' = 'ABORTED';
  const cancel = (code: typeof reason = 'ABORTED') => {
    if (!controller.signal.aborted) { reason = code; controller.abort(); }
  };
  const abort = () => cancel();
  if (options.signal?.aborted) cancel();
  else options.signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(() => cancel('TIMEOUT'), timeout);
  const context: ManagedOperation = {
    stage, signal: controller.signal,
    get pending() { return tasks.size; },
    checkpoint() {
      if(performance.now()>=deadline)cancel('TIMEOUT');
      if (controller.signal.aborted) throw new CaptureError(reason, context.stage);
    },
    async wait<T>(work: () => T | PromiseLike<T>, discard?: (value: T) => void): Promise<T> {
      context.checkpoint();
      return new Promise<T>((resolve, reject) => {
        let settled = false;
        const aborted = () => { if (!settled) { settled = true; reject(new CaptureError(reason, context.stage)); } };
        controller.signal.addEventListener('abort', aborted, { once: true });
        const task = Promise.resolve().then(() => { context.checkpoint(); return work(); }).then(value => {
          try { context.checkpoint(); } catch { /* aborted() rejects; discard the late value below */ }
          if (settled || controller.signal.aborted) {
            try { discard?.(value); } catch { /* cleanup must not expose foreign errors */ }
            aborted();
          } else { settled = true; resolve(value); }
        }, error => { if (!settled) { settled = true; reject(error); } }).then(() => {
          controller.signal.removeEventListener('abort', aborted);
        });
        tasks.add(task);
        void task.then(() => tasks.delete(task));
      });
    },
    cancel,
    async drained() { while (tasks.size) await Promise.all([...tasks]); },
    close() { clearTimeout(timer); options.signal?.removeEventListener('abort', abort); },
  };
  return context;
}
