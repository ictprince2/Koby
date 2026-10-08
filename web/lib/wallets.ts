import type { Eip1193Provider } from "@/lib/privy";

/**
 * Thin injected-wallet fallback discovery (PRD §16 / ARCH §9 / MONAD §10).
 *
 * Deliberately minimal: it only LISTS EIP-1193 providers actually present
 * in the browser (EIP-6963 announcements plus legacy `window.ethereum`
 * fallbacks). No selection state, no persistence, no chooser UI, no
 * connection logic — all of that lives in the wallet abstraction
 * (hooks/useWallet), where the injected entry stays secondary to Privy.
 * Privy is the primary provider; this module exists so Koby honors the
 * documented provider-agnostic interface when Privy is unavailable or the
 * user prefers an installed wallet. No wallet SDK is introduced here.
 */

export type DiscoveredWallet = {
  /** Stable id: EIP-6963 rdns when announced, otherwise a local fallback key. */
  id: string;
  /** Wallet-advertised name, self-reported flag name, or "Injected wallet". */
  name: string;
  provider: Eip1193Provider;
};

type EIP6963Info = {
  uuid: string;
  name: string;
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
 * wallets to announce, resolve after `timeoutMs`.
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
      seen.add(provider);
      out.push({
        id: rdns ?? `eip6963:${uuid}`,
        name: rawName !== "" ? rawName : (providerFlagName(provider) ?? "Injected wallet"),
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
 * All injected wallets currently present, EIP-6963 entries first.
 * Duplicate provider objects collapse to one entry. Empty when no wallet
 * is installed or when called outside a browser.
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
      provider: value,
    });
  }
  return out;
}
