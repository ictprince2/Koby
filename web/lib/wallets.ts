/**
 * Injected-wallet discovery (EIP-6963 + legacy fallbacks).
 *
 * Koby never hard-codes a wallet. This module only lists providers that are
 * actually present in the browser:
 *
 * - EIP-6963 announcements (`eip6963:announceProvider`), supported by
 *   MetaMask, Phantom, Rabby, Coinbase Wallet, Brave, and other modern
 *   EVM wallets. Names/icons come from the wallet's own announcement.
 * - Legacy fallbacks: MetaMask's `window.ethereum.providers[]`
 *   multiplexer, plain `window.ethereum`, and `window.phantom.ethereum`.
 *   These entries are labeled from the provider's own self-reported flags
 *   (`isMetaMask`, `isPhantom`, …) or generically as "Injected wallet".
 *
 * Nothing here claims support for a wallet that is not detected, and no
 * icons are bundled — EIP-6963 icons are wallet-supplied data URLs only.
 *
 * Every discovered provider speaks standard EIP-1193, which is all Koby
 * uses (`eth_requestAccounts`, `eth_accounts`, `eth_chainId`,
 * `wallet_switchEthereumChain`, `wallet_addEthereumChain`,
 * `eth_sendTransaction`). Any EVM wallet the user has installed can
 * therefore connect; adding Monad Testnet is just a chain id + RPC the
 * wallet registers via `wallet_addEthereumChain`.
 */

export type Eip1193Provider = {
  request: (args: { method: string; params?: unknown }) => Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
};

export type DiscoveredWallet = {
  /** Stable id: EIP-6963 rdns when announced, otherwise a local fallback key. */
  id: string;
  /** Wallet-advertised name, self-reported flag name, or "Injected wallet". */
  name: string;
  /** Wallet-supplied EIP-6963 icon (data URL), or null when not provided. */
  icon: string | null;
  provider: Eip1193Provider;
};

type EIP6963Info = {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
};

type EIP6963Announce = {
  info: EIP6963Info;
  provider: unknown;
};

/** True only for usable EIP-1193 providers (a `request` function exists). */
function isEip1193Provider(value: unknown): value is Eip1193Provider {
  if (typeof value !== "object" || value === null) return false;
  return typeof (value as { request?: unknown }).request === "function";
}

/**
 * Name from the provider's own self-reported flags. `null` means unknown —
 * callers must fall back to a generic label, never guess a brand.
 */
function providerFlagName(provider: Eip1193Provider): string | null {
  const flags = provider as unknown as Record<string, unknown>;
  if (flags.isMetaMask === true) return "MetaMask";
  if (flags.isPhantom === true) return "Phantom";
  if (flags.isCoinbaseWallet === true) return "Coinbase Wallet";
  if (flags.isRabby === true) return "Rabby";
  if (flags.isBraveWallet === true) return "Brave Wallet";
  if (flags.isTrust === true || flags.isTrustWallet === true) return "Trust Wallet";
  if (flags.isOkxWallet === true || flags.isOKExWallet === true) return "OKX Wallet";
  return null;
}

/**
 * Collect one EIP-6963 discovery round: listen for announcements, prompt
 * wallets to announce, resolve after `timeoutMs`. Late announcers are
 * picked up by the next discovery pass (chooser reopen / refresh).
 */
function collectEip6963(timeoutMs: number): Promise<DiscoveredWallet[]> {
  return new Promise((resolve) => {
    const out: DiscoveredWallet[] = [];
    const seen = new Set<object>();
    const onAnnounce = (event: Event) => {
      const announced = (event as CustomEvent<EIP6963Announce>).detail;
      if (typeof announced !== "object" || announced === null) return;
      const { info, provider } = announced;
      if (!isEip1193Provider(provider) || seen.has(provider)) return;
      if (typeof info !== "object" || info === null) return;
      const rdns = typeof info.rdns === "string" && info.rdns !== "" ? info.rdns : null;
      const uuid = typeof info.uuid === "string" && info.uuid !== "" ? info.uuid : String(out.length);
      const rawName = typeof info.name === "string" ? info.name.trim() : "";
      const icon =
        typeof info.icon === "string" && info.icon.startsWith("data:image/") ? info.icon : null;
      seen.add(provider);
      out.push({
        id: rdns ?? `eip6963:${uuid}`,
        name: rawName !== "" ? rawName : (providerFlagName(provider) ?? "Injected wallet"),
        icon,
        provider,
      });
    };
    window.addEventListener("eip6963:announceProvider", onAnnounce);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    window.setTimeout(() => {
      window.removeEventListener("eip6963:announceProvider", onAnnounce);
      resolve(out);
    }, Math.max(0, timeoutMs));
  });
}

/**
 * Legacy providers that do not announce via EIP-6963. When MetaMask exposes
 * the `providers[]` multiplexer, its entries are the distinct wallets and
 * the top-level object is just the routing proxy, so only the entries are
 * used. Otherwise the top-level object plus Phantom's global are tried.
 */
function collectLegacy(): Array<{ key: string; value: unknown }> {
  const globals = window as unknown as Record<string, unknown>;
  const out: Array<{ key: string; value: unknown }> = [];
  const eth = globals.ethereum;
  if (typeof eth === "object" && eth !== null) {
    const multiplexed = (eth as { providers?: unknown }).providers;
    if (Array.isArray(multiplexed)) {
      multiplexed.forEach((entry, index) => {
        out.push({ key: `window.ethereum.providers[${index}]`, value: entry });
      });
    } else {
      out.push({ key: "window.ethereum", value: eth });
    }
  }
  const phantom = globals.phantom;
  if (typeof phantom === "object" && phantom !== null) {
    out.push({
      key: "window.phantom.ethereum",
      value: (phantom as { ethereum?: unknown }).ethereum,
    });
  }
  return out;
}

/**
 * All injected wallets currently present, EIP-6963 entries first (they
 * carry proper names/icons). Duplicate provider objects collapse to one
 * entry. Empty when no wallet is installed.
 */
export async function discoverInjectedWallets(timeoutMs = 600): Promise<DiscoveredWallet[]> {
  if (typeof window === "undefined") return [];
  const out = await collectEip6963(timeoutMs);
  const seen = new Set<object>(out.map((w) => w.provider));
  let unnamed = 0;
  for (const { key, value } of collectLegacy()) {
    if (!isEip1193Provider(value) || seen.has(value)) continue;
    seen.add(value);
    out.push({
      id: `injected:${key}`,
      name: providerFlagName(value) ?? `Injected wallet${out.length > 0 ? ` ${++unnamed}` : ""}`,
      icon: null,
      provider: value,
    });
  }
  return out;
}
