import { describe, expect, it, vi } from "vitest";
import { withRetry } from "./retry";

const fastOptions = { retries: 2, baseDelayMs: 1, maxDelayMs: 5 };

describe("withRetry", () => {
  it("returns immediately on success", async () => {
    const operation = vi.fn().mockResolvedValue("ok");

    await expect(withRetry(operation, fastOptions)).resolves.toBe("ok");
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it("retries transient failures until it succeeds", async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new Error("transient"))
      .mockResolvedValue("ok");

    await expect(withRetry(operation, fastOptions)).resolves.toBe("ok");
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("throws after exhausting the retry budget", async () => {
    const operation = vi.fn().mockRejectedValue(new Error("always"));

    await expect(withRetry(operation, fastOptions)).rejects.toThrow("always");
    expect(operation).toHaveBeenCalledTimes(3);
  });
});
