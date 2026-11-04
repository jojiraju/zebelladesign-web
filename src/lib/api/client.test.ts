import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, friendlyError } from "./client";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

/** Loads the client against a fake backend that always answers with this response. */
async function clientAnswering(response: Response) {
  vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.test");
  vi.stubGlobal("fetch", vi.fn(async () => response));
  vi.resetModules();
  return import("./client");
}

describe("apiJson errors", () => {
  const failure = (path: Promise<unknown>) => path.then(() => { throw new Error("expected a failure"); }, (e) => e as ApiError);

  it("uses the backend's error or FastAPI detail message", async () => {
    let client = await clientAnswering(Response.json({ error: "Sold out." }, { status: 409 }));
    expect((await failure(client.apiJson("/x"))).message).toBe("Sold out.");
    client = await clientAnswering(Response.json({ detail: "Only 1 left" }, { status: 409 }));
    expect((await failure(client.apiJson("/x"))).message).toBe("Only 1 left");
  });
  it("does not show raw validation lists or proxy pages", async () => {
    let client = await clientAnswering(Response.json({ detail: [{ loc: ["body"], msg: "bad" }] }, { status: 422 }));
    expect((await failure(client.apiJson("/x"))).message).toBe("Something went wrong. Please try again.");
    client = await clientAnswering(new Response("<html>Bad gateway</html>", { status: 502 }));
    expect((await failure(client.apiJson("/x"))).message).toBe("Something went wrong. Please try again.");
  });
});

describe("friendlyError", () => {
  it("keeps our own messages and hides raw failures", () => {
    expect(friendlyError(new ApiError("Sold out.", 409), "fallback")).toBe("Sold out.");
    expect(friendlyError(new Error("Could not load the payment window."), "fallback")).toBe("Could not load the payment window.");
    expect(friendlyError(new TypeError("Failed to fetch"), "fallback")).toBe("fallback");
    expect(friendlyError("nope", "fallback")).toBe("fallback");
  });
});
