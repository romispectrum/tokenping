import { useRef, useState } from "react";
import { skipToken, useQuery, useQueryClient } from "@tanstack/react-query";
import { normalizeAddress } from "~~/utils/address";

/** Set once this browser has shown the prompt. It names no wallet: the question goes to the person, once. */
const STORAGE_KEY = "tokenping:attribution-asked";

/** Whether this browser already showed the attribution prompt. Storage errors read as "not yet". */
export const wasAttributionPrompted = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
};

/** Best effort: when storage is blocked or full, the query cache below still asks only once per page load. */
export const markAttributionPrompted = () => {
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // Nothing to do; see above.
  }
};

/**
 * The prompt for this page load: undefined until it is offered, the lowercased wallet it is open for, then null once
 * closed. It is kept in the query cache, never fetched, rather than in the card, because a positions refresh or a
 * chain switch remounts the card and the prompt must still be there. gcTime Infinity keeps it for the whole page load.
 */
const PROMPT_QUERY_KEY = ["attributionPrompt"] as const;

/**
 * The "How did you hear about Tokenping?" prompt: offered after a successful alert save and shown at most once per
 * browser. It counts as shown as soon as it opens, so a reload or leaving the site ends it; until then it stays open
 * in the wallet's card, across remounts, until Send or Skip.
 *
 * Focus: the prompt replaces the edit form whose Save button had focus, so `focusOnShow` asks it to take focus when it
 * appears in the card that saved (not in a card remounted by a refresh). `close` moves focus to the element behind
 * `returnFocusRef` (the card's Edit button), since the prompt's own buttons disappear with it.
 */
export const useAttributionPrompt = (address: string | undefined) => {
  const queryClient = useQueryClient();
  const owner = address ? normalizeAddress(address) : null;
  const { data: openFor } = useQuery<string | null>({
    queryKey: PROMPT_QUERY_KEY,
    queryFn: skipToken,
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const [focusOnShow, setFocusOnShow] = useState(false);
  const returnFocusRef = useRef<HTMLButtonElement>(null);

  const offer = () => {
    if (!owner) return;
    // Read the cache, not the render: the save that calls this was awaited.
    const current = queryClient.getQueryData<string | null>(PROMPT_QUERY_KEY);
    if (current === undefined) {
      if (wasAttributionPrompted()) return;
      markAttributionPrompted();
      queryClient.setQueryData(PROMPT_QUERY_KEY, owner);
    } else if (current !== owner) {
      return;
    }
    setFocusOnShow(true);
  };

  const close = () => {
    returnFocusRef.current?.focus();
    setFocusOnShow(false);
    queryClient.setQueryData(PROMPT_QUERY_KEY, null);
  };

  return { isOpen: owner !== null && openFor === owner, focusOnShow, offer, close, returnFocusRef };
};
