// What solc reports for a contract's sequential storage. Everything namespaced (Ownable, Pausable, the guard) is not in
// it and cannot shift.
export type StorageEntry = { label: string; slot: string; offset: number; type: string };
export type StorageLayout = { storage: StorageEntry[]; types: Record<string, { label: string }> | null };

const GAP = "__gap";

/** The readable type: solc's ids carry AST numbers, which change between compilations of the same source. */
const typeLabel = (layout: StorageLayout, type: string) => layout.types?.[type]?.label ?? type;

/** The slot just after `__gap`, or null when the layout has none. */
const gapEnd = (layout: StorageLayout) => {
  const gap = layout.storage.find(({ label }) => label === GAP);
  if (!gap) return null;
  const size = typeLabel(layout, gap.type).match(/\[(\d+)\]$/)?.[1];
  return size === undefined ? null : Number(gap.slot) + Number(size);
};

/**
 * Why `next` cannot replace `current` behind the same proxy, empty when it can. Every variable must stay in its slot
 * with its name and type; new variables may only take room from `__gap`, whose end must not move. The proxy keeps its
 * storage through an upgrade, so anything else makes the new code read other data under the old slots.
 */
export const storageLayoutProblems = (current: StorageLayout, next: StorageLayout) => {
  const problems = current.storage.flatMap(({ label, slot, offset, type }) => {
    if (label === GAP) return [];
    const match = next.storage.find(entry => entry.slot === slot && entry.offset === offset);
    if (!match) return [`${label} (slot ${slot}) is gone`];
    if (match.label !== label) return [`slot ${slot} held ${label}, now ${match.label}`];
    const before = typeLabel(current, type);
    const after = typeLabel(next, match.type);
    return before === after ? [] : [`${label} (slot ${slot}) changed from ${before} to ${after}`];
  });

  const kept = new Set(current.storage.map(({ slot, offset }) => `${slot}:${offset}`));
  const end = gapEnd(current);
  if (end !== null) {
    const nextEnd = gapEnd(next);
    if (nextEnd !== end) problems.push(`__gap ends at slot ${nextEnd ?? "nowhere"}, was ${end}`);
  }
  // A new variable has to sit inside the old gap, past everything the old layout used.
  const gap = current.storage.find(({ label }) => label === GAP);
  for (const { label, slot, offset } of next.storage) {
    if (label === GAP || kept.has(`${slot}:${offset}`)) continue;
    if (!gap || Number(slot) < Number(gap.slot)) problems.push(`${label} (slot ${slot}) is not in the old __gap`);
  }
  return problems;
};
