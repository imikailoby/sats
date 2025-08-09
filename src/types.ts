import * as bitcoin from "bitcoinjs-lib";

export type Network = bitcoin.Network;

export type Derivation = {
    account: number;
    change: 0 | 1;
    index: number;
};

export type ReceiveAddress = { address: string; path: string };