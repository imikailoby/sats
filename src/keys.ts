import * as bip39 from "bip39";
import { BIP32Factory } from "bip32";
import * as ecc from "tiny-secp256k1";
import * as bitcoin from "bitcoinjs-lib";
import { network } from "./net";
import type { Derivation, ReceiveAddress } from "./types";

const bip32 = BIP32Factory(ecc);
bitcoin.initEccLib(ecc);

export type Wallet = {
    testnet: boolean;
    account: number;
    nextIndex: number;
    mnemonic?: string;
    getKeyAt: (index: number, change?: 0 | 1) => { priv: Buffer; pub: Buffer; path: string };
    nextReceive: () => ReceiveAddress;
};

export function generateMnemonic(
    strength: 128 | 160 | 192 | 224 | 256 = 128
): string {
    return bip39.generateMnemonic(strength);
}

export function deriveKeypair(
    mnemonic: string,
    d: Derivation,
    testnet = false
) {
    const seedU8 = bip39.mnemonicToSeedSync(mnemonic);
    const seed = Buffer.isBuffer(seedU8) ? seedU8 : Buffer.from(seedU8);
    const root = bip32.fromSeed(seed, network(testnet));
    const coin = testnet ? 1 : 0;
    const path = `m/84'/${coin}'/${d.account}'/${d.change}/${d.index}`;
    const child = root.derivePath(path);
    if (!child.privateKey || !child.publicKey) throw new Error("no keys");
    const priv = Buffer.isBuffer(child.privateKey) ? child.privateKey : Buffer.from(child.privateKey);
    const pub = Buffer.isBuffer(child.publicKey) ? child.publicKey : Buffer.from(child.publicKey);
    return { priv, pub, path };
}

export function fromMnemonic(
    mnemonic: string,
    opts?: { testnet?: boolean; account?: number }
): Wallet {
    const testnet = !!opts?.testnet;
    const account = opts?.account ?? 0;

    const getKeyAt = (index: number, change: 0 | 1 = 0) =>
        deriveKeypair(mnemonic, { account, change, index }, testnet);

    let nextIndex = 0;

    const nextReceive = (): ReceiveAddress => {
        const k = getKeyAt(nextIndex, 0);
        const pay = bitcoin.payments.p2wpkh({ pubkey: k.pub, network: network(testnet) });
        if (!pay.address) throw new Error("address failed");
        nextIndex++;
        return { address: pay.address, path: k.path };
    };

    return { testnet, account, nextIndex, mnemonic, getKeyAt, nextReceive };
}