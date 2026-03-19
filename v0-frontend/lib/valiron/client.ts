import "server-only";

import { ValironSDK, type SupportedChain } from "@valiron/sdk";

const CHAINS = new Set<string>([
  "ethereum",
  "monad",
  "arbitrum",
  "base",
  "avalanche",
  "celo",
  "polygon",
  "linea",
  "abstract",
  "bsc",
  "gnosis",
  "goat",
  "mantle",
  "megaeth",
  "metis",
  "optimism",
  "scroll",
  "skale_base",
  "soneium",
  "taiko",
  "xlayer",
]);

function parseChain(): SupportedChain | undefined {
  const c = process.env.VALIRON_CHAIN?.trim().toLowerCase();
  if (!c) return undefined;
  if (!CHAINS.has(c)) return undefined;
  return c as SupportedChain;
}

let sdk: ValironSDK | null = null;

export function getValiron(): ValironSDK {
  if (!sdk) {
    const timeoutRaw = process.env.VALIRON_TIMEOUT_MS?.trim();
    const timeout = timeoutRaw ? parseInt(timeoutRaw, 10) : 8000;
    sdk = new ValironSDK({
      chain: parseChain(),
      endpoint: process.env.VALIRON_ENDPOINT?.trim() || undefined,
      timeout: Number.isFinite(timeout) ? timeout : 8000,
      debug:
        process.env.VALIRON_DEBUG === "true" ||
        process.env.VALIRON_DEBUG === "1",
    });
  }
  return sdk;
}

export function isValironEnabled(): boolean {
  const v = process.env.VALIRON_ENABLED?.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

/** Comma-separated wallet addresses used to seed dashboard rows when set. */
export function getSeedWallets(): string[] {
  const raw = process.env.VALIRON_WALLETS?.trim();
  if (!raw) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}
