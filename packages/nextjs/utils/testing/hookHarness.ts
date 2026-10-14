import type * as ReactModule from "react";
import type { DependencyList, EffectCallback, FunctionComponent, ReactElement, ReactNode } from "react";
import { createRequire } from "node:module";
import { renderHtml } from "~~/utils/testing/render";

/*
 * STOPGAP, not a pattern to copy: replace with @testing-library/react + happy-dom once Foundation adds them as
 * devDependencies, then delete this file. Until then it is the only way to run hooks and effects here, because the
 * vitest environment is node and no DOM library is installed.
 *
 * A minimal synchronous renderer for client components and hooks. Tests replace React's hooks via
 * `vi.mock("react", ...)` with `withFakeHooks`. The harness keeps hook state per component instance, keyed by tree
 * position. It re-renders until state settles. Like React's commit phase, it runs effects child-first, and runs all
 * cleanups before any new effect. Component output is expanded to host elements, so tests can fire handlers and
 * serialize the output with the real react-dom/server. renderToString pins text-node boundaries too.
 *
 * Differences from React, which do not matter for the components tested with it:
 * - Only useState, useRef, useMemo, useCallback and useEffect are implemented. The other hooks throw.
 * - Re-renders happen only in flush()/act(), so state updates between them are always batched.
 * - act() waits a fixed number of macrotask turns for promises to settle.
 */

// Loaded natively so `vi.mock("react")` in the calling test does not replace it.
const React = createRequire(import.meta.url)("react") as typeof ReactModule;

type StateSlot = { kind: "state"; value: unknown; set: (next: unknown) => void };
type RefSlot = { kind: "ref"; ref: { current: unknown } };
type MemoSlot = { kind: "memo"; value: unknown; deps: DependencyList | undefined };
type EffectSlot = { kind: "effect"; scheduled: boolean; deps: DependencyList | undefined; cleanup?: () => void };
type Slot = StateSlot | RefSlot | MemoSlot | EffectSlot;
type Instance = { slots: Slot[]; cursor: number };
type QueuedEffect = { slot: EffectSlot; effect: EffectCallback };

/** The instance being rendered and the effects its own hooks scheduled in this render. */
let active: { harness: Harness<unknown>; instance: Instance; effects: QueuedEffect[] } | null = null;

const depsChanged = (prev: DependencyList | undefined, next: DependencyList | undefined) =>
  !prev || !next || prev.length !== next.length || prev.some((dep, i) => !Object.is(dep, next[i]));

const activeRender = () => {
  if (!active) throw new Error("Hook called outside a harness render");
  return active;
};

const nextSlot = <T extends Slot>(kind: T["kind"], init: () => T): T => {
  const { instance } = activeRender();
  const index = instance.cursor++;
  instance.slots[index] ??= init();
  const slot = instance.slots[index];
  if (slot.kind !== kind) throw new Error(`Hook order changed: expected ${slot.kind}, got ${kind}`);
  return slot as T;
};

// Named fake* (not use*) because they are hook implementations, not hooks.

const fakeState = <S>(initial: S | (() => S)) => {
  const slot = nextSlot<StateSlot>("state", () => {
    const { harness } = activeRender();
    const created: StateSlot = {
      kind: "state",
      value: typeof initial === "function" ? (initial as () => S)() : initial,
      set: next => {
        if (harness.unmounted) return;
        const value = typeof next === "function" ? (next as (prev: unknown) => unknown)(created.value) : next;
        if (Object.is(value, created.value)) return;
        created.value = value;
        harness.dirty = true;
      },
    };
    return created;
  });
  return [slot.value as S, slot.set as (next: S | ((prev: S) => S)) => void] as const;
};

const fakeRef = <T>(initial: T) =>
  nextSlot<RefSlot>("ref", () => ({ kind: "ref", ref: { current: initial } })).ref as { current: T };

const fakeMemo = <T>(factory: () => T, deps: DependencyList) => {
  const slot = nextSlot<MemoSlot>("memo", () => ({ kind: "memo", value: undefined, deps: undefined }));
  if (depsChanged(slot.deps, deps)) {
    slot.value = factory();
    slot.deps = deps;
  }
  return slot.value as T;
};

