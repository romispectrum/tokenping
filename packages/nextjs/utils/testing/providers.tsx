import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type RenderHookOptions, type RenderOptions, render, renderHook } from "@testing-library/react";

type ProviderOptions = {
  /** Pass the same client to several renders to share one cache, or to seed and inspect it. */
  queryClient?: QueryClient;
};

// No retries, so a rejected fetch surfaces as an error at once; no garbage collection, so no timer outlives a test.
export const createTestQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });

const createWrapper = (queryClient: QueryClient) => {
  const TestProviders = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return TestProviders;
};

export const renderWithProviders = (
  ui: ReactNode,
  {
    queryClient = createTestQueryClient(),
    ...options
  }: ProviderOptions & Omit<RenderOptions, "wrapper" | "queries"> = {},
) => ({ queryClient, ...render(ui, { ...options, wrapper: createWrapper(queryClient) }) });

export const renderHookWithProviders = <Result, Props>(
  hook: (initialProps: Props) => Result,
  {
    queryClient = createTestQueryClient(),
    ...options
  }: ProviderOptions & Omit<RenderHookOptions<Props>, "wrapper" | "queries"> = {},
) => ({ queryClient, ...renderHook(hook, { ...options, wrapper: createWrapper(queryClient) }) });
