import { describe, expect, it } from "vitest";
import { MAX_IMAGE_BYTES, REGISTER_MESSAGES, describeRegisterFailure, imageExtension, txLink } from "./register-ui";

describe("describeRegisterFailure", () => {
  it("passes server field errors through for 400", () => {
    expect(describeRegisterFailure(400, { error: "validation", fields: { sku: "x" } })).toEqual({ message: "", fields: { sku: "x" } });
  });
  it("maps the other documented errors to the agreed wording", () => {
    expect(describeRegisterFailure(409, { error: "duplicate_sku" }).message).toBe("A garment with this SKU is already registered.");
    expect(describeRegisterFailure(502, { error: "chain_failed", pid: "TM-X" }).message).toBe(
      "Could not record the garment on the blockchain. Nothing was registered; try again.",
    );
    expect(describeRegisterFailure(401, { error: "unauthorized" }).message).toBe("Please log in to continue.");
  });
  it("falls back to a generic message for anything else, including non-JSON bodies", () => {
    expect(describeRegisterFailure(500, { error: "server_error" }).message).toBe(REGISTER_MESSAGES.generic);
    expect(describeRegisterFailure(500, null).message).toBe(REGISTER_MESSAGES.generic);
    expect(describeRegisterFailure(500, "oops").message).toBe(REGISTER_MESSAGES.generic);
  });
});

describe("imageExtension", () => {
  it("allows jpg, png and webp up to 2 MB", () => {
    expect(imageExtension({ type: "image/jpeg", size: 10 })).toBe("jpg");
    expect(imageExtension({ type: "image/png", size: MAX_IMAGE_BYTES })).toBe("png");
    expect(imageExtension({ type: "image/webp", size: 1 })).toBe("webp");
  });
  it("rejects other types and files over 2 MB", () => {
    expect(imageExtension({ type: "image/gif", size: 10 })).toBeNull();
    expect(imageExtension({ type: "application/pdf", size: 10 })).toBeNull();
    expect(imageExtension({ type: "image/png", size: MAX_IMAGE_BYTES + 1 })).toBeNull();
  });
});

describe("txLink", () => {
  it("builds a link only when an explorer prefix is configured", () => {
    expect(txLink("https://sepolia.etherscan.io/tx/", "0xabc")).toBe("https://sepolia.etherscan.io/tx/0xabc");
    expect(txLink("", "0xabc")).toBeNull();
    expect(txLink(undefined, "0xabc")).toBeNull();
  });
});
