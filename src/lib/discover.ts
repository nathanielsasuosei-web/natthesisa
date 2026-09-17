/**
 * The Discover deck.
 *
 * One module owns everything the swiping screen needs: who is shown, in what
 * order, what a swipe does to the plan's allowances, and how a swipe can be
 * taken back. The API routes stay thin and the phone UI never decides for
 * itself whether a like is allowed.
 *
 * Rules, all enforced here:
 *   · you are never shown someone you already matched with or passed
 *   · preferences (gender, age range, distance) filter the deck; if that
 *     leaves nobody, the deck widens rather than showing an empty screen
 *   · a like is only a match when the spark is mutual (score ≥ MUTUAL_AT)
 *   · likes spend the plan's allowance; new matches need a free match slot
 *   · passes are free, and can be undone one at a time (rewind)
 */
import { getPlan } from "./plans";
import {
  INTEREST_EMOJI,
  type Profile,
  compatibilityFor,
  defaultProfile,
  sharedInterests,
  withinPreferences,
} from "./profile";
import { DISCOVER_POOL, type MatchSeed, candidateOf, seedByName } from "./demo-pool";
import {
  type Match,
  type Swipe,
  type SwipeAction,
  type User,
  consumeAction,
  createMatch,
  ensureUserReady,
  logActivity,
  uid,
} from "./store";

/** Score at which the feeling is mutual in this demo. */
export const MUTUAL_AT = 72;
/** How many cards the client is handed at once. */
export const DECK_SIZE = 4;

export class DiscoverError extends Error {
  code: string;
  status: number;
  constructor(message: string, code = "BAD_REQUEST", status = 400) {
    super(message);
    this.name = "DiscoverError";
    this.code = code;
    this.status = status;
  }
}

export interface DeckInterest {
  tag: string;
  emoji: string;
  shared: boolean;
}

/** A slide is one panel of the card — photo, "about", prompt. */
export interface DeckSlide {
  kind: "photo" | "about" | "prompt";
  emoji: string;
  tone: string;
  title?: string;
  body: string;
}

export interface DeckCard {
  name: string;
  age: number;
  gender: string;
  city: string;
  distanceKm: number;
  bio: string;
  job: string;
  emoji: string;
  tone: string;
  interests: DeckInterest[];
  sharedCount: number;
  compatibility: number;
  prompt: { q: string; a: string };
  slides: DeckSlide[];
  fitsPrefs: boolean;
}

export interface DeckState {
  cards: DeckCard[];
  likesUsed: number;
  likeLimit: number | null;
  likesLeft: number | null;
  matchesUsed: number;
  matchLimit: number | null;
  passedCount: number;
  canSwipe: boolean;
  blockedReason: "LIKE_LIMIT" | "MATCH_LIMIT" | null;
}

function seenNames(user: User): Set<string> {
  const seen = new Set<string>();
  for (const match of user.matches) seen.add(match.name.toLowerCase());
  for (const swipe of user.swipes ?? []) seen.add(swipe.name.toLowerCase());
  return seen;
}

function rank(user: User): { seed: MatchSeed; score: number; fits: boolean }[] {
  const profile = user.profile ?? defaultProfile();
  const seen = seenNames(user);
  return DISCOVER_POOL.filter((seed) => !seen.has(seed.name.toLowerCase()))
    .map((seed) => ({
      seed,
      score: compatibilityFor(profile, candidateOf(seed), seed.compatibility),
      fits: withinPreferences(profile, candidateOf(seed)).ok,
    }))
    .sort((a, b) => Number(b.fits) - Number(a.fits) || b.score - a.score);
}

