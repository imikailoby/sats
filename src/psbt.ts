import * as bitcoin from "bitcoinjs-lib";
import { ECPairFactory, ECPairInterface } from "ecpair";
import * as ecc from "tiny-secp256k1";
import { network } from "./net";
import type { Utxo } from "./types";

bitcoin.initEccLib(ecc);
const ECPair = ECPairFactory(ecc);

export function buildPsbt(params: {
    utxos: Utxo[];
    outputs: { address: string; value: number }[];
    changeAddress: string;
    fee: number;
    testnet?: boolean;
}) {
    const n = network(!!params.testnet);
    const psbt = new bitcoin.Psbt({ network: n });

    const totalIn = params.utxos.reduce((s, u) => s + u.value, 0);
    const totalOut = params.outputs.reduce((s, o) => s + o.value, 0) + params.fee;
    if (totalOut > totalIn) throw new Error("insufficient funds");

    params.utxos.forEach(u => {
        psbt.addInput({
            hash: u.txid,
            index: u.vout,
            witnessUtxo: {
                value: u.value,
                script: u.scriptPubKey
                    ? Buffer.from(u.scriptPubKey, "hex")
                    : bitcoin.address.toOutputScript(params.changeAddress, n)
            }
        });
    });

    params.outputs.forEach(o => psbt.addOutput({ address: o.address, value: o.value }));
    const change = totalIn - totalOut;
    if (change > 0) psbt.addOutput({ address: params.changeAddress, value: change });

    return psbt;
}

function toSigner(kp: ECPairInterface): bitcoin.Signer {
    return {
        publicKey: Buffer.isBuffer(kp.publicKey) ? kp.publicKey : Buffer.from(kp.publicKey),
        sign(hash: Buffer): Buffer {
            const sig = kp.sign(hash);
            return Buffer.isBuffer(sig) ? sig : Buffer.from(sig);
        }
    } as unknown as bitcoin.Signer;
}

export function signPsbt(psbt: bitcoin.Psbt, priv: Buffer | string, testnet?: boolean) {
    const kp = typeof priv === "string"
        ? ECPair.fromWIF(priv, network(!!testnet))
        : ECPair.fromPrivateKey(Buffer.isBuffer(priv) ? priv : Buffer.from(priv), { network: network(!!testnet) });

    psbt.signAllInputs(toSigner(kp));
    return psbt;
}

export function finalizePsbt(psbt: bitcoin.Psbt) {
    psbt.finalizeAllInputs();
    const tx = psbt.extractTransaction();
    return { hex: tx.toHex(), txid: tx.getId() };
}