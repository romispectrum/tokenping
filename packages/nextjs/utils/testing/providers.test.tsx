// @vitest-environment jsdom
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createTestQueryClient, renderHookWithProviders, renderWithProviders } from "~~/utils/testing/providers";

const GREETING_KEY = ["greeting"];

const Greeting = ({ fetchGreeting }: { fetchGreeting: () => Promise<string> }) => {
  const queryClient = useQueryClient();
  const [clicks, setClicks] = useState(0);
  const { data, isPending, isError } = useQuery({ queryKey: GREETING_KEY, queryFn: fetchGreeting });
  const { mutate } = useMutation({
    mutationFn: async (next: string) => next,
    onSuccess: next => queryClient.setQueryData(GREETING_KEY, next),
  });

  if (isPending) return <p>Loading</p>;
  if (isError) return <p role="alert">Failed</p>;
  return (
    <div>
      <p>{data}</p>
      <p>Clicks: {clicks}</p>
      <button
        onClick={() => {
          setClicks(count => count + 1);
          mutate("Bye");
        }}
      >
        Change
      </button>
    </div>
  );
};

describe("createTestQueryClient", () => {
  it("disables retries and garbage collection for queries", () => {
    expect(createTestQueryClient().getDefaultOptions().queries).toEqual({ retry: false, gcTime: Infinity });
  });
});

describe("renderWithProviders", () => {
  it("runs real React state and react-query in jsdom", async () => {
    const fetchGreeting = vi.fn().mockResolvedValue("Hello");
    const { queryClient } = renderWithProviders(<Greeting fetchGreeting={fetchGreeting} />);

    expect(screen.getByText("Loading")).toBeDefined();
    expect(await screen.findByText("Hello")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Change" }));

    expect(await screen.findByText("Bye")).toBeDefined();
    expect(screen.getByText("Clicks: 1")).toBeDefined();
    expect(queryClient.getQueryData(GREETING_KEY)).toBe("Bye");
    expect(fetchGreeting).toHaveBeenCalledTimes(1);
  });

  it("starts from an empty document: the previous test's tree was cleaned up", () => {
    expect(document.body.innerHTML).toBe("");
  });

  it("surfaces a failed query at once instead of retrying", async () => {
    const fetchGreeting = vi.fn().mockRejectedValue(new Error("boom"));
    renderWithProviders(<Greeting fetchGreeting={fetchGreeting} />);

    expect((await screen.findByRole("alert")).textContent).toBe("Failed");
    expect(fetchGreeting).toHaveBeenCalledTimes(1);
  });

  it("gives every render a fresh cache unless a client is passed in", async () => {
    const first = renderWithProviders(<Greeting fetchGreeting={async () => "Hello"} />);
    await screen.findByText("Hello");
    first.unmount();

    const fresh = renderWithProviders(<Greeting fetchGreeting={async () => "Fresh"} />);
    expect(fresh.queryClient).not.toBe(first.queryClient);
    expect(await screen.findByText("Fresh")).toBeDefined();
    fresh.unmount();

    const fetchGreeting = vi.fn().mockResolvedValue("Refetched");
    renderWithProviders(<Greeting fetchGreeting={fetchGreeting} />, { queryClient: first.queryClient });
    expect(screen.getByText("Hello")).toBeDefined();
    expect(await screen.findByText("Refetched")).toBeDefined();
  });
});

describe("renderHookWithProviders", () => {
  it("renders a hook inside a QueryClientProvider and returns its client", async () => {
    const queryFn = vi.fn().mockResolvedValue(42);
    const { result, queryClient } = renderHookWithProviders(() => useQuery({ queryKey: ["answer"], queryFn }));

    expect(result.current.isPending).toBe(true);
    await waitFor(() => expect(result.current.data).toBe(42));
    expect(queryClient.getQueryData(["answer"])).toBe(42);
  });

  it("passes initialProps and rerenders with new props", async () => {
    const { result, rerender } = renderHookWithProviders(
      ({ id }: { id: number }) => useQuery({ queryKey: ["item", id], queryFn: async () => `item ${id}` }),
      { initialProps: { id: 1 } },
    );

    await waitFor(() => expect(result.current.data).toBe("item 1"));
    rerender({ id: 2 });
    await waitFor(() => expect(result.current.data).toBe("item 2"));
  });
});
