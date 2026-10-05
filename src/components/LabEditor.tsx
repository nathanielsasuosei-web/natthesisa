"use client";

import { useRef } from "react";
import Editor, { loader, type OnMount } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import type { LabLanguage } from "@/lib/lab";

/**
 * The real VS Code editor for the code lab.
 *
 * Monaco is the exact editor engine that powers VS Code. Instead of fetching
 * it from a CDN we bundle the local copy and give each language its own web
 * worker — the same architecture VS Code uses — so students get syntax
 * highlighting, IntelliSense, error squiggles, the minimap and the command
 * palette, fully offline.
 */

// Point @monaco-editor/react at the bundled Monaco instance (no CDN).
loader.config({ monaco });

// Each language service runs in its own web worker, exactly like VS Code.
(self as unknown as { MonacoEnvironment: monaco.Environment }).MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    if (label === "javascript" || label === "typescript") {
      return new Worker(new URL("./monaco-workers/ts.worker.ts", import.meta.url), { type: "module" });
    }
    if (label === "css" || label === "scss" || label === "less") {
      return new Worker(new URL("./monaco-workers/css.worker.ts", import.meta.url), { type: "module" });
    }
    if (label === "html" || label === "handlebars" || label === "razor") {
      return new Worker(new URL("./monaco-workers/html.worker.ts", import.meta.url), { type: "module" });
    }
    return new Worker(new URL("./monaco-workers/editor.worker.ts", import.meta.url), { type: "module" });
  },
};

// A dark theme that matches the code lab chrome (#1b1822).
monaco.editor.defineTheme("codemaster-dark", {
  base: "vs-dark",
  inherit: true,
  rules: [],
  colors: {
    "editor.background": "#1b1822",
    "editor.lineHighlightBackground": "#251f31",
    "editorLineNumber.foreground": "#4e4757",
    "editorLineNumber.activeForeground": "#8f889a",
    "minimap.background": "#17141d",
    "scrollbarSlider.background": "#ffffff14",
    "scrollbarSlider.hoverBackground": "#ffffff24",
  },
});

const MONACO_LANGUAGE: Record<LabLanguage, string> = {
  html: "html",
  css: "css",
  js: "javascript",
};

interface Props {
  /** Used as the model path, so every file keeps its own undo history. */
  fileName: string;
  language: LabLanguage;
  value: string;
  onChange: (value: string) => void;
  /** Fired on Ctrl/Cmd+Enter, mirroring the lab's Run button. */
  onRun: () => void;
}

export default function LabEditor({ fileName, language, value, onChange, onRun }: Props) {
  const runRef = useRef(onRun);
  runRef.current = onRun;

  const handleMount: OnMount = (editor, monacoInstance) => {
    editor.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.Enter, () => runRef.current());
    editor.focus();
  };

  return (
    <Editor
      path={fileName}
      language={MONACO_LANGUAGE[language]}
      value={value}
      theme="codemaster-dark"
      onChange={(next) => onChange(next ?? "")}
      onMount={handleMount}
      loading={
        <div className="grid h-full w-full place-items-center bg-[#1b1822] text-xs font-bold text-[#8f889a]">
          Opening the VS Code editor…
        </div>
      }
      options={{
        automaticLayout: true,
        fontSize: 13,
        lineHeight: 22,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",
        fontLigatures: true,
        tabSize: 2,
        insertSpaces: true,
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        cursorBlinking: "smooth",
        cursorSmoothCaretAnimation: "on",
        renderLineHighlight: "all",
        renderWhitespace: "selection",
        bracketPairColorization: { enabled: true },
        guides: { bracketPairs: "active", indentation: true },
        padding: { top: 12, bottom: 12 },
        wordWrap: "off",
        fixedOverflowWidgets: true,
        stickyScroll: { enabled: false },
        scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
        quickSuggestions: { other: true, comments: false, strings: false },
        suggestSelection: "first",
      }}
    />
  );
}
