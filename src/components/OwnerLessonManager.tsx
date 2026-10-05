"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { fmtBytes, fmtDate, fmtMoney } from "@/lib/format";
import { isEditableImage, isEditableVideo, type VideoEdits } from "@/lib/media";
import type { OwnerBrandingView } from "./OwnerBrandingCard";
import ImageEditor from "./media/ImageEditor";
import VideoEditor from "./media/VideoEditor";
import Icon from "./Icon";

export interface OwnerCourseOption {
  id: string;
  title: string;
  shortTitle: string;
  modules: Array<{ id: string; title: string }>;
}

export interface OwnerLessonFileRow {
  id: string;
  name: string;
  kind: string;
  size: number;
  href: string;
  trimStart?: number;
  trimEnd?: number | null;
  muted?: boolean;
  poster?: string | null;
  edited?: boolean;
}

export interface OwnerLessonRow {
  id: string;
  title: string;
  courseTitle: string;
  moduleTitle: string;
  duration: number;
  preview: boolean;
  /** What this lesson costs on its own (0 = included with a pass). */
  price: number;
  createdAt: string;
  createdBy: string;
  files: OwnerLessonFileRow[];
}

interface Props {
  courses: OwnerCourseOption[];
  lessons: OwnerLessonRow[];
  branding?: OwnerBrandingView;
  /** The owner's default lesson price; a new lesson starts from it. */
  defaultPrice: number;
}

interface DraftFile {
  key: string;
  file: File;
  edits?: VideoEdits;
  posterFile?: File | null;
  posterPreview?: string | null;
}

type EditorTarget =
  | { mode: "draft"; key: string; kind: "image" | "video"; src: string }
  | { mode: "published"; lessonId: string; fileId: string; kind: "image" | "video"; name: string; src: string; edits?: VideoEdits; poster: string | null };

const NEW_MODULE = "__new__";

const FIELD =
  "w-full rounded-xl border border-[#dcd8e2] bg-white px-3.5 py-2.5 text-xs text-[#211d27] transition placeholder:text-[#aaa4b0] focus:border-[#7a5af0] focus:ring-4 focus:ring-violet-100";
const LABEL = "mb-1.5 block text-[10px] font-black uppercase tracking-[.11em] text-[#6d6672]";

const FILE_ICON: Record<string, "video" | "file" | "book" | "courses"> = {
  video: "video",
  pdf: "file",
  slides: "courses",
  image: "book",
  other: "file",
};

let draftCounter = 0;

