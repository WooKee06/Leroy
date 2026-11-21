import { describe, expect, it, vi } from "vitest";

const { leroyApi } = vi.hoisted(() => ({
  leroyApi: {
    me: vi.fn(),
    wallet: vi.fn().mockResolvedValue({ available: 0, hold: 0, currency: "RUB" }),
  },
}));

vi.mock("@shared/api/leroyApi", () => ({ leroyApi }));
vi.mock("@shared/api/client", () => ({
  getAuthToken: vi.fn(() => "saved-token"),
  setAuthToken: vi.fn(),
}));
vi.mock("@shared/lib/telegram", () => ({
  buildTelegramLoginInitData: vi.fn(),
  getTgUser: vi.fn(() => undefined),
  isOnWeb: vi.fn(() => true),
  readyTelegramWebApp: vi.fn(),
}));

import { accountStore } from "./accountStore";

describe("accountStore.initialize", () => {
  it("keeps route guards waiting until the saved session is verified", async () => {
    let resolveMe!: (profile: unknown) => void;
    leroyApi.me.mockImplementationOnce(
      () => new Promise((resolve) => (resolveMe = resolve)),
    );

    expect(accountStore.initialized).toBe(false);
    accountStore.initialize();
    expect(accountStore.initialized).toBe(false);

    resolveMe({ id: "u1", first_name: "Admin", role: "admin" });
    await vi.waitFor(() => expect(accountStore.initialized).toBe(true));

    expect(accountStore.isAuthenticated).toBe(true);
    expect(accountStore.role).toBe("admin");
  });
});
