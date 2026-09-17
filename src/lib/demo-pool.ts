/**
 * The demo singles pool.
 *
 * Lives in its own module (rather than lib/store.ts) because the profile preview
 * needs it in the browser, and store.ts pulls in password hashing — which is
 * server-only. Nothing here may import Node built-ins.
 */
import type { CandidateProfile, Gender } from "./profile";

export interface MatchSeed {
  name: string;
  age: number;
  bio: string;
  emoji: string;
  /** baseline affinity before shared interests and preferences adjust it */
  compatibility: number;
  gender: Gender;
  city: string;
  distanceKm: number;
  interests: string[];
  /** tailwind gradient stops for the card art (the pool has no real photos) */
  tone: string;
  /** one-line "what I do" shown under the name */
  job: string;
  /** Hinge-style prompt answer shown on the back of the card */
  prompt: { q: string; a: string };
}

/** Pool of demo singles used when the user taps "Discover". */
export const DISCOVER_POOL: MatchSeed[] = [
  { name: "Ama", age: 27, bio: "Sunset chaser, amateur baker, will beat you at Scrabble.", emoji: "🌅", compatibility: 88, gender: "woman", city: "Accra", distanceKm: 6, interests: ["Beach days", "Cooking", "Board games", "Photography"], tone: "from-amber-400 via-rose-500 to-fuchsia-600", job: "Pastry chef", prompt: { q: "My simplest pleasure", a: "Warm dough, cold sea air" } },
  { name: "Kwame", age: 31, bio: "Runs at dawn, reads at dusk. Looking for a plus-one to jollof festivals.", emoji: "🏃", compatibility: 80, gender: "man", city: "Accra", distanceKm: 14, interests: ["Running", "Jollof debates", "Reading", "Live music"], tone: "from-emerald-400 via-teal-500 to-cyan-600", job: "Banker, 5k runner", prompt: { q: "Together we could", a: "Run the coast road, then eat everything on it" } },
  { name: "Efua", age: 25, bio: "Painter with paint on everything I own. Ask me about my cat, Palette.", emoji: "🎨", compatibility: 85, gender: "woman", city: "Tema", distanceKm: 26, interests: ["Painting", "Poetry", "Pets", "Fashion"], tone: "from-fuchsia-400 via-purple-500 to-indigo-600", job: "Illustrator", prompt: { q: "Never ask me about", a: "My colour palette. Ask anyway" } },
  { name: "Kofi", age: 29, bio: "Live-music nerd. I know every open-mic night in town.", emoji: "🎸", compatibility: 76, gender: "man", city: "Accra", distanceKm: 9, interests: ["Live music", "Karaoke", "Film buff", "Football"], tone: "from-orange-400 via-rose-500 to-red-600", job: "Sound engineer", prompt: { q: "We'll get along if", a: "You have one artist friend and you love them" } },
  { name: "Adjoa", age: 26, bio: "Marine biologist. Yes, I will talk about octopuses on the first date.", emoji: "🐙", compatibility: 90, gender: "woman", city: "Cape Coast", distanceKm: 132, interests: ["Hiking", "Reading", "Volunteering", "Stargazing"], tone: "from-sky-400 via-cyan-500 to-teal-600", job: "Marine biologist", prompt: { q: "A shower thought I had", a: "Octopuses have three hearts. I'm still doing the maths" } },
  { name: "Yaw", age: 33, bio: "Chef who cooks better on dates than at work. Prove me wrong.", emoji: "👨‍🍳", compatibility: 79, gender: "man", city: "Accra", distanceKm: 4, interests: ["Cooking", "Street food", "Wine nights", "Travel"], tone: "from-rose-400 via-orange-400 to-amber-500", job: "Chef", prompt: { q: "My love language", a: "Feeding you, badly, at midnight" } },
  { name: "Abena", age: 28, bio: "Trail hiker and cloud photographer. Golden hour is my love language.", emoji: "⛰️", compatibility: 84, gender: "woman", city: "Kumasi", distanceKm: 232, interests: ["Hiking", "Photography", "Yoga", "Gardening"], tone: "from-lime-400 via-emerald-500 to-teal-600", job: "Landscape architect", prompt: { q: "A perfect day", a: "Cloud photos at 6am, hammock by 4" } },
  { name: "Kojo", age: 30, bio: "Board-game hoarder. My shelf is a red flag and I own it.", emoji: "🎲", compatibility: 73, gender: "man", city: "Accra", distanceKm: 17, interests: ["Board games", "Film buff", "Startups", "Coffee"], tone: "from-indigo-400 via-violet-500 to-purple-600", job: "Product manager", prompt: { q: "Underrated skill", a: "Explaining rules without losing the table" } },
  { name: "Esi", age: 24, bio: "Poet, plant mom, professional overthinker of texts.", emoji: "🌿", compatibility: 87, gender: "woman", city: "Takoradi", distanceKm: 275, interests: ["Poetry", "Gardening", "Reading", "Faith"], tone: "from-pink-400 via-rose-500 to-orange-400", job: "English teacher", prompt: { q: "My most controversial take", a: "Poetry beats a good text message" } },
  { name: "Nana", age: 32, bio: "Salsa on Fridays, brunch on Sundays, kindness always.", emoji: "💃", compatibility: 82, gender: "woman", city: "Accra", distanceKm: 8, interests: ["Dancing", "Travel", "Wine nights", "Cooking"], tone: "from-violet-400 via-fuchsia-500 to-rose-500", job: "Events producer", prompt: { q: "I fall for", a: "People who dance badly and loudly" } },
  { name: "Fiifi", age: 29, bio: "Startups by day, surf lessons by weekend. Two good hobbies, one bad habit.", emoji: "🏄", compatibility: 74, gender: "man", city: "Tema", distanceKm: 31, interests: ["Startups", "Beach days", "Gym", "Coffee"], tone: "from-cyan-400 via-sky-500 to-indigo-600", job: "Founder, surf addict", prompt: { q: "My Monday ritual", a: "Cold ocean, hot coffee, no phone" } },
  { name: "Adwoa", age: 35, bio: "Nurse, choir alto, firm believer that dessert comes before the small talk.", emoji: "🎶", compatibility: 83, gender: "woman", city: "Kumasi", distanceKm: 230, interests: ["Live music", "Faith", "Cooking", "Volunteering"], tone: "from-amber-400 via-pink-500 to-purple-600", job: "Nurse, choir alto", prompt: { q: "Green flag I look for", a: "You call your mother back" } },
];

/** Shape the matching maths needs, from a pool entry. */
export function candidateOf(seed: MatchSeed): CandidateProfile {
  return {
    age: seed.age,
    gender: seed.gender,
    interests: seed.interests,
    city: seed.city,
    country: "Ghana",
    distanceKm: seed.distanceKm,
  };
}

export function seedByName(name: string): MatchSeed | undefined {
  return DISCOVER_POOL.find((s) => s.name.toLowerCase() === name.trim().toLowerCase());
}
