/**
 * The single source of truth for the sign-in outage banner.
 *
 * Every sign-in door — the learner form, the admin form, the login API and
 * the owner-setup API — shows this when the database cannot be reached. It
 * lives in one place, with no server-only imports so client components can
 * use it too, so the message can never drift between doors.
 */
export const AUTH_UNAVAILABLE_MESSAGE =
  "Sign-in is temporarily unavailable. Please try again in a moment. If this keeps happening, check the database connection.";

export const AUTH_UNAVAILABLE_CODE = "AUTH_UNAVAILABLE" as const;
