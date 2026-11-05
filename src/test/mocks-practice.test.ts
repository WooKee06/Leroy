import { describe, it, expect, vi } from "vitest";

describe("vi.fn практика", () => {
  it("фейк помнит все вызовы", () => {
    const fake = vi.fn();
    fake("привет");
    fake("пока", 42);

    expect(fake.mock.calls).toEqual([["привет"], ["пока", 42]]);

    // И эти три утверждения должны пройти:
    expect(fake).toHaveBeenCalledTimes(2);
    expect(fake).toHaveBeenCalledWith("привет");
    expect(fake).toHaveBeenLastCalledWith("пока", 42);
  });

  it("фейк умеет возвращать готовый ответ", async () => {
    const fakeApi = vi.fn().mockResolvedValue({ isFavorite: true });
    await expect(fakeApi()).resolves.toEqual({ isFavorite: true });
  });
});
