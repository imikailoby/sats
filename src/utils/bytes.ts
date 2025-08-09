/**
 * Normalize Buffer/Uint8Array input to Node.js Buffer.
 * @param input - Buffer or Uint8Array
 * @returns Buffer view (copies if needed)
 */
export function toBuffer(input: Buffer | Uint8Array): Buffer {
  return Buffer.isBuffer(input) ? input : Buffer.from(input);
}


