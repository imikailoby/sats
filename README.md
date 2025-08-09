# @imikailoby/sats

**Minimalistic, non-custodial Bitcoin SDK in TypeScript.**  
Keys and signatures stay local. On-chain address derivation (BIP84/P2WPKH), **PSBT** build/sign/finalize, **Esplora** providers (Blockstream/Mempool), and provider chain with timeouts & backoff.

> **Runtime:** Node 18+ (20+ recommended) — for global `fetch`.  
> **ESM:** This package is ESM-only. For CommonJS, use dynamic `import()` or bundle accordingly.

---

## Installation

```bash
npm i @imikailoby/sats
# or
pnpm add @imikailoby/sats
```

---

## Features (v1.0.0)

- 🔐 **Non-custodial**: BIP39 → BIP32 (BIP84), P2WPKH addresses, keys never leave your process.
- 🧩 **PSBT (BIP-174)**: Build, sign, and finalize ready-to-broadcast transactions.
- 🌐 **Esplora providers**: Blockstream / Mempool + any custom Esplora-compatible endpoint.
- ⛓️ **Provider chain**: Sequential retries with timeout and simple backoff.
- 🧪 **Tested**: Jest + ts-jest (ESM).

---

## Quick Start

### Keys & addresses (testnet)
```ts
import { generateMnemonic, fromMnemonic } from "@imikailoby/sats";

const mnemonic = generateMnemonic();                 // BIP39
const wallet   = fromMnemonic(mnemonic, { testnet: true });  // BIP84 m/84'/1'/0'

const recv1 = wallet.nextReceive(); // { address, path }
const recv2 = wallet.nextReceive();
console.log(recv1.address, recv2.address); // tb1...
```

### Providers: chain with backoff
```ts
import { providers, createProviderChain } from "@imikailoby/sats";

const p = createProviderChain(
  providers.mempool(true),      // testnet
  providers.blockstream(true)   // fallback
);

const utxos = await p.getAddressUtxos("<tb1...>");
const bal   = await p.getAddressBalance("<tb1...>");
console.log(utxos.length, bal);
```

### PSBT: build → sign → finalize → (optional) broadcast
```ts
import { fromMnemonic, buildPsbt, signPsbt, finalizePsbt, providers, createProviderChain } from "@imikailoby/sats";

const w = fromMnemonic("<mnemonic>", { testnet: true });
const change = w.nextReceive().address;

// (usually fetched from provider)
const utxos = [{ txid: "<txid>", vout: 0, value: 25_000, scriptPubKey: "0014..." }];

const psbt = buildPsbt({
  utxos,
  outputs: [{ address: "<recipient tb1...>", value: 20_000 }],
  changeAddress: change,
  fee: 500,
  testnet: true
});

const wif = w.toWIF(0);         // WIF for key index 0
signPsbt(psbt, wif, true);      // sign
const { hex, txid } = finalizePsbt(psbt); // raw tx + txid

// broadcast (if provider supports /tx):
const chain = createProviderChain(providers.mempool(true), providers.blockstream(true));
await chain.broadcast?.(hex);
```

---

## API Overview

### Network
- `network(testnet?: boolean): Network` — `true` → testnet, otherwise mainnet.

### Keys / Wallet
- `generateMnemonic(strength?: 128|160|192|224|256): string`  
  Generate BIP39 mnemonic.

- `fromMnemonic(mnemonic: string, opts?: { testnet?: boolean; account?: number }): Wallet`  
  BIP84 wallet (`m/84'/{coin}'/{account}'/change/index`).  
  **Wallet**:
  - `testnet: boolean`
  - `nextReceive(): { address: string; path: string }` — next receive address
  - `getKeyAt(index: number, change?: 0|1)` — derive key at path
  - `toWIF(index: number, change?: 0|1): string` — export private key as WIF

- `deriveKeypair(mnemonic, { account, change, index }, testnet?): { priv: Buffer; pub: Buffer; path: string }`  
  Direct derivation if needed.

- `p2wpkhAddress(pubkey: Buffer, testnet?): { address: string; scriptPubKey: string }`

### Providers (Esplora)
- `providers.blockstream(testnet?: boolean): Provider`
- `providers.mempool(testnet?: boolean): Provider`
- `providers.esplora(baseUrl: string): Provider`

**Provider**:
- `getAddressUtxos(address): Promise<Utxo[]>`
- `getAddressBalance(address): Promise<{ funded: number; spent: number }>`
- `broadcast?(rawHex): Promise<{ txid: string }>` — if endpoint available (Mempool/Blockstream have it)

- `createProviderChain(...providers: Provider[]): Provider`  
  Sequential retries with timeout and simple backoff.

### PSBT
- `buildPsbt({ utxos, outputs, changeAddress, fee, testnet? }): Psbt`  
  Validates sums, adds inputs/outputs/change.

- `signPsbt(psbt, priv: Buffer|string, testnet?): Psbt`  
  Sign all inputs with provided key (Buffer or WIF).

- `finalizePsbt(psbt): { hex: string; txid: string }`  
  Finalize and extract raw transaction.

---

## Errors

The SDK uses domain-specific errors (names may differ slightly in implementation):

- `SatsError` — base class.
- `DerivationError`, `AddressError` — key/address issues.
- `PsbtBuildError`, `InsufficientFundsError` — transaction build issues.
- `ProviderError`, `TimeoutError`, `BroadcastError` — network/provider issues.

> These are thrown from exported functions; catch them to retry/change provider/adjust fee.

---

## Patterns & Safety

- **Non-custodial**: seed/keys remain local.
- **SRP/DRY/SOLID**: layers `core/`, `crypto/`, `psbt/`, `net/`, `providers/`, `utils/`.
- **ESM, tree-shake friendly**: no side effects in root modules.
- **Fetch abstraction**: providers use shared HTTP helper with timeout.

---

## Tests

```bash
npm test
```
