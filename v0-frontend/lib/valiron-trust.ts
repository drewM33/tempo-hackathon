import type { AgentWallet, ValironWalletMeta } from "./dashboard-data";

/** Serializable trust fields merged into dashboard agents from Valiron (client-safe). */
export type ValironTrustPatch = Pick<
  AgentWallet,
  "tier" | "riskLevel" | "priceMultiplier" | "usdPrice"
> & {
  valiron?: ValironWalletMeta;
};
