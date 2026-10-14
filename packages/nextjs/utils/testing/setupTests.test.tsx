// @vitest-environment jsdom
import { act, useEffect, useState } from "react";
import { render, renderHook, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const actGlobal = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };

const reactErrors = () => {
  const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  return () => spy.mock.calls.map(([message]) => String(message));
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("jsdom test setup", () => {
  it("unmounts what the previous test rendered", () => {
    render(<p>first</p>);
    expect(screen.getByText("first")).toBeDefined();
  });

  it("starts from an empty document", () => {
    expect(document.body.innerHTML).toBe("");
  });

  it("enables React's act environment", () => {
    expect(actGlobal.IS_REACT_ACT_ENVIRONMENT).toBe(true);
  });

  it("supports act imported from react", async () => {
    const errors = reactErrors();
    const { result } = renderHook(() => useState(0));

    await act(async () => result.current[1](1));

    expect(result.current[0]).toBe(1);
    expect(errors()).toEqual([]);
  });

  it("reports state updates that escape act", async () => {
    const errors = reactErrors();
    const Late = () => {
      const [text, setText] = useState("before");
      useEffect(() => {
        const timer = setTimeout(() => setText("after"), 0);
        return () => clearTimeout(timer);
      }, []);
      return <p>{text}</p>;
    };
    render(<Late />);

    // Poll by hand: waitFor would wrap the update in act and hide the warning under test.
    for (let attempt = 0; attempt < 100 && !screen.queryByText("after"); attempt++) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    expect(screen.getByText("after")).toBeDefined();
    expect(errors()).toEqual([expect.stringContaining("not wrapped in act(...)")]);
  });
});
