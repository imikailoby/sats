import type * as bitcoin from "bitcoinjs-lib";

/** Bitcoin network type from bitcoinjs-lib. */
export type Network = bitcoin.Network;

/**
 * BIP84 derivation coordinates.
 * account/change/index are non-negative; change is 0 (external) or 1 (change)
 */
export type Derivation = {
  account: number;
  change: 0 | 1;
  index: number;
};

/** Derived receive address and its BIP84 path. */
export type ReceiveAddress = { address: string; path: string };

/**
 * UTXO representation, value in satoshis.
 * scriptPubKey may be provided to avoid extra lookups.
 */
export type Utxo = { txid: string; vout: number; value: number; scriptPubKey?: string };

/** Address balance summary in satoshis. */
export type Balance = { funded: number; spent: number };

/**
 * Minimal Esplora-compatible provider interface.
 */
export interface Provider {
  getAddressUtxos(address: string): Promise<Utxo[]>;
  getAddressBalance(address: string): Promise<Balance>;
  broadcast?(rawHex: string): Promise<{ txid: string }>;
}