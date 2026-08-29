import { describe, expect, it } from "vitest";

import {
  calculateChecksum,
  decodeBase32,
  ED25519_PUBLIC_KEY_VERSION_BYTE,
  isValidStellarAddress,
  stellarAddressSchema,
} from "../src/modules/payments/stellar-address.validator";

describe("Stellar address validation", () => {
  it("defines standard ed25519 public key version byte as 0x30", () => {
    expect(ED25519_PUBLIC_KEY_VERSION_BYTE).toBe(0x30);
  });

  describe("calculateChecksum (CRC16-XMODEM)", () => {
    it("computes 0 for empty byte buffer", () => {
      expect(calculateChecksum(new Uint8Array([]))).toBe(0);
    });

    it("computes deterministic checksum for byte buffers", () => {
      const data = new Uint8Array([0x30, 0x01, 0x02, 0x03, 0x04]);
      const crc1 = calculateChecksum(data);
      const crc2 = calculateChecksum(data);
      expect(crc1).toBe(crc2);
      expect(typeof crc1).toBe("number");
      expect(crc1).toBeGreaterThanOrEqual(0);
      expect(crc1).toBeLessThanOrEqual(0xffff);
    });

    it("detects single-bit changes in payload data", () => {
      const data1 = new Uint8Array([0x30, 0xaa, 0xbb, 0xcc]);
      const data2 = new Uint8Array([0x30, 0xaa, 0xbb, 0xcd]); // 1 bit flipped
      expect(calculateChecksum(data1)).not.toBe(calculateChecksum(data2));
    });
  });

  describe("decodeBase32", () => {
    it("decodes valid RFC 4648 Base32 strings", () => {
      const decoded = decodeBase32("JBSWY3DPEBLW64TMMQ");
      expect(decoded).not.toBeNull();
      expect(decoded instanceof Uint8Array).toBe(true);
    });

    it("returns null for invalid base32 characters", () => {
      expect(decodeBase32("0189!@#$%^")).toBeNull();
      expect(
        decodeBase32(
          "GAJ5AO4AC3FPUCOR7VNSCH4AFW3VUDDAELHBBVY3TQ7GI3GZS2S3WIH0",
        ),
      ).toBeNull();
      expect(decodeBase32("")).toBeNull();
    });
  });

  describe("isValidStellarAddress", () => {
    it("accepts valid 56-character Stellar public addresses", () => {
      const validAddresses = [
        "GAJ5AO4AC3FPUCOR7VNSCH4AFW3VUDDAELHBBVY3TQ7GI3GZS2S3WIHA",
        "GCL6OXAMLD75BMTINA6EMRUDWK5THQUSHMYNLSNBCJAPZJHNYJTUNIBC",
        "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
        "GAIRCEIRCEIRCEIRCEIRCEIRCEIRCEIRCEIRCEIRCEIRCEIRCEIRCF6M",
        "GD7777777777777777777777777777777777777777777777777773DB",
        "GBBEEQSCIJBEEQSCIJBEEQSCIJBEEQSCIJBEEQSCIJBEEQSCIJBEFZSP",
      ];

      for (const address of validAddresses) {
        expect(isValidStellarAddress(address)).toBe(true);
      }
    });

    it("rejects non-string inputs", () => {
      expect(isValidStellarAddress(null)).toBe(false);
      expect(isValidStellarAddress(undefined)).toBe(false);
      expect(isValidStellarAddress(12345)).toBe(false);
      expect(isValidStellarAddress({})).toBe(false);
    });

    it("rejects addresses that are not 56 characters long", () => {
      const invalidLengths = [
        "foo",
        "G",
        "G12345",
        "GAJ5AO4AC3FPUCOR7VNSCH4AFW3VUDDAELHBBVY3TQ7GI3GZS2S3WIH", // 55 chars
        "GAJ5AO4AC3FPUCOR7VNSCH4AFW3VUDDAELHBBVY3TQ7GI3GZS2S3WIHAA", // 57 chars
        "G".repeat(64), // 64 chars
        "G".repeat(128),
      ];

      for (const address of invalidLengths) {
        expect(isValidStellarAddress(address)).toBe(false);
      }
    });

    it("rejects addresses with wrong prefixes", () => {
      const wrongPrefixAddresses = [
        "AAJ5AO4AC3FPUCOR7VNSCH4AFW3VUDDAELHBBVY3TQ7GI3GZS2S3WIHA",
        "BAJ5AO4AC3FPUCOR7VNSCH4AFW3VUDDAELHBBVY3TQ7GI3GZS2S3WIHA",
        "1AJ5AO4AC3FPUCOR7VNSCH4AFW3VUDDAELHBBVY3TQ7GI3GZS2S3WIHA",
        "SBBM6BKZPEHWYO3E3YKREDPQXMS4VK35YLNU7NFBRI26RAN5U4D6V3T5", // Secret seed prefix S
      ];

      for (const address of wrongPrefixAddresses) {
        expect(isValidStellarAddress(address)).toBe(false);
      }
    });

    it("rejects addresses with invalid checksums", () => {
      // Modifying the last char of a valid address alters the checksum
      const corruptedChecksum =
        "GAJ5AO4AC3FPUCOR7VNSCH4AFW3VUDDAELHBBVY3TQ7GI3GZS2S3WIHB";
      expect(isValidStellarAddress(corruptedChecksum)).toBe(false);

      // Modifying a payload char without recomputing CRC16
      const corruptedPayload =
        "GBJ5AO4AC3FPUCOR7VNSCH4AFW3VUDDAELHBBVY3TQ7GI3GZS2S3WIHA";
      expect(isValidStellarAddress(corruptedPayload)).toBe(false);

      // Repeated 'G' characters of length 56 does not have valid CRC16
      expect(isValidStellarAddress("G".repeat(56))).toBe(false);
    });
  });

  describe("stellarAddressSchema", () => {
    it("successfully parses valid Stellar addresses", () => {
      const validAddress =
        "GAJ5AO4AC3FPUCOR7VNSCH4AFW3VUDDAELHBBVY3TQ7GI3GZS2S3WIHA";
      const result = stellarAddressSchema.safeParse(validAddress);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(validAddress);
      }
    });

    it("rejects addresses failing length, prefix, or checksum validation", () => {
      expect(stellarAddressSchema.safeParse("foo").success).toBe(false);
      expect(stellarAddressSchema.safeParse("G".repeat(64)).success).toBe(
        false,
      );
      expect(
        stellarAddressSchema.safeParse(
          "AAJ5AO4AC3FPUCOR7VNSCH4AFW3VUDDAELHBBVY3TQ7GI3GZS2S3WIHA",
        ).success,
      ).toBe(false);
      expect(
        stellarAddressSchema.safeParse(
          "GAJ5AO4AC3FPUCOR7VNSCH4AFW3VUDDAELHBBVY3TQ7GI3GZS2S3WIHB",
        ).success,
      ).toBe(false);
    });
  });
});
