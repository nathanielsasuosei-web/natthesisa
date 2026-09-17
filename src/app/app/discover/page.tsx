import { deckState } from "@/lib/discover";
import { requireUser } from "@/lib/session";
import SwipeDeck from "@/components/SwipeDeck";

export const dynamic = "force-dynamic";

/**
 * Discover. The deck itself is computed server-side (preferences, seen people,
 * plan allowances) and handed over as plain data; every swipe then goes back
 * through POST /api/discover/swipe before it counts.
 */
export default async function DiscoverPage() {
  const user = await requireUser();
  const deck = deckState(user);
  return (
    <SwipeDeck
      deck={deck}
      firstName={user.name}
      hour={new Date().getUTCHours()}
      hidden={!user.settings.privacy.discoverable}
      suspended={Boolean(user.suspended)}
    />
  );
}
