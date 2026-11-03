/* Classic worker: importScripts is not available in module workers. */
const indexURL = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";
let runtime;
function load() {
  if (!runtime) {
    importScripts(indexURL + "pyodide.js");
    runtime = loadPyodide({ indexURL });
  }
  return runtime;
}
self.onmessage = async (event) => {
  const { id, code } = event.data || {};
  if (typeof id !== "number" || typeof code !== "string") return;
  try {
    const pyodide = await load();
    let output = "", errorOutput = "";
    pyodide.setStdout({ batched: (text) => { output += text + "\n"; } });
    pyodide.setStderr({ batched: (text) => { errorOutput += text + "\n"; } });
    await pyodide.runPythonAsync(code);
    self.postMessage({ id, ok: true, output, errorOutput });
  } catch (error) {
    self.postMessage({ id, ok: false, error: error instanceof Error ? error.message : String(error) });
  }
};
try {
  load().then(
    () => self.postMessage({ type: "ready" }),
    (error) => self.postMessage({ type: "failed", error: String(error) }),
  );
} catch (error) {
  self.postMessage({ type: "failed", error: String(error) });
}
