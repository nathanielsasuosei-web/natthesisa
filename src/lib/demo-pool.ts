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
}

/** Pool of demo singles used when the user taps "Discover". */
export const DISCOVER_POOL: MatchSeed[] = [
  { name: "Ama", age: 27, bio: "Sunset chaser, amateur baker, will beat you at Scrabble.", emoji: "🌅", compatibility: 88, gender: "woman", city: "Accra", distanceKm: 6, interests: ["Beach days", "Cooking", "Board games", "Photography"] },
  { name: "Kwame", age: 31, bio: "Runs at dawn, reads at dusk. Looking for a plus-one to jollof festivals.", emoji: "🏃", compatibility: 80, gender: "man", city: "Accra", distanceKm: 14, interests: ["Running", "Jollof debates", "Reading", "Live music"] },
  { name: "Efua", age: 25, bio: "Painter with paint on everything I own. Ask me about my cat, Palette.", emoji: "🎨", compatibility: 85, gender: "woman", city: "Tema", distanceKm: 26, interests: ["Painting", "Poetry", "Pets", "Fashion"] },
  { name: "Kofi", age: 29, bio: "Live-music nerd. I know every open-mic night in town.", emoji: "🎸", compatibility: 76, gender: "man", city: "Accra", distanceKm: 9, interests: ["Live music", "Karaoke", "Film buff", "Football"] },
  { name: "Adjoa", age: 26, bio: "Marine biologist. Yes, I will talk about octopuses on the first date.", emoji: "🐙", compatibility: 90, gender: "woman", city: "Cape Coast", distanceKm: 132, interests: ["Hiking", "Reading", "Volunteering", "Stargazing"] },
  { name: "Yaw", age: 33, bio: "Chef who cooks better on dates than at work. Prove me wrong.", emoji: "👨‍🍳", compatibility: 79, gender: "man", city: "Accra", distanceKm: 4, interests: ["Cooking", "Street food", "Wine nights", "Travel"] },
  { name: "Abena", age: 28, bio: "Trail hiker and cloud photographer. Golden hour is my love language.", emoji: "⛰️", compatibility: 84, gender: "woman", city: "Kumasi", distanceKm: 232, interests: ["Hiking", "Photography", "Yoga", "Gardening"] },
  { name: "Kojo", age: 30, bio: "Board-game hoarder. My shelf is a red flag and I own it.", emoji: "🎲", compatibility: 73, gender: "man", city: "Accra", distanceKm: 17, interests: ["Board games", "Film buff", "Startups", "Coffee"] },
  { name: "Esi", age: 24, bio: "Poet, plant mom, professional overthinker of texts.", emoji: "🌿", compatibility: 87, gender: "woman", city: "Takoradi", distanceKm: 275, interests: ["Poetry", "Gardening", "Reading", "Faith"] },
  { name: "Nana", age: 32, bio: "Salsa on Fridays, brunch on Sundays, kindness always.", emoji: "💃", compatibility: 82, gender: "woman", city: "Accra", distanceKm: 8, interests: ["Dancing", "Travel", "Wine nights", "Cooking"] },
  { name: "Fiifi", age: 29, bio: "Startups by day, surf lessons by weekend. Two good hobbies, one bad habit.", emoji: "🏄", compatibility: 74, gender: "man", city: "Tema", distanceKm: 31, interests: ["Startups", "Beach days", "Gym", "Coffee"] },
  { name: "Adwoa", age: 35, bio: "Nurse, choir alto, firm believer that dessert comes before the small talk.", emoji: "🎶", compatibility: 83, gender: "woman", city: "Kumasi", distanceKm: 230, interests: ["Live music", "Faith", "Cooking", "Volunteering"] },
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
