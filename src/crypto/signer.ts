import type * as bitcoin from "bitcoinjs-lib";
import type { ECPairInterface } from "ecpair";
import { toBuffer } from "../utils/bytes";

/**
 * Adapt ECPairInterface to bitcoinjs-lib Signer.
 */
export function ecPairToSigner(pair: ECPairInterface): bitcoin.Signer {
  return {
    publicKey: toBuffer(pair.publicKey as unknown as Uint8Array),
    sign(hash: Buffer): Buffer {
      const sig = pair.sign(hash);
      return toBuffer(sig as unknown as Uint8Array);
    },
  } as unknown as bitcoin.Signer;
}