export default function OwnerLessonManager({ courses, lessons, branding, defaultPrice }: Props) {
  const router = useRouter();
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [moduleId, setModuleId] = useState(courses[0]?.modules[0]?.id ?? NEW_MODULE);
  const [moduleTitle, setModuleTitle] = useState("");
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("20");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("");
  const [objectives, setObjectives] = useState("");
  const [challenge, setChallenge] = useState("");
  const [preview, setPreview] = useState(false);
  const [price, setPrice] = useState(String(defaultPrice));
  const [files, setFiles] = useState<DraftFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<{ error?: boolean; text: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorTarget | null>(null);

  const course = useMemo(() => courses.find((item) => item.id === courseId), [courses, courseId]);
  const creatingModule = moduleId === NEW_MODULE;

  function pickCourse(nextCourseId: string) {
    setCourseId(nextCourseId);
    const next = courses.find((item) => item.id === nextCourseId);
    setModuleId(next?.modules[0]?.id ?? NEW_MODULE);
  }

  function pickFiles(list: FileList | null) {
    if (!list) return;
    const picked = [...list];
    const tooBig = picked.find((file) => file.size > 200 * 1024 * 1024);
    if (tooBig) {
      setMessage({ error: true, text: `“${tooBig.name}” is larger than the 200 MB limit.` });
      return;
    }
    const drafts: DraftFile[] = picked.map((file) => ({ key: `draft-${(draftCounter += 1)}`, file }));
    if (files.length + drafts.length > 5) {
      setMessage({ error: true, text: "Up to 5 files can be attached to one lesson." });
      return;
    }
    setMessage(null);
    setFiles([...files, ...drafts]);
  }

  function removeDraft(key: string) {
    const target = files.find((item) => item.key === key);
    if (target?.posterPreview) URL.revokeObjectURL(target.posterPreview);
    setFiles(files.filter((item) => item.key !== key));
  }

  function openDraftEditor(draft: DraftFile) {
    const kind = isEditableImage(draft.file.name, draft.file.type)
      ? "image"
      : isEditableVideo(draft.file.name, draft.file.type)
        ? "video"
        : null;
    if (!kind) {
      setMessage({ error: true, text: "Pictures (PNG, JPG, WEBP) and videos (MP4, WEBM, MOV) can be edited." });
      return;
    }
    setEditor({ mode: "draft", key: draft.key, kind, src: URL.createObjectURL(draft.file) });
  }

  function closeEditor() {
    if (editor && editor.mode === "draft") URL.revokeObjectURL(editor.src);
    setEditor(null);
  }

  function applyDraftImage(edited: File) {
    if (!editor || editor.mode !== "draft") return;
    const key = editor.key;
    setFiles((current) => current.map((item) => (item.key === key ? { ...item, file: edited } : item)));
    setMessage({ text: `“${edited.name}” is edited and ready to upload.` });
    closeEditor();
  }

  function applyDraftVideo(result: { edits: VideoEdits; posterFile: File | null; posterPreview: string | null }) {
    if (!editor || editor.mode !== "draft") return;
    const key = editor.key;
    setFiles((current) =>
      current.map((item) => {
        if (item.key !== key) return item;
        if (item.posterPreview && item.posterPreview !== result.posterPreview) URL.revokeObjectURL(item.posterPreview);
        return { ...item, edits: result.edits, posterFile: result.posterFile, posterPreview: result.posterPreview };
      })
    );
    setMessage({ text: "Video edits applied — they will be saved with the lesson." });
    closeEditor();
  }

  async function applyPublishedEdit(
    payload: { file?: File } | { trimStart: number; trimEnd: number | null; muted: boolean; poster: File | null; removePoster: boolean }
  ) {
    if (!editor || editor.mode !== "published") return;
    const form = new FormData();
    if ("file" in payload && payload.file) {
      form.set("file", payload.file);
    } else if ("trimStart" in payload) {
      form.set("trimStart", String(payload.trimStart));
      form.set("trimEnd", payload.trimEnd === null ? "null" : String(payload.trimEnd));
      form.set("muted", String(payload.muted));
      if (payload.poster) form.set("poster", payload.poster);
      if (payload.removePoster) form.set("removePoster", "true");
    }
    try {
      const response = await fetch(`/api/owner/lesson-files/${editor.lessonId}/${editor.fileId}`, { method: "PATCH", body: form });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage({ error: true, text: data.error ?? "The edit could not be saved." });
        return;
      }
      setMessage({ text: `“${editor.name}” was updated.` });
      router.refresh();
    } catch {
      setMessage({ error: true, text: "Network error. The edit was not saved." });
    }
    closeEditor();
  }

  function resetForm() {
    for (const item of files) if (item.posterPreview) URL.revokeObjectURL(item.posterPreview);
    setTitle("");
    setSummary("");
    setBody("");
    setCode("");
    setLanguage("");
    setObjectives("");
    setChallenge("");
    setPreview(false);
    setFiles([]);
    setModuleTitle("");
    setDuration("20");
    setProgress(0);
  }

  function publish(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (title.trim().length < 3 || summary.trim().length < 10 || body.trim().length < 10) {
      setMessage({ error: true, text: "Add a title, a short summary and the lesson content before publishing." });
      return;
    }
    if (creatingModule && moduleTitle.trim().length < 2) {
      setMessage({ error: true, text: "Name the new module this lesson should live in." });
      return;
    }

    const payload = new FormData();
    payload.set("courseId", courseId);
    payload.set("moduleId", creatingModule ? "new" : moduleId);
    payload.set("moduleTitle", creatingModule ? moduleTitle.trim() : "");
    payload.set("title", title.trim());
    payload.set("duration", duration);
    payload.set("summary", summary.trim());
    payload.set("body", body.trim());
    payload.set("code", code);
    payload.set("language", language);
    payload.set("objectives", objectives);
    payload.set("challenge", challenge.trim());
    payload.set("preview", String(preview));
    payload.set("price", price);
    files.forEach((item, index) => {
      payload.append("files", item.file);
      if (item.edits) {
        payload.set(`edit_${index}_trimStart`, String(item.edits.trimStart));
        payload.set(`edit_${index}_trimEnd`, item.edits.trimEnd === null ? "null" : String(item.edits.trimEnd));
        payload.set(`edit_${index}_muted`, String(item.edits.muted));
      }
      if (item.posterFile) payload.set(`poster_${index}`, item.posterFile);
    });

    setBusy(true);
    setProgress(files.length ? 1 : 25);
    setMessage(null);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/owner/lessons");
    xhr.upload.onprogress = (progressEvent) => {
      if (progressEvent.lengthComputable) {
        setProgress(Math.max(1, Math.round((progressEvent.loaded / progressEvent.total) * 100)));
      }
    };
    xhr.onload = () => {
      setBusy(false);
      let data: { error?: string; lesson?: { title?: string } } = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        data = {};
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        setMessage({ text: `“${data.lesson?.title ?? title.trim()}” is live in ${course?.shortTitle ?? "the course"}.` });
        resetForm();
        router.refresh();
        return;
      }
      setProgress(0);
      setMessage({ error: true, text: data.error ?? "The lesson could not be published." });
    };
    xhr.onerror = () => {
      setBusy(false);
      setProgress(0);
      setMessage({ error: true, text: "Network error. The lesson was not published." });
    };
    xhr.send(payload);
  }

  async function remove(lesson: OwnerLessonRow) {
    if (deletingId) return;
    if (!window.confirm(`Delete “${lesson.title}” and its uploaded files? This cannot be undone.`)) return;
    setDeletingId(lesson.id);
    setMessage(null);
    try {
      const response = await fetch(`/api/owner/lessons/${lesson.id}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage({ error: true, text: data.error ?? "The lesson could not be deleted." });
        return;
      }
      setMessage({ text: `“${lesson.title}” was removed from ${lesson.courseTitle}.` });
      router.refresh();
    } catch {
      setMessage({ error: true, text: "Network error. Nothing was deleted." });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
      <section className="open-surface rounded-[22px] border border-[#e2dee7] bg-white p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f4f1ff] px-2.5 py-1 text-[9px] font-black uppercase tracking-[.12em] text-[#5e3de0]">
              <Icon name="crown" size={12} /> Owner only
            </span>
            <h2 className="mt-3 text-base font-black tracking-[-.03em]">Publish a lesson</h2>
            <p className="mt-1 text-[11px] leading-5 text-[#8a8390]">
              Write the lesson, then attach video, PDFs or slides — each picture and video can be cropped, trimmed and tuned before it goes live.
            </p>
          </div>
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#1b1822] text-[#c4b7ff]"><Icon name="upload" size={20} /></span>
        </div>

        {branding && (
          <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-[#e8e4ec] bg-[#fbfafc] p-3.5">
            <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-[#e4e0e8] bg-white">
              {branding.hasPhoto && branding.photoHref ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={`${branding.photoHref}?v=${branding.updatedAt ?? ""}`} alt={branding.displayName} className="size-full object-cover" />
              ) : (
                <Icon name="user" size={18} className="text-[#b3acb9]" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-extrabold text-[#332e39]">{branding.displayName}</p>
              <p className="mt-0.5 truncate text-[10px] text-[#918a97]">{branding.roleTitle}</p>
            </div>
            {branding.hasLogo && branding.logoHref ? (
              <span className="grid h-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-[#e4e0e8] bg-[#1b1822] px-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${branding.logoHref}?v=${branding.updatedAt ?? ""}`} alt={`${branding.displayName} logo`} className="h-7 w-auto object-contain" />
              </span>
            ) : null}
            <p className="w-full text-[9px] leading-4 text-[#a19aa7]">
              {branding.hasPhoto || branding.hasLogo
                ? "This photo and logo will appear on the lesson you publish below."
                : "Add your photo and logo above to have them appear on every lesson you publish."}
            </p>
          </div>
        )}

        <form onSubmit={publish} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={LABEL}>Course</span>
              <select value={courseId} onChange={(event) => pickCourse(event.target.value)} className={FIELD}>
                {courses.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
              </select>
            </label>
            <label className="block">
              <span className={LABEL}>Module</span>
              <select value={moduleId} onChange={(event) => setModuleId(event.target.value)} className={FIELD}>
                {course?.modules.map((module) => <option key={module.id} value={module.id}>{module.title}</option>)}
                <option value={NEW_MODULE}>+ Create a new module</option>
              </select>
            </label>
          </div>

          {creatingModule && (
            <label className="block">
              <span className={LABEL}>New module name</span>
              <input value={moduleTitle} onChange={(event) => setModuleTitle(event.target.value)} placeholder="03 · Owner workshops" className={FIELD} />
            </label>
          )}

          <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
            <label className="block">
              <span className={LABEL}>Lesson title</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Designing a REST API with Express" className={FIELD} />
            </label>
            <label className="block">
              <span className={LABEL}>Minutes</span>
              <input type="number" min={1} max={600} value={duration} onChange={(event) => setDuration(event.target.value)} className={FIELD} />
            </label>
          </div>

          <label className="block">
            <span className={LABEL}>Summary shown under the title</span>
            <textarea value={summary} onChange={(event) => setSummary(event.target.value)} rows={2} placeholder="One or two sentences that explain what this lesson covers." className={FIELD} />
          </label>

          <label className="block">
            <span className={LABEL}>Lesson content</span>
            <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={5} placeholder="Explain the idea the way you would to a learner sitting next to you." className={FIELD} />
          </label>

          <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
            <label className="block">
              <span className={LABEL}>Code example (optional)</span>
              <textarea value={code} onChange={(event) => setCode(event.target.value)} rows={3} placeholder={"const app = express();"} className={`${FIELD} font-mono text-[11px]`} />
            </label>
            <label className="block">
              <span className={LABEL}>Language</span>
              <input value={language} onChange={(event) => setLanguage(event.target.value)} placeholder="javascript" className={FIELD} />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={LABEL}>Objectives (one per line, optional)</span>
              <textarea value={objectives} onChange={(event) => setObjectives(event.target.value)} rows={3} placeholder={"Model a resource\nValidate input"} className={FIELD} />
            </label>
            <label className="block">
              <span className={LABEL}>Practice challenge (optional)</span>
              <textarea value={challenge} onChange={(event) => setChallenge(event.target.value)} rows={3} placeholder="Build the endpoint and test it with a client." className={FIELD} />
            </label>
          </div>

          <div className="rounded-2xl border border-[#e6e2e9] bg-[#fbfafc] p-4">
            <span className={LABEL}>Lesson materials · video, PDF, slides, images (max 5 files · 200 MB each)</span>
            <label className="mt-1 flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-[#cdc5e2] bg-white px-4 py-6 text-center transition hover:border-[#7a5af0]">
              <span className="grid size-10 place-items-center rounded-xl bg-[#f0ecff] text-[#5e3de0]"><Icon name="upload" size={18} /></span>
              <span className="text-xs font-bold text-[#4d4753]">Choose files from this device</span>
              <span className="text-[10px] text-[#9a939f]">mp4 · webm · mov · pdf · pptx · key · png · jpg · zip</span>
              <input type="file" multiple className="sr-only" onChange={(event) => { pickFiles(event.target.files); event.target.value = ""; }} />
            </label>

            {files.length > 0 && (
              <ul className="mt-3 space-y-2">
                {files.map((item) => {
                  const editable = isEditableImage(item.file.name, item.file.type) || isEditableVideo(item.file.name, item.file.type);
                  return (
                    <li key={item.key} className="flex items-center gap-3 rounded-xl border border-[#e8e4ec] bg-white px-3 py-2">
                      {item.posterPreview ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={item.posterPreview} alt="" className="h-9 w-16 shrink-0 rounded-md object-cover" />
                      ) : (
                        <Icon name={FILE_ICON[isEditableVideo(item.file.name, item.file.type) ? "video" : "file"]} size={15} className="shrink-0 text-[#6543e8]" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-semibold text-[#4d4753]">{item.file.name}</p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[9px] text-[#9a939f]">
                          <span>{fmtBytes(item.file.size)}</span>
                          {item.edits && (item.edits.trimStart > 0 || item.edits.trimEnd !== null || item.edits.muted) && (
                            <span className="rounded-full bg-[#f0ecff] px-2 py-0.5 font-black uppercase tracking-wide text-[#5e3de0]">Edited</span>
                          )}
                        </p>
                      </div>
                      {editable && (
                        <button type="button" onClick={() => openDraftEditor(item)} className="shrink-0 rounded-lg border border-[#d9d0fb] bg-[#f4f1ff] px-2.5 py-1.5 text-[9px] font-bold text-[#5e3de0]">
                          {isEditableVideo(item.file.name, item.file.type) ? "Trim / edit" : "Crop / edit"}
                        </button>
                      )}
                      <button type="button" onClick={() => removeDraft(item.key)} className="grid size-6 shrink-0 place-items-center rounded-lg text-[#aaa4b0] transition hover:bg-red-50 hover:text-red-600" aria-label={`Remove ${item.file.name}`}><Icon name="close" size={12} /></button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <label className="block rounded-xl border border-[#e6e2e9] p-3.5">
            <span className="block text-[11px] font-bold text-[#332e39]">Price of this lesson</span>
            <span className="mt-0.5 block text-[10px] leading-4 text-[#918a97]">
              What a student pays to unlock this lesson on its own. The access pass is required either way; buy the
              whole course and this is included. Set it to 0 for no extra charge.
            </span>
            <span className="mt-2.5 flex items-center gap-2">
              <span className="text-xs font-black text-[#6d4aff]">GH₵</span>
              <input
                type="number"
                min={0}
                step={1}
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                className="w-32 rounded-lg border border-[#ddd9e2] bg-white px-3 py-2 text-xs font-bold"
              />
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#e6e2e9] p-3.5">
            <input type="checkbox" checked={preview} onChange={(event) => setPreview(event.target.checked)} className="mt-0.5 size-4 accent-[#6d4aff]" />
            <span className="text-[11px] leading-5 text-[#5d5763]"><strong className="block text-[#332e39]">Free preview</strong>Anyone signed in can open this lesson with no pass and no payment — the teacher&apos;s invitation to sample the course.</span>
          </label>

          {busy && (
            <div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#eeeaf1]"><div className="h-full rounded-full bg-[#6d4aff] transition-all" style={{ width: `${progress}%` }} /></div>
              <p className="mt-1.5 text-[10px] font-semibold text-[#817a87]">{files.length ? `Uploading ${files.length} file${files.length === 1 ? "" : "s"}… ${progress}%` : "Publishing…"}</p>
            </div>
          )}

          {message && (
            <p role="status" className={`rounded-xl px-3.5 py-2.5 text-[11px] font-semibold ${message.error ? "border border-red-200 bg-red-50 text-red-700" : "border border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{message.text}</p>
          )}

          <button type="submit" disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#6d4aff] px-4 py-3.5 text-sm font-extrabold text-white shadow-[0_9px_25px_rgba(109,74,255,.22)] transition hover:-translate-y-0.5 hover:bg-[#5e3ce8] disabled:translate-y-0 disabled:opacity-60">
            {busy ? "Publishing lesson…" : <><Icon name="upload" size={16} /> Publish lesson</>}
          </button>
        </form>
      </section>

      <section className="open-surface h-fit rounded-[22px] border border-[#e2dee7] bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold">Published by you</h2>
            <p className="mt-1 text-[10px] text-[#918a97]">{lessons.length} lesson{lessons.length === 1 ? "" : "s"} added to the catalog from this console</p>
          </div>
          <span className="grid size-9 place-items-center rounded-xl bg-[#f0ecff] text-[#5e3de0]"><Icon name="courses" size={17} /></span>
        </div>

        {lessons.length === 0 ? (
          <div className="mt-5 border-y border-dashed border-[#dcd7e2] px-4 py-10 text-center">
            <Icon name="book" size={24} className="mx-auto text-[#918a97]" />
            <p className="mt-3 text-xs font-extrabold">Nothing published yet</p>
            <p className="mt-1 text-[10px] leading-5 text-[#918a97]">Your first lesson will appear here, ready to edit or remove.</p>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {lessons.map((lesson) => (
              <li key={lesson.id} className="rounded-2xl border border-[#e8e4ec] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-extrabold text-[#332e39]">{lesson.title}</p>
                    <p className="mt-1 text-[9px] text-[#918a97]">{lesson.courseTitle} · {lesson.moduleTitle} · {lesson.duration} min</p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      {branding?.hasPhoto && branding.photoHref ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={`${branding.photoHref}?v=${branding.updatedAt ?? ""}`} alt="" className="size-4 rounded-full object-cover" />
                      ) : null}
                      <p className="text-[9px] text-[#aaa4b0]">Published {fmtDate(lesson.createdAt)} by {lesson.createdBy}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="rounded-full bg-[#f2f0f4] px-2 py-1 text-[8px] font-black uppercase text-[#6d6673]">{fmtMoney(lesson.price)}</span>
                    {lesson.preview && <span className="rounded-full bg-[#f0ecff] px-2 py-1 text-[8px] font-black uppercase text-[#5e3de0]">Preview</span>}
                    <button onClick={() => remove(lesson)} disabled={deletingId === lesson.id} className="grid size-7 place-items-center rounded-lg text-[#aaa4b0] transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40" title="Delete lesson"><Icon name="close" size={13} /></button>
                  </div>
                </div>
                {lesson.files.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {lesson.files.map((file) => {
                      const editable = isEditableImage(file.name, file.kind === "image" ? "image/" : "") || isEditableVideo(file.name, file.kind === "video" ? "video/" : "");
                      return (
                        <span key={file.id} className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-[#e4e0e8] bg-[#fbfafc] px-2 py-1.5 text-[9px] font-semibold text-[#5d5763]">
                          <Icon name={FILE_ICON[file.kind] ?? "file"} size={11} className="text-[#6543e8]" />
                          <a href={file.href} target="_blank" rel="noreferrer" className="max-w-[150px] truncate hover:text-[#5e3de0]">{file.name}</a>
                          <span className="text-[#a19aa7]">{fmtBytes(file.size)}</span>
                          {file.edited && <span className="rounded-full bg-[#f0ecff] px-1.5 py-0.5 text-[8px] font-black uppercase text-[#5e3de0]">Edited</span>}
                          {editable && (
                            <button
                              type="button"
                              onClick={() => setEditor({ mode: "published", lessonId: lesson.id, fileId: file.id, kind: file.kind === "video" ? "video" : "image", name: file.name, src: file.href, edits: { trimStart: file.trimStart ?? 0, trimEnd: file.trimEnd ?? null, muted: file.muted ?? false }, poster: file.poster ?? null })}
                              className="rounded-md border border-[#d9d0fb] bg-white px-1.5 py-0.5 text-[8px] font-black uppercase text-[#5e3de0]"
                            >
                              Edit
                            </button>
                          )}
                        </span>
                      );
                    })}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {editor?.mode === "draft" && editor.kind === "image" && (
        <ImageEditor
          source={editor.src}
          name={files.find((item) => item.key === editor.key)?.file.name ?? "picture.png"}
          title="Edit picture before upload"
          presets={undefined}
          onApply={(result) => applyDraftImage(result.file)}
          onCancel={closeEditor}
        />
      )}

      {editor?.mode === "draft" && editor.kind === "video" && (
        <VideoEditor
          src={editor.src}
          name={files.find((item) => item.key === editor.key)?.file.name ?? "video.mp4"}
          initial={files.find((item) => item.key === editor.key)?.edits}
          existingPoster={files.find((item) => item.key === editor.key)?.posterPreview ?? null}
          onApply={applyDraftVideo}
          onCancel={closeEditor}
        />
      )}

      {editor?.mode === "published" && editor.kind === "image" && (
        <ImageEditor
          source={editor.src}
          name={editor.name}
          title={`Edit “${editor.name}”`}
          hint="Changes replace the live picture immediately when you apply."
          onApply={(result) => void applyPublishedEdit({ file: result.file })}
          onCancel={closeEditor}
        />
      )}

      {editor?.mode === "published" && editor.kind === "video" && (
        <VideoEditor
          src={editor.src}
          name={editor.name}
          initial={editor.edits}
          existingPoster={editor.poster}
          onApply={(result) => void applyPublishedEdit({ trimStart: result.edits.trimStart, trimEnd: result.edits.trimEnd, muted: result.edits.muted, poster: result.posterFile, removePoster: result.removePoster })}
          onCancel={closeEditor}
        />
      )}
    </div>
  );
}