function cardFor(profile: Profile, seed: MatchSeed, score: number, fits: boolean): DeckCard {
  const shared = new Set(sharedInterests(profile.interests, seed.interests).map((t) => t.toLowerCase()));
  const interests = seed.interests.map((tag) => ({
    tag,
    emoji: INTEREST_EMOJI[tag.toLowerCase()] ?? "💫",
    shared: shared.has(tag.toLowerCase()),
  }));
  return {
    name: seed.name,
    age: seed.age,
    gender: seed.gender,
    city: seed.city,
    distanceKm: seed.distanceKm,
    bio: seed.bio,
    job: seed.job,
    emoji: seed.emoji,
    tone: seed.tone,
    interests,
    sharedCount: shared.size,
    compatibility: score,
    prompt: seed.prompt,
    fitsPrefs: fits,
    slides: [
      { kind: "photo", emoji: seed.emoji, tone: seed.tone, body: `${seed.job} · ${seed.city}` },
      { kind: "about", emoji: seed.emoji, tone: shiftTone(seed.tone), title: "A bit about me", body: seed.bio },
      {
        kind: "prompt",
        emoji: seed.emoji,
        tone: shiftTone(seed.tone, 2),
        title: seed.prompt.q,
        body: seed.prompt.a,
      },
    ],
  };
}

/** Tonal variation so the three slides read as a set. */
const TONES = [
  "from-amber-400 via-rose-500 to-fuchsia-600",
  "from-emerald-400 via-teal-500 to-cyan-600",
  "from-fuchsia-400 via-purple-500 to-indigo-600",
  "from-sky-400 via-cyan-500 to-teal-600",
  "from-rose-400 via-orange-400 to-amber-500",
  "from-lime-400 via-emerald-500 to-teal-600",
  "from-indigo-400 via-violet-500 to-purple-600",
  "from-pink-400 via-rose-500 to-orange-400",
  "from-violet-400 via-fuchsia-500 to-rose-500",
  "from-cyan-400 via-sky-500 to-indigo-600",
  "from-amber-400 via-pink-500 to-purple-600",
  "from-orange-400 via-rose-500 to-red-600",
];

function shiftTone(tone: string, steps = 1): string {
  const idx = TONES.indexOf(tone);
  if (idx === -1) return tone;
  return TONES[(idx + steps) % TONES.length];
}

/** Counters + the visible deck, in one call. */
export function deckState(user: User): DeckState {
  ensureUserReady(user);
  const profile = user.profile ?? defaultProfile();
  const plan = getPlan(user.subscription.planId);
  const ranked = rank(user);
  const likesLeft =
    plan.limits.likesPerPeriod === null ? null : Math.max(plan.limits.likesPerPeriod - user.usage.count, 0);
  const matchSlotsLeft = plan.limits.matches === null ? Infinity : plan.limits.matches - user.matches.length;
  const likeLimitReached = likesLeft !== null && likesLeft <= 0;
  const matchLimitReached = matchSlotsLeft <= 0;
  return {
    cards: ranked.slice(0, DECK_SIZE).map(({ seed, score, fits }) => cardFor(profile, seed, score, fits)),
    likesUsed: user.usage.count,
    likeLimit: plan.limits.likesPerPeriod,
    likesLeft,
    matchesUsed: user.matches.length,
    matchLimit: plan.limits.matches,
    passedCount: (user.swipes ?? []).filter((s) => s.action === "pass").length,
    canSwipe: !likeLimitReached && !matchLimitReached,
    blockedReason: likeLimitReached ? "LIKE_LIMIT" : matchLimitReached ? "MATCH_LIMIT" : null,
  };
}

/** The single card on top of the deck (used by the server-side "like next" route). */
export function topOfDeck(user: User): DeckCard | null {
  return deckState(user).cards[0] ?? null;
}

export interface SwipeResult extends DeckState {
  matched: Match | null;
  mutual: boolean;
  note: string;
}

/**
 * Record a swipe on a named profile and return the fresh deck state, so the
 * client can update its meters without a second round trip.
 */
