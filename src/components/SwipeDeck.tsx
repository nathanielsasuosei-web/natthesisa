"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { DeckCard, DeckState } from "@/lib/discover";
import { Button, IconButton, Meter, Sheet, Alert, messageFrom, sendJson, useToast } from "./forms";

/**
 * The deck: drag the top card (or use the buttons / arrow keys) and the swipe
 * is only real once POST /api/discover/swipe accepts it. If the server says no
 * — out of likes, match slots full, profile unfinished, hidden from Discover —
 * the card flies back and the matching sheet opens. The animation is a
 * courtesy; the API is the rule.
 */

type Dir = "left" | "right" | "up";
const ACTION: Record<Dir, "pass" | "like" | "super"> = { left: "pass", right: "like", up: "super" };
const THROW = 520;
const FLICK_PX = 96;

export default function SwipeDeck({
  deck,
  firstName,
  hour,
  hidden = false,
  suspended = false,
}: {
  deck: DeckState;
  firstName: string;
  /** the server's hour, so the greeting can't mismatch during hydration */
  hour: number;
  /** privacy.discoverable is off — the deck is closed until it's back on */
  hidden?: boolean;
  suspended?: boolean;
}) {
  const router = useRouter();
  const [cards, setCards] = useState<DeckCard[]>(deck.cards);
  const [meters, setMeters] = useState({
    likesUsed: deck.likesUsed,
    likeLimit: deck.likeLimit,
    likesLeft: deck.likesLeft,
    matchesUsed: deck.matchesUsed,
    matchLimit: deck.matchLimit,
    canSwipe: deck.canSwipe,
    blockedReason: deck.blockedReason,
  });
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [flying, setFlying] = useState<Dir | null>(null);
  const [slide, setSlide] = useState(0);
  const [sheet, setSheet] = useState<null | "limits" | "pool" | "rewind">(null);
  const [celebrate, setCelebrate] = useState<{ name: string; compatibility: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [swiped, setSwiped] = useState(false);
  const toast = useToast();
  const start = useRef<{ x: number; y: number; at: number } | null>(null);

  const top = cards[0];
  const out = flying === "right" || flying === "up" ? THROW : flying === "left" ? -THROW : 0;
  const offset = flying ? { x: out, y: flying === "up" ? -THROW : pos.y * 0.4 } : pos;
  const rot = offset.x / 16;
  const likeProgress = Math.max(0, Math.min(1, (offset.x - 12) / 110));
  const nopeProgress = Math.max(0, Math.min(1, (-offset.x - 12) / 110));

  function onDown(e: React.PointerEvent) {
    if (!top || flying || busy) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    start.current = { x: e.clientX, y: e.clientY, at: Date.now() };
    setDragging(true);
  }

  function onMove(e: React.PointerEvent) {
    if (!start.current || flying) return;
    setPos({ x: e.clientX - start.current.x, y: e.clientY - start.current.y });
  }

  function onUp(e: React.PointerEvent) {
    if (!start.current || flying) return;
    const { x, y: sy, at } = start.current;
    const dx = e.clientX - x;
    const dy = e.clientY - sy;
    const moved = Math.abs(dx) + Math.abs(dy);
    const quick = Date.now() - at < 240;
    start.current = null;
    setDragging(false);

    // a tap (no drag, short) flips the card's slides instead of swiping
    if (moved < 12 && quick && top) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const rightSide = e.clientX - rect.left > rect.width * 0.55;
      setSlide((s) => Math.max(0, Math.min(top.slides.length - 1, s + (rightSide ? 1 : -1))));
      setPos({ x: 0, y: 0 });
      return;
    }

    if (dy < -FLICK_PX * 1.3 && Math.abs(dy) > Math.abs(dx) * 1.15) void commit("up");
    else if (dx > FLICK_PX) void commit("right");
    else if (dx < -FLICK_PX) void commit("left");
    else setPos({ x: 0, y: 0 });
  }

  async function commit(dir: Dir) {
    if (!top || flying || busy) return;
    // we already know the like can't be granted — ask the server nothing, just
    // explain it, and leave the card where it is
    if (dir !== "left" && likeBlocked) {
      setPos({ x: 0, y: 0 });
      setSheet("limits");
      return;
    }
    const card = top;
    setSwiped(true);
    setFlying(dir);
    setBusy(true);
    const sent = sendJson("/api/discover/swipe", {
      method: "POST",
      body: JSON.stringify({ name: card.name, action: ACTION[dir] }),
    });
    // let the card leave the screen before the next one takes its place
    await new Promise((r) => window.setTimeout(r, 300));
    setCards((cs) => (cs[0]?.name === card.name ? cs.slice(1) : cs));
    setPos({ x: 0, y: 0 });
    setSlide(0);
    setFlying(null);

    const { ok, body } = await sent;
    setBusy(false);

    if (!ok) {
      // hand the card back — nothing was spent
      setCards((cs) => [card, ...cs]);
      const code = typeof body.code === "string" ? body.code : "";
      if (code === "LIKE_LIMIT" || code === "MATCH_LIMIT") setSheet("limits");
      else if (code === "ALREADY_SEEN" || code === "NO_SUCH_PROFILE") setCards((cs) => cs.slice(1));
      else toast.show(messageFrom(body, "That swipe didn't go through."));
      return;
    }

    const fresh = body.deck as DeckState | undefined;
    if (fresh) {
      setCards(fresh.cards);
      setMeters({
        likesUsed: fresh.likesUsed,
        likeLimit: fresh.likeLimit,
        likesLeft: fresh.likesLeft,
        matchesUsed: fresh.matchesUsed,
        matchLimit: fresh.matchLimit,
        canSwipe: fresh.canSwipe,
        blockedReason: fresh.blockedReason,
      });
    } else {
      setCards((cs) => cs.slice(1));
    }
    if (typeof body.note === "string") toast.show(body.note);
    if (body.matched) {
      const match = body.matched as { name: string; compatibility: number };
      setCelebrate({ name: match.name, compatibility: match.compatibility });
    }
    router.refresh();
  }

  async function rewind() {
    if (busy) return;
    setBusy(true);
    const { ok, body } = await sendJson("/api/discover/swipe", {
      method: "POST",
      body: JSON.stringify({ action: "rewind" }),
    });
    setBusy(false);
    if (!ok) return toast.show(messageFrom(body, "Nothing to undo."));
    if (typeof body.note === "string") toast.show(body.note);
    const fresh = body.deck as DeckState | undefined;
    if (fresh) {
      setCards(fresh.cards);
      setSlide(0);
    }
    router.refresh();
  }

  async function reshuffle() {
    setBusy(true);
    const { ok, body } = await sendJson("/api/discover/swipe", {
      method: "POST",
      body: JSON.stringify({ action: "reshuffle" }),
    });
    setBusy(false);
    if (!ok) return toast.show(messageFrom(body, "Could not reshuffle."));
    const fresh = body.deck as DeckState | undefined;
    if (fresh) {
      setCards(fresh.cards);
      setMeters((m) => ({ ...m, canSwipe: fresh.canSwipe, blockedReason: fresh.blockedReason }));
      setSheet(null);
      setSlide(0);
    }
    toast.show(typeof body.back === "number" && body.back > 0 ? `${body.back} people are back in the deck` : "Deck reshuffled");
  }

  const empty = !top && !flying;
  // passes are always free; a like needs allowance *and* a free match slot
  const likesExhausted = meters.likeLimit !== null && meters.likesUsed >= meters.likeLimit;
  const slotsFull = meters.matchLimit !== null && meters.matchesUsed >= meters.matchLimit;
  const likeBlocked = likesExhausted || slotsFull || suspended;

  if (hidden || suspended) {
    return (
      <GateScreen
        kind={suspended ? "suspended" : "hidden"}
        onFix={suspended ? undefined : async () => {
          const { ok, body } = await sendJson("/api/settings", {
            method: "PATCH",
            body: JSON.stringify({ privacy: { discoverable: true } }),
          });
          if (ok) {
            toast.show("You're back on Sparks 👋");
            router.refresh();
          } else {
            toast.show(messageFrom(body, "Could not change that."));
          }
        }}
      />
    );
  }

  return (
    <div
      className="flex h-full flex-col"
      tabIndex={0}
      onKeyDown={(e) => {
        if (empty) return;
        if (e.key === "ArrowLeft") void commit("left");
        if (e.key === "ArrowRight") void commit("right");
        if (e.key === "ArrowUp") void commit("up");
      }}
    >
      {/* greeting */}
      <div className="px-5 pb-2 pt-3">
        <h1 className="text-[26px] font-bold leading-tight tracking-tight">
          {greeting(hour)}, {firstName.split(" ")[0]}
        </h1>
        <p className="mt-0.5 text-sm text-white/50">
          {empty
            ? "That's everyone for now."
            : `${cards.length} ${cards.length === 1 ? "person" : "people"} near you match your picks`}
        </p>
      </div>

      {/* the stack */}
      <div className="relative mx-5 mt-1 flex-1 select-none" style={{ minHeight: 420 }}>
        {!top && !flying && (
          <div className="absolute inset-0 grid place-items-center rounded-[28px] bg-white/[0.04] px-8 text-center ring-1 ring-white/10">
            <div>
              <span aria-hidden className="animate-float mx-auto grid size-14 place-items-center rounded-3xl bg-white/[0.07] text-2xl">
                🌱
              </span>
              <h2 className="mt-4 text-lg font-bold">Fresh faces are on the way</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-white/55">
                You've been through everyone in this pool who fits your age range and distance. Widen
                them, or bring back the people you passed on.
              </p>
              <div className="mt-5 flex flex-col gap-2">
                <Button onClick={() => setSheet("pool")}>Bring back passes</Button>
                <Button variant="ghost" onClick={() => router.push("/app/profile/edit")}>
                  Widen my preferences
                </Button>
              </div>
            </div>
          </div>
        )}

        {cards
          .slice(0, 3)
          .map((card, i) => {
            const isTop = i === 0;
            const depth = cards.length > 1 ? Math.min(i, 2) : 0;
            const style = isTop
              ? {
                  transform: `translate3d(${offset.x}px, ${offset.y}px, 0) rotate(${rot}deg)`,
                  transition: dragging || flying ? "none" : "transform 320ms cubic-bezier(0.22,1,0.36,1)",
                  zIndex: 30,
                }
              : {
                  transform: `translateY(${depth * 12}px) scale(${1 - depth * 0.045})`,
                  zIndex: 30 - depth * 10,
                };
            const slideData = card.slides[Math.min(slide, card.slides.length - 1)];
            return (
              <article
                key={card.name}
                className="absolute inset-0 overflow-hidden rounded-[28px] bg-[#1b1017] shadow-2xl shadow-black/60 ring-1 ring-white/12"
                style={style}
                aria-hidden={!isTop}
              >
                {isTop && (
                  <div
                    className="absolute inset-0 flex flex-col"
                    style={{ touchAction: "none", cursor: dragging ? "grabbing" : "grab" }}
                    onPointerDown={onDown}
                    onPointerMove={onMove}
                    onPointerUp={onUp}
                    onPointerCancel={() => {
                      start.current = null;
                      setDragging(false);
                      setPos({ x: 0, y: 0 });
                    }}
                  >
                    <DeckFace card={card} slide={slideData} index={Math.min(slide, card.slides.length - 1)} total={card.slides.length} />
                    {/* decision stamps */}
                    <Stamp label="like" progress={likeProgress} tone="emerald" />
                    <Stamp label="nope" progress={nopeProgress} tone="rose" side="left" />
                  </div>
                )}
                {!isTop && <DeckFace card={card} slide={card.slides[0]} index={0} total={card.slides.length} dimmed />}
              </article>
            );
          })
          .reverse()}

        {/* swipe hint */}
        {top && !swiped && slide === 0 && (
          <p className="pointer-events-none absolute inset-x-0 -bottom-1 z-40 text-center text-[11px] text-white/30">
            drag, or tap the sides for more · ← pass · → like
          </p>
        )}
      </div>

      {/* controls */}
      <div className="px-5 pb-3 pt-3">
        {likeBlocked && !suspended && (
          <button
            type="button"
            onClick={() => setSheet("limits")}
            className="press mb-2 flex w-full items-center gap-2 rounded-2xl bg-amber-400/12 px-3 py-2 text-left text-xs text-amber-100 ring-1 ring-amber-300/25"
          >
            <span aria-hidden>{likesExhausted ? "⚡" : "🗂️"}</span>
            <span className="min-w-0 flex-1 truncate">
              {likesExhausted
                ? `Out of likes this period — passing is still free`
                : `All ${meters.matchLimit} match slots are full — pass to keep moving`}
            </span>
            <span className="shrink-0 font-semibold underline underline-offset-2">Fix it</span>
          </button>
        )}
        <div className="flex items-center justify-center gap-3">
          <IconButton label="Undo the last swipe" onClick={() => void rewind()} size={46} >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-5">
              <path d="M4 12a8 8 0 1 0 3-6.2M4 4v4h4" />
            </svg>
          </IconButton>
          <IconButton
            label="Pass"
            tone="pass"
            size={62}
            disabled={!top || busy || suspended}
            onClick={() => void commit("left")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" className="size-6">
              <path d="M17 7 7 17M7 7l10 10" />
            </svg>
          </IconButton>
          <IconButton
            label="Super-like"
            tone="super"
            size={46}
            disabled={!top || busy || suspended}
            className={likeBlocked ? "opacity-45" : ""}
            onClick={() => void commit("up")}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
              <path d="m12 3 2.5 5.6 6 .6-4.5 4 1.3 5.9L12 16.9 6.7 19.1 8 13.2l-4.5-4 6-.6z" />
            </svg>
          </IconButton>
          <IconButton
            label="Like"
            tone="like"
            size={62}
            disabled={!top || busy || suspended}
            className={likeBlocked ? "opacity-45" : ""}
            onClick={() => void commit("right")}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="size-7">
              <path d="M12 21C7 16.5 3 13 3 8.8 3 6 5.2 4 7.7 4c1.6 0 3.2.8 4.3 2.2C13.1 4.8 14.7 4 16.3 4 18.8 4 21 6 21 8.8c0 4.2-4 7.7-9 12.2z" />
            </svg>
          </IconButton>
          <IconButton label="How limits work" tone="ghost" size={46} onClick={() => setSheet("limits")}>
            <span className="text-sm font-bold">i</span>
          </IconButton>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <Meter
            label="Likes this period"
            value={meters.likesUsed}
            max={meters.likeLimit}
            tone={meters.likesLeft !== null && meters.likesLeft <= 3 ? "amber" : "rose"}
          />
          <Meter label="Match slots" value={meters.matchesUsed} max={meters.matchLimit} tone="emerald" />
        </div>
      </div>

      {/* out of room sheet */}
      <Sheet
        open={sheet === "limits"}
        onClose={() => setSheet(null)}
        title={meters.blockedReason === "MATCH_LIMIT" ? "Every match slot is busy" : "That's the like allowance"}
        subtitle={
          meters.blockedReason === "MATCH_LIMIT"
            ? "Unmatch someone you've moved on from, or upgrade for more slots."
            : "Upgrade for thousands more likes a period — and more match slots while you're at it."
        }
        footer={
          <div className="grid gap-2">
            <Button full onClick={() => router.push("/app/membership")}>
              See membership
            </Button>
            <Button full variant="ghost" onClick={() => router.push("/app/matches")}>
              Manage my matches
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Meter label="Likes used" value={meters.likesUsed} max={meters.likeLimit} />
          <Meter label="Active matches" value={meters.matchesUsed} max={meters.matchLimit} tone="emerald" />
          <Alert tone="info">
            Nothing was spent on that last swipe — the card is back in your deck.
          </Alert>
        </div>
      </Sheet>

      {/* empty deck sheet */}
      <Sheet
        open={sheet === "pool"}
        onClose={() => setSheet(null)}
        title="Bring the passed ones back"
        subtitle="Your likes and matches stay exactly as they are — this only puts the people you skipped back into the deck."
        footer={
          <Button full onClick={() => void reshuffle()} busy={busy}>
            Reshuffle the deck
          </Button>
        }
      >
        <ul className="space-y-2 text-sm text-white/60">
          <li className="flex justify-between gap-3 rounded-2xl bg-white/[0.05] px-4 py-3">
            <span>Passed so far</span>
            <span className="font-semibold text-white">{deck.passedCount}</span>
          </li>
          <li className="flex justify-between gap-3 rounded-2xl bg-white/[0.05] px-4 py-3">
            <span>Active matches</span>
            <span className="font-semibold text-white">
              {meters.matchesUsed}
              {meters.matchLimit === null ? " · unlimited" : ` / ${meters.matchLimit}`}
            </span>
          </li>
        </ul>
      </Sheet>

      {/* celebration */}
      {celebrate && (
        <div className="fixed inset-0 z-[70] grid place-items-center overflow-hidden bg-black/70 px-8 backdrop-blur-md">
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            {Array.from({ length: 14 }).map((_, i) => (
              <span
                key={i}
                className="animate-heart absolute bottom-10 text-2xl"
                style={
                  {
                    left: `${(i * 7.3) % 100}%`,
                    animationDelay: `${(i % 7) * 0.22}s`,
                    "--rot": `${(i % 5) * 12 - 24}deg`,
                  } as React.CSSProperties
                }
              >
                {["💘", "✨", "💞", "🌹"][i % 4]}
              </span>
            ))}
          </div>
          <div className="animate-pop relative text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-300">It&apos;s a match</p>
            <h2 className="mt-3 text-4xl font-bold leading-tight tracking-tight">
              You and {celebrate.name}
            </h2>
            <p className="mt-2 text-sm text-white/65">
              {celebrate.compatibility}% compatible. {firstName.split(" ")[0]}, you&apos;ve got this.
            </p>
            <div className="mt-7 flex flex-col gap-2">
              <Button
                full
                onClick={() => {
                  setCelebrate(null);
                  router.push("/app/matches");
                  router.refresh();
                }}
              >
                Plan a first date
              </Button>
              <Button full variant="ghost" onClick={() => setCelebrate(null)}>
                Keep swiping
              </Button>
            </div>
          </div>
        </div>
      )}

      {toast.node}
    </div>
  );
}

/* ------------------------------- card face ------------------------------ */

function DeckFace({
  card,
  slide,
  index,
  total,
  dimmed = false,
}: {
  card: DeckCard;
  slide: DeckCard["slides"][number];
  index: number;
  total: number;
  dimmed?: boolean;
}) {
  return (
    <div className={`relative flex h-full flex-col ${dimmed ? "opacity-70" : ""}`}>
      {/* art */}
      <div className={`relative bg-gradient-to-br ${slide.tone} px-5 pb-4 pt-5`}>
        <div className="flex gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <span key={i} className={`h-0.5 flex-1 rounded-full ${i <= index ? "bg-white" : "bg-white/35"}`} />
          ))}
        </div>
        <div className="mt-3 flex items-start justify-between gap-3">
          <span className="rounded-full bg-black/25 px-2.5 py-1 text-[11px] font-semibold text-white">
            {card.compatibility}% match
          </span>
          {card.sharedCount > 0 && (
            <span className="rounded-full bg-black/25 px-2.5 py-1 text-[11px] font-medium text-white">
              {card.sharedCount} shared interest{card.sharedCount === 1 ? "" : "s"}
            </span>
          )}
        </div>
        <div className="mt-4 grid place-items-center py-3">
          <span aria-hidden className="text-[76px] leading-none drop-shadow-lg">
            {slide.emoji}
          </span>
        </div>
      </div>

      {/* body */}
      <div className="flex flex-1 flex-col overflow-hidden px-5 pb-5 pt-4">
        <div className="flex items-baseline gap-2">
          <h3 className="truncate text-2xl font-bold tracking-tight">{card.name}</h3>
          <span className="text-2xl font-light text-white/60">{card.age}</span>
        </div>
        <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-white/50">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-3.5">
            <path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
          {card.city} · {card.distanceKm} km away
        </p>

        <div className="mt-3 flex-1 overflow-hidden">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">
            {slide.kind === "about" ? "About" : slide.kind === "prompt" ? slide.title : card.job}
          </p>
          <p className="mt-1.5 line-clamp-4 text-[15px] leading-relaxed text-white/80">{slide.body}</p>
          {index === total - 1 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {card.interests.map((tag) => (
                <span
                  key={tag.tag}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] ${
                    tag.shared ? "bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-300/25" : "bg-white/[0.07] text-white/60"
                  }`}
                >
                  <span aria-hidden>{tag.emoji}</span>
                  {tag.tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <p className="mt-2 text-[11px] text-white/30">
          {index + 1} / {total} · swipe or tap the sides
        </p>
      </div>
    </div>
  );
}

function Stamp({
  label,
  progress,
  tone,
  side = "right",
}: {
  label: string;
  progress: number;
  tone: "emerald" | "rose";
  side?: "left" | "right";
}) {
  if (progress <= 0.02) return null;
  const cls = tone === "emerald" ? "text-emerald-300 ring-emerald-300" : "text-rose-300 ring-rose-300";
  return (
    <span
      aria-hidden
      style={{ opacity: Math.min(1, progress * 1.4) }}
      className={`pointer-events-none absolute top-8 ${side === "right" ? "right-6" : "left-6"} rounded-xl border-[3px] px-3 py-1 text-xl font-black uppercase tracking-widest ${cls} ${
        progress > 0.6 ? "animate-stamp" : ""
      }`}
    >
      {label}
    </span>
  );
}

/** The deck refuses to start until the account is switable. */
function GateScreen({ kind, onFix }: { kind: "hidden" | "suspended"; onFix?: () => void }) {
  const copy =
    kind === "suspended"
      ? {
          emoji: "⏸️",
          title: "Your account is on hold",
          body: "An admin suspended this account, so liking and matching are paused. Your profile, photos and security settings still work — reach out to support@sparks.app to sort it out.",
          cta: null,
        }
      : {
          emoji: "🙈",
          title: "You're hidden from Discover",
          body: "Nobody new can run into you while “Show me on Sparks” is off. Your existing matches are untouched.",
          cta: "Show me on Sparks",
        };
  return (
    <div className="flex h-full flex-col items-center justify-center px-8 text-center">
      <span aria-hidden className="animate-float grid size-16 place-items-center rounded-3xl bg-white/[0.06] text-3xl ring-1 ring-white/10">
        {copy.emoji}
      </span>
      <h1 className="mt-5 text-2xl font-bold tracking-tight">{copy.title}</h1>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/55">{copy.body}</p>
      {copy.cta && onFix && (
        <div className="mt-6 w-full max-w-xs">
          <Button full onClick={() => void onFix()}>
            {copy.cta}
          </Button>
        </div>
      )}
      <Link href="/app/settings" className="mt-3 text-sm font-medium text-white/45 underline-offset-4 hover:underline">
        Open settings
      </Link>
    </div>
  );
}

function greeting(h: number) {
  if (h < 5) return "Still up";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
