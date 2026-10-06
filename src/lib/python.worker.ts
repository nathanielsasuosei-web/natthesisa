/**
 * Web worker that runs student Python with Pyodide.
 *
 * Pyodide (CPython compiled to WebAssembly) is downloaded once from a CDN and
 * then runs entirely in this worker: student code can never touch the page,
 * the session or the network, and if it never finishes the page simply
 * terminates the worker — an infinite loop cannot freeze the tab.
 *
 * Protocol, worker side:
 *   in:  { id, code }                       run this source
 *   out: { type: "ready" }                  Python is loaded and ready
 *   out: { type: "failed", error }          the runtime could not download
 *   out: { id, ok, output, errorOutput }    the run finished (or blew up)
 */

export {};

const PYODIDE_INDEX_URL = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";

declare const self: {
  postMessage(message: unknown): void;
  onmessage: ((event: { data: unknown }) => void) | null;
};
declare function importScripts(...urls: string[]): void;

interface PyodideRuntime {
  setStdout(options: { batched(output: string): void }): void;
  setStderr(options: { batched(output: string): void }): void;
  runPythonAsync(code: string): Promise<unknown>;
}
declare function loadPyodide(options: { indexURL: string }): Promise<PyodideRuntime>;

let runtime: Promise<PyodideRuntime> | null = null;

function load(): Promise<PyodideRuntime> {
  if (!runtime) {
    importScripts(`${PYODIDE_INDEX_URL}pyodide.js`);
    runtime = loadPyodide({ indexURL: PYODIDE_INDEX_URL });
  }
  return runtime;
}

self.onmessage = async (event: { data: unknown }) => {
  const { id, code } = (event.data ?? {}) as { id?: number; code?: string };
  if (typeof id !== "number" || typeof code !== "string") return;
  try {
    const pyodide = await load();
    let output = "";
    let errorOutput = "";
    pyodide.setStdout({ batched: (text) => { output += `${text}\n`; } });
    pyodide.setStderr({ batched: (text) => { errorOutput += `${text}\n`; } });
    await pyodide.runPythonAsync(code);
    self.postMessage({ id, ok: true, output, errorOutput });
  } catch (error) {
    self.postMessage({
      id,
      ok: false,
      output: "",
      errorOutput: "",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Warm the runtime immediately so the first run is fast, and tell the page
// when Python is actually ready — or when the download failed.
load().then(
  () => self.postMessage({ type: "ready" }),
  (error: unknown) =>
    self.postMessage({
      type: "failed",
      error: error instanceof Error ? error.message : String(error),
    }),
);
