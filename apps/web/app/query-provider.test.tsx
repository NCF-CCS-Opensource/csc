// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { useQuery } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryProvider } from "./query-provider";

// The persister writes to localStorage on a debounce; flush it instead of
// asserting on React Query's own persistence internals.
const PERSIST_DEBOUNCE_MS = 1_100;

// jsdom (as configured by this project's vitest setup) doesn't implement
// window.localStorage, so stand in a real in-memory Storage so the
// persister under test has something to read/write.
class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length() {
    return this.store.size;
  }
  clear() {
    this.store.clear();
  }
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  key(index: number) {
    return [...this.store.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
}

beforeEach(() => {
  Object.defineProperty(window, "localStorage", {
    value: new MemoryStorage(),
    configurable: true,
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function Probe({ queryKey, label }: Readonly<{ queryKey: string[]; label: string }>) {
  const { data } = useQuery({
    queryKey,
    queryFn: () => Promise.resolve(label),
  });
  return <div data-testid="probe">{data ?? "loading"}</div>;
}

describe("QueryProvider", () => {
  it("shows a previously-cached value immediately, before the queryFn resolves again", async () => {
    // Seed a first mount, let it fetch and persist, then unmount so a
    // "reload" mounts a fresh QueryProvider/QueryClient reading only from
    // localStorage.
    const first = render(
      <QueryProvider>
        <Probe queryKey={["probe"]} label="from cache" />
      </QueryProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("probe")).toHaveTextContent("from cache"));
    await new Promise((resolve) => setTimeout(resolve, PERSIST_DEBOUNCE_MS));
    first.unmount();

    // A queryFn that hangs until the test resolves it, so a cached value
    // rendering before this resolves proves it came from the persisted
    // cache, not from a completed refetch.
    let resolveRefetch!: (value: string) => void;
    const refetchPromise = new Promise<string>((resolve) => {
      resolveRefetch = resolve;
    });
    const queryFn = vi.fn(() => refetchPromise);
    function ReloadedProbe() {
      // staleTime: 0 stands in for time having passed since the value was
      // persisted (a real reload is rarely within the default 30s
      // staleTime) — it's what makes React Query's normal
      // stale-while-revalidate behavior kick off a background refetch here.
      const { data } = useQuery({ queryKey: ["probe"], queryFn, staleTime: 0 });
      return <div data-testid="probe">{data ?? "loading"}</div>;
    }

    render(
      <QueryProvider>
        <ReloadedProbe />
      </QueryProvider>,
    );

    // The restored cache value renders while the background refetch is
    // still in flight (queryFn's promise hasn't resolved yet).
    await waitFor(() => expect(screen.getByTestId("probe")).toHaveTextContent("from cache"));

    // Background revalidation still occurs after the cached value is shown.
    expect(queryFn).toHaveBeenCalled();
    resolveRefetch("refetched");
  });
});