export function swipe(user: User, rawName: unknown, action: SwipeAction): SwipeResult {
  ensureUserReady(user);
  const plan = getPlan(user.subscription.planId);
  const name = String(rawName ?? "").trim();
  const seed = seedByName(name);
  if (!seed)
    throw new DiscoverError("Nobody by that name is in the deck any more.", "NO_SUCH_PROFILE", 404);
  if (seenNames(user).has(seed.name.toLowerCase()))
    throw new DiscoverError("You've already swiped on that one.", "ALREADY_SEEN", 409);

  if (action === "pass") {
    pushSwipe(user, {
      id: uid(),
      name: seed.name,
      action,
      matchId: null,
      ts: new Date().toISOString(),
    });
    return { ...deckState(user), matched: null, mutual: false, note: `Passed on ${seed.name}.` };
  }

  // likes and super-likes are metered, and a match needs a free slot
  if (plan.limits.matches !== null && user.matches.length >= plan.limits.matches) {
    throw new DiscoverError(
      `The ${plan.name} plan holds ${plan.limits.matches} active matches. Unmatch someone or upgrade to keep meeting people.`,
      "MATCH_LIMIT",
      402
    );
  }
  if (!consumeAction(user)) {
    throw new DiscoverError(
      `You've used all ${plan.limits.likesPerPeriod?.toLocaleString("en-US")} likes in this billing period. Upgrade for more.`,
      "LIKE_LIMIT",
      402
    );
  }

  const profile = user.profile ?? defaultProfile();
  const score = compatibilityFor(profile, candidateOf(seed), seed.compatibility);
  const mutual = action === "super" || score >= MUTUAL_AT;

  let match: Match | null = null;
  let note: string;
  if (mutual) {
    match = createMatch(user, seed);
    if (action === "super") match.compatibility = Math.min(99, match.compatibility + 3);
    user.matches.push(match);
    note =
      action === "super"
        ? `Super-like landed — ${seed.name} thought that was bold 💘`
        : `It's a match — you and ${seed.name} liked each other 💘`;
    logActivity(user, note);
  } else {
    note = `Like sent to ${seed.name}. If they like you back, they'll show up under Matches.`;
    logActivity(user, note);
  }

  pushSwipe(user, {
    id: uid(),
    name: seed.name,
    action,
    matchId: match?.id ?? null,
    ts: new Date().toISOString(),
  });

  return { ...deckState(user), matched: match, mutual, note };
}

function pushSwipe(user: User, swipe: Swipe): void {
  user.swipes = [...(user.swipes ?? []), swipe];
  if (user.swipes.length > 300) user.swipes.shift();
}

/** Take the last swipe back: the like is refunded and the match (if any) undone. */
export function rewindLast(user: User): { restored: string | null; note: string } & { deck: DeckState } {
  ensureUserReady(user);
  const last = user.swipes?.[user.swipes.length - 1];
  if (!last) return { restored: null, note: "Nothing to undo yet.", deck: deckState(user) };

  if (last.matchId) {
    const match = user.matches.find((m) => m.id === last.matchId);
    if (match && match.dateIdeas.length > 0) {
      // we won't delete planned dates behind someone's back
      return { restored: null, note: `${last.name} already has date ideas, so that match stays.`, deck: deckState(user) };
    }
    user.matches = user.matches.filter((m) => m.id !== last.matchId);
  }
  user.swipes = user.swipes.slice(0, -1);

  if (last.action !== "pass") {
    user.usage.count = Math.max(0, user.usage.count - 1);
    const today = new Date().toISOString().slice(0, 10);
    const entry = user.usage.history.find((h) => h.date === today);
    if (entry) entry.count = Math.max(0, entry.count - 1);
  }
  logActivity(user, `Took back your swipe on ${last.name}`);
  return { restored: last.name, note: `Back to ${last.name}. No pressure.`, deck: deckState(user) };
}

/** Deck ran dry? Bring everyone you *passed* on back into it. */
export function reshuffleDeck(user: User): { back: number; deck: DeckState } {
  ensureUserReady(user);
  const before = user.swipes?.length ?? 0;
  user.swipes = (user.swipes ?? []).filter((s) => s.action !== "pass");
  const back = before - (user.swipes?.length ?? 0);
  logActivity(user, back > 0 ? `Brought ${back} passed profile${back === 1 ? "" : "s"} back into the deck` : "Deck reset — nothing to bring back");
  return { back, deck: deckState(user) };
}
