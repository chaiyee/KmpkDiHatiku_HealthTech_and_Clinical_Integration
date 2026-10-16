import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { cleanup, render, waitFor, act } from "@testing-library/react";
import { StoreProvider, useStore } from "./store";
import { generateSampleData } from "./sample-data";
import { accountKey, emptyAccount } from "./persistence";
const mock = vi.hoisted(() => ({
  auth: undefined as undefined | ((event: string, session: unknown) => void),
  rows: new Map<string, { data: unknown; updated_at: string }>(),
  writes: [] as unknown[],
  conflict: false,
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: async () => ({ data: { user: null } }),
      onAuthStateChange: (callback: typeof mock.auth) => {
        mock.auth = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      },
    },
    from: () => {
      let id = "";
      let version = "";
      let payload: unknown;
      const query = {
        select: (_columns: string) =>
          payload
            ? Promise.resolve({ data: mock.conflict ? [] : [{ updated_at: "new" }], error: null })
            : query,
        eq: (field: string, value: string) => {
          if (field === "user_id") id = value;
          else version = value;
          return query;
        },
        maybeSingle: async () => ({ data: mock.rows.get(id) ?? null, error: null }),
        insert: async (value: unknown) => {
          mock.writes.push(value);
          return { error: null };
        },
        update: (value: unknown) => {
          payload = value;
          mock.writes.push({ value, version });
          return query;
        },
      };
      return query;
    },
  },
}));
let store: ReturnType<typeof useStore>;
function Probe() {
  store = useStore();
  return <span>{store.data?.patient.name}</span>;
}
beforeEach(() => {
  localStorage.clear();
  mock.rows.clear();
  mock.writes = [];
  mock.conflict = false;
});
afterEach(cleanup);
const signIn = (id: string) =>
  act(() => mock.auth?.("SIGNED_IN", { user: { id, email: `${id}@example.com` } }));
describe("account cache isolation", () => {
  it("switches A to B and restores the legacy guest cache on sign-out", async () => {
    const sample = generateSampleData();
    sample.patient.name = "Guest";
    localStorage.setItem(accountKey(null), JSON.stringify(sample));
    for (const id of ["a", "b"]) {
      const data = emptyAccount(sample);
      data.patient.name = id;
      mock.rows.set(id, { data, updated_at: "2026-10-16T00:00:00Z" });
    }
    render(
      <StoreProvider>
        <Probe />
      </StoreProvider>,
    );
    await waitFor(() => expect(store.data?.patient.name).toBe("Guest"));
    signIn("a");
    await waitFor(() => expect(store.data?.patient.name).toBe("a"));
    signIn("b");
    await waitFor(() => expect(store.data?.patient.name).toBe("b"));
    act(() => mock.auth?.("SIGNED_OUT", null));
    await waitFor(() => expect(store.data?.patient.name).toBe("Guest"));
    expect(JSON.parse(localStorage.getItem(accountKey("a"))!).patient.name).toBe("a");
    expect(mock.writes).toEqual([]);
  });
  it("retains offline local changes when the cloud version differs", async () => {
    const sample = emptyAccount(generateSampleData());
    sample.patient.name = "Offline";
    localStorage.setItem(accountKey("a"), JSON.stringify(sample));
    localStorage.setItem(`${accountKey("a")}:dirty`, "true");
    localStorage.setItem(`${accountKey("a")}:version`, "old");
    mock.rows.set("a", {
      data: { ...sample, patient: { ...sample.patient, name: "Cloud" } },
      updated_at: "new",
    });
    render(
      <StoreProvider>
        <Probe />
      </StoreProvider>,
    );
    signIn("a");
    await waitFor(() => expect(store.syncState).toBe("error"));
    expect(store.data?.patient.name).toBe("Offline");
    expect(mock.writes).toEqual([]);
  });
});
