/**
 * Runs student Python in a background worker (Pyodide).
 *
 * One worker is shared by every run and lives for the session; only a run
 * that overruns its timeout kills it (an infinite loop just ends that run —
 * the next run starts a fresh worker). Loading the runtime downloads roughly
 * ten megabytes from a CDN on first use, which is why callers get a status
 * callback: "loading" while Python downloads, "running" while code executes.
 */

export type PythonStatus = "loading" | "running";

interface PendingRun {
  resolve: (result: { output: string; errorOutput: string }) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

let workerPromise: Promise<Worker> | null = null;
let nextId = 1;
const pending = new Map<number, PendingRun>();

/** The runtime is a big download — give slow connections two minutes. */
const LOAD_TIMEOUT_MS = 120_000;

function loadWorker(onStatus?: (status: PythonStatus) => void): Promise<Worker> {
  if (!workerPromise) {
    onStatus?.("loading");
    workerPromise = new Promise<Worker>((resolve, reject) => {
      let worker: Worker;
      try {
        worker = new Worker(new URL("./python.worker.ts", import.meta.url), { type: "module" });
      } catch (error) {
        workerPromise = null;
        reject(error instanceof Error ? error : new Error(String(error)));
        return;
      }
      const loadTimer = setTimeout(() => {
        worker.terminate();
        workerPromise = null;
        reject(new Error("Python took too long to download — check your connection and try again."));
      }, LOAD_TIMEOUT_MS);
      const fail = (message: string) => {
        clearTimeout(loadTimer);
        worker.terminate();
        workerPromise = null;
        reject(new Error(message));
      };
      worker.onmessage = (event: MessageEvent) => {
        const data = (event.data ?? {}) as {
          type?: string;
          id?: number;
          ok?: boolean;
          output?: string;
          errorOutput?: string;
          error?: string;
        };
        if (typeof data.id === "number") {
          const run = pending.get(data.id);
          if (!run) return;
          pending.delete(data.id);
          clearTimeout(run.timer);
          if (data.ok) run.resolve({ output: data.output ?? "", errorOutput: data.errorOutput ?? "" });
          else run.reject(new Error(data.error || "Python hit an error."));
          return;
        }
        if (data.type === "ready") {
          clearTimeout(loadTimer);
          resolve(worker);
        } else if (data.type === "failed") {
          fail(
            data.error
              ? `Python could not start: ${data.error}`
              : "Python could not start — check your connection and try again.",
          );
        }
      };
      worker.onerror = () => fail("Python could not start — check your connection and try again.");
    });
  }
  return workerPromise;
}

/**
 * Runs Python source and resolves with whatever it printed. `output` is
 * stdout, `errorOutput` is stderr (tracebacks land there, not in `error` —
 * a crash is still a finished run).
 */
export async function runPython(
  code: string,
  options?: { timeoutMs?: number; onStatus?: (status: PythonStatus) => void },
): Promise<{ output: string; errorOutput: string }> {
  const timeoutMs = options?.timeoutMs ?? 20_000;
  const worker = await loadWorker(options?.onStatus);
  options?.onStatus?.("running");
  return new Promise((resolve, reject) => {
    const id = nextId++;
    const timer = setTimeout(() => {
      pending.delete(id);
      worker.terminate();
      workerPromise = null;
      reject(
        new Error(
          `Python ran for ${Math.round(timeoutMs / 1000)} seconds without finishing — ` +
            "it may be stuck in an infinite loop.",
        ),
      );
    }, timeoutMs);
    pending.set(id, { resolve, reject, timer });
    worker.postMessage({ id, code });
  });
}