const fakeCallback = <T extends (...args: never[]) => unknown>(callback: T, deps: DependencyList) =>
  fakeMemo(() => callback, deps);

const fakeEffect = (effect: EffectCallback, deps?: DependencyList) => {
  const slot = nextSlot<EffectSlot>("effect", () => ({ kind: "effect", scheduled: false, deps: undefined }));
  if (slot.scheduled && deps !== undefined && !depsChanged(slot.deps, deps)) return;
  slot.scheduled = true;
  slot.deps = deps;
  activeRender().effects.push({ slot, effect });
};

const FAKE_HOOKS = {
  useState: fakeState,
  useRef: fakeRef,
  useMemo: fakeMemo,
  useCallback: fakeCallback,
  useEffect: fakeEffect,
};

// Fail loudly instead of falling through to real React, which cannot run outside its own renderer.
const UNSUPPORTED_HOOKS = Object.fromEntries(
  [
    "use",
    "useActionState",
    "useContext",
    "useDebugValue",
    "useDeferredValue",
    "useId",
    "useImperativeHandle",
    "useInsertionEffect",
    "useLayoutEffect",
    "useOptimistic",
    "useReducer",
    "useSyncExternalStore",
    "useTransition",
  ].map(name => [
    name,
    () => {
      throw new Error(`${name} is not supported by the test hook harness`);
    },
  ]),
);

/**
 * The module for `vi.mock("react", async importOriginal => (await import(<this file>)).withFakeHooks(await
 * importOriginal()))`. The fake hooks throw when called outside a harness render.
 */
export const withFakeHooks = <T extends object>(actualReact: T) => ({
  ...actualReact,
  ...UNSUPPORTED_HOOKS,
  ...FAKE_HOOKS,
});

type AnyElement = ReactElement<Record<string, unknown>>;

const childKey = (child: unknown, index: number) =>
  React.isValidElement(child) && child.key !== null ? `${index}:${child.key}` : `${index}`;

const textOf = (node: unknown): string => {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (React.isValidElement(node)) return textOf((node as AnyElement).props.children);
  return "";
};

export class Harness<T> {
  dirty = false;
  unmounted = false;
  private output: T | undefined;
  private readonly instances = new Map<string, Instance>();
  private readonly visited = new Set<string>();
  /** Effects scheduled in the current render pass, children before parents. */
  private pendingEffects: QueuedEffect[] = [];

  constructor(private readonly run: (harness: Harness<T>) => T) {}

  get current() {
    return this.output as T;
  }

  /** Renders, runs effects and re-renders until no state changes. */
  flush() {
    for (let pass = 0; ; pass++) {
      if (pass >= 100) throw new Error("Render loop did not settle");
      this.dirty = false;
      this.renderPass();
      const effects = this.pendingEffects;
      this.pendingEffects = [];
      for (const { slot } of effects) {
        slot.cleanup?.();
        slot.cleanup = undefined;
      }
      for (const { slot, effect } of effects) {
        const cleanup = effect();
        slot.cleanup = typeof cleanup === "function" ? cleanup : undefined;
      }
      if (!this.dirty) return;
    }
  }

  /** Runs `action`, waits for pending promises (fetch bodies included) to settle, then re-renders. */
  async act(action: () => unknown = () => undefined) {
    await action();
    await settle();
    this.flush();
  }

  unmount() {
    for (const instance of this.instances.values()) cleanupInstance(instance);
    this.instances.clear();
    this.unmounted = true;
  }

  expand(node: ReactNode, path: string): ReactNode {
    if (Array.isArray(node)) return node.map((child, i) => this.expand(child, `${path}/${childKey(child, i)}`));
    if (!React.isValidElement(node)) return node;
    const { type, props, key } = node as AnyElement;
    if (typeof type === "function") {
      const componentPath = `${path}<${type.name}>`;
      const { result, effects } = this.withInstance(componentPath, () => (type as FunctionComponent)(props));
      const expanded = this.expand(result as ReactNode, componentPath);
      this.pendingEffects.push(...effects);
      return expanded;
    }
    const { children, ...rest } = props;
    const expandedChildren =
      children === undefined
        ? []
        : Array.isArray(children)
          ? children.map((child, i) => this.expand(child, `${path}/${childKey(child, i)}`))
          : [this.expand(children as ReactNode, `${path}/0`)];
    return React.createElement(type, key === null ? rest : { ...rest, key }, ...expandedChildren);
  }

  /** Renders one instance and returns the effects its own hooks scheduled. */
  private withInstance<R>(path: string, render: () => R) {
    let instance = this.instances.get(path);
    if (!instance) {
      instance = { slots: [], cursor: 0 };
      this.instances.set(path, instance);
    }
    instance.cursor = 0;
    this.visited.add(path);
    const previous = active;
    const effects: QueuedEffect[] = [];
    active = { harness: this as Harness<unknown>, instance, effects };
    try {
      return { result: render(), effects };
    } finally {
      active = previous;
    }
  }

  private renderPass() {
    this.visited.clear();
    const { result, effects } = this.withInstance("root", () => this.run(this));
    this.output = result;
    this.pendingEffects.push(...effects);
    for (const [path, instance] of this.instances) {
      if (this.visited.has(path)) continue;
      cleanupInstance(instance);
      this.instances.delete(path);
    }
  }
}

const cleanupInstance = (instance: Instance) => {
  for (const slot of instance.slots) {
    if (slot.kind === "effect") {
      slot.cleanup?.();
      slot.cleanup = undefined;
    }
  }
};

/** Waits several macrotask turns so chained promises (e.g. `await res.json()`) resolve. Needs real setImmediate. */
const settle = async () => {
  for (let i = 0; i < 5; i++) await new Promise(resolve => setImmediate(resolve));
};

export const renderHook = <T>(hook: () => T) => {
  const harness = new Harness(() => hook());
  harness.flush();
  return harness;
};

export class ComponentHarness<P extends object> extends Harness<ReactNode> {
  constructor(
    Component: FunctionComponent<P>,
    public props: P,
  ) {
    super(harness => harness.expand(React.createElement(Component, (harness as ComponentHarness<P>).props), "root"));
  }

  setProps(props: Partial<P>) {
    this.props = { ...this.props, ...props };
    this.flush();
  }

  html() {
    return renderHtml(this.current);
  }

  findAll(predicate: (element: AnyElement) => boolean) {
    const found: AnyElement[] = [];
    const walk = (node: unknown) => {
      if (Array.isArray(node)) return node.forEach(walk);
      if (!React.isValidElement(node)) return;
      const element = node as AnyElement;
      if (predicate(element)) found.push(element);
      walk(element.props.children);
    };
    walk(this.current);
    return found;
  }

  /** The single host element of `type` whose text contains `match`, or whose props equal every entry of `match`. */
  get(type: string, match: string | Record<string, unknown>) {
    const matches = this.findAll(
      element =>
        element.type === type &&
        (typeof match === "string"
          ? textOf(element).includes(match)
          : Object.entries(match).every(([name, value]) => element.props[name] === value)),
    );
    if (matches.length !== 1)
      throw new Error(`Expected one <${type}> matching ${JSON.stringify(match)}, found ${matches.length}`);
    return matches[0];
  }
}

/** Like a browser, clicking a disabled control does nothing. */
export const click = (element: AnyElement) => {
  if (element.props.disabled) return undefined;
  return (element.props.onClick as ((event: unknown) => unknown) | undefined)?.({});
};

export const changeValue = (element: AnyElement, value: string) =>
  (element.props.onChange as (event: unknown) => unknown)({ target: { value } });

export const blur = (element: AnyElement) => (element.props.onBlur as (event: unknown) => unknown)({});

export const keyDown = (element: AnyElement, key: string) => {
  let prevented = false;
  (element.props.onKeyDown as (event: unknown) => unknown)({
    key,
    preventDefault: () => {
      prevented = true;
    },
  });
  return prevented;
};
