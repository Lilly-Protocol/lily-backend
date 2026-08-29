import { z } from "zod";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/**
 * Version byte for Stellar ed25519 public key (starts with 'G'): 6 << 3 = 48 (0x30).
 */
export const ED25519_PUBLIC_KEY_VERSION_BYTE = 0x30;

/**
 * Version byte for Stellar med25519 muxed public key (starts with 'M'): 12 << 3 = 96 (0x60).
 */
export const MED25519_PUBLIC_KEY_VERSION_BYTE = 0x60;

/**
 * Computes the standard CRC16-XMODEM checksum for a byte array.
 * Uses polynomial 0x1021 with initial value 0x0000.
 */
export function calculateChecksum(data: Uint8Array): number {
  let crc = 0x0000;
  for (let i = 0; i < data.length; i++) {
    const byte = data[i];
    if (byte === undefined) {
      continue;
    }
    let code = (crc >>> 8) & 0xff;
    code ^= byte & 0xff;
    code ^= code >>> 4;
    crc = (crc << 8) & 0xffff;
    crc ^= code;
    code = (code << 5) & 0xffff;
    crc ^= code;
    code = (code << 7) & 0xffff;
    crc ^= code;
  }
  return crc;
}

/**
 * Decodes an RFC 4648 Base32 string into a Uint8Array.
 * Returns null if the string contains invalid Base32 characters or empty input.
 */
export function decodeBase32(encoded: string): Uint8Array | null {
  if (typeof encoded !== "string" || encoded.length === 0) {
    return null;
  }

  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (let i = 0; i < encoded.length; i++) {
    const char = encoded[i];
    if (!char) {
      return null;
    }
    const index = BASE32_ALPHABET.indexOf(char.toUpperCase());
    if (index === -1) {
      return null;
    }

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return new Uint8Array(output);
}

/**
 * Validates whether a string is a well-formed 56-character Stellar public address.
 * Validates length (56 chars), prefix ('G' or 'M'), Base32 character set, version byte, and CRC16 checksum.
 */
export function isValidStellarAddress(address: unknown): boolean {
  if (typeof address !== "string") {
    return false;
  }

  const trimmed = address.trim();

  // Address must be exactly 56 characters
  if (trimmed.length !== 56) {
    return false;
  }

  // Address must start with 'G' or 'M'
  const firstChar = trimmed[0];
  if (!firstChar) {
    return false;
  }
  const prefix = firstChar.toUpperCase();
  if (prefix !== "G" && prefix !== "M") {
    return false;
  }

  const decoded = decodeBase32(trimmed);
  // 56 Base32 characters unpack to 35 bytes (1 version byte + 32 public key payload + 2 checksum bytes)
  if (!decoded || decoded.length !== 35) {
    return false;
  }

  const expectedVersion =
    prefix === "G"
      ? ED25519_PUBLIC_KEY_VERSION_BYTE
      : MED25519_PUBLIC_KEY_VERSION_BYTE;

  const versionByte = decoded[0];
  if (versionByte !== expectedVersion) {
    return false;
  }

  // Payload is first 33 bytes (version byte + 32 bytes public key)
  const payload = decoded.subarray(0, 33);
  const expectedChecksum = calculateChecksum(payload);

  const byte33 = decoded[33];
  const byte34 = decoded[34];
  if (byte33 === undefined || byte34 === undefined) {
    return false;
  }

  // Checksum is 2 bytes stored in little-endian format at the end of decoded data
  const actualChecksum = byte33 | (byte34 << 8);

  return expectedChecksum === actualChecksum;
}

export const stellarAddressSchema = z
  .string()
  .trim()
  .length(56, "Stellar address must be exactly 56 characters")
  .refine(
    (val) => {
      const firstChar = val.trim()[0];
      if (!firstChar) {
        return false;
      }
      const prefix = firstChar.toUpperCase();
      return prefix === "G" || prefix === "M";
    },
    {
      message: "Stellar address must start with 'G' or 'M'",
    },
  )
  .refine(isValidStellarAddress, {
    message: "Invalid Stellar address checksum or format",
  });
