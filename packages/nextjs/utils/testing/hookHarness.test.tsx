import { useEffect, useReducer } from "react";
import { describe, expect, it, vi } from "vitest";
import { ComponentHarness, renderHook } from "~~/utils/testing/hookHarness";

vi.mock("react", async importOriginal =>
  (await import("~~/utils/testing/hookHarness")).withFakeHooks(await importOriginal()),
);

const log: string[] = [];

const useLoggedEffect = (name: string, value: number) =>
  useEffect(() => {
    log.push(`${name} effect ${value}`);
    return () => {
      log.push(`${name} cleanup ${value}`);
    };
  }, [name, value]);

const Child = ({ value }: { value: number }) => {
  useLoggedEffect("child", value);
  return <span>{value}</span>;
};

const Parent = ({ value }: { value: number }) => {
  useLoggedEffect("parent", value);
  return (
    <div>
      <Child value={value} />
    </div>
  );
};

describe("hookHarness", () => {
  it("runs effects in React's commit order", () => {
    log.length = 0;
    const view = new ComponentHarness(Parent, { value: 1 });
    view.flush();
    expect(view.html()).toBe("<div><span>1</span></div>");
    expect(log.splice(0)).toEqual(["child effect 1", "parent effect 1"]);

    view.setProps({ value: 2 });
    expect(log.splice(0)).toEqual(["child cleanup 1", "parent cleanup 1", "child effect 2", "parent effect 2"]);

    view.unmount();
    expect(log.splice(0)).toEqual(["parent cleanup 2", "child cleanup 2"]);
  });

  it("throws for hooks it does not implement", () => {
    expect(() => renderHook(() => useReducer((state: number) => state, 0))).toThrow(
      "useReducer is not supported by the test hook harness",
    );
  });
});
