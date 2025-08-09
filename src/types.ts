import * as bitcoin from "bitcoinjs-lib";

export type Network = bitcoin.Network;

export type Derivation = {
    account: number;
    change: 0 | 1;
    index: number;
};

export type ReceiveAddress = { address: string; path: string };

export type Utxo = { txid: string; vout: number; value: number; scriptPubKey?: string };
export type Balance = { funded: number; spent: number };

export interface Provider {
    getAddressUtxos(address: string): Promise<Utxo[]>;
    getAddressBalance(address: string): Promise<Balance>;
    broadcast?(rawHex: string): Promise<{ txid: string }>;
}