/**
 * Financing service — the only layer that talks to the chain
 * (ARCHITECTURE.md Section 15). Components/hooks call these typed
 * functions; nothing outside this module imports viem or builds calldata.
 *
 * Reads go through a public RPC client. Writes are always user-initiated
 * via the connected wallet (eth_sendTransaction) — the server never signs.
 * The contract is authoritative: displayed financial state always traces
 * back to a contract read or a real emitted event, never local math.
 */

import {
  createPublicClient,
  decodeEventLog,
  defineChain,
  encodeFunctionData,
  http,
  type Hex,
} from "viem";
import { erc20Abi, kobyFinancingAbi } from "@/lib/abi";
import { monadConfig, USDC_DECIMALS, isFinancingConfigured } from "@/lib/monad";
import type { Eip1193Provider } from "@/hooks/useWallet";
import type { FinancingStatus } from "@/lib/types";

const monadTestnet = defineChain({
  id: monadConfig.chainId,
  name: monadConfig.chainName,
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: [monadConfig.rpcUrl] } },
  blockExplorers: { default: { name: "MonadVision", url: monadConfig.explorerUrl } },
  testnet: true,
});

const publicClient = createPublicClient({ chain: monadTestnet, transport: http(monadConfig.rpcUrl) });

function contractAddress(): Hex {
  if (!monadConfig.contractAddress) throw new Error("CONTRACT_NOT_CONFIGURED");
  return monadConfig.contractAddress as Hex;
}

/** Required confirmation depth before the UI shows success (MONAD.md 9). */
export const REQUIRED_CONFIRMATIONS = 1;

export type Position = {
  id: bigint;
  business: string;
  financier: string;
  principal: bigint;
  obligation: bigint;
  repaid: bigint;
  outstanding: bigint;
  createdAt: bigint;
  fundedAt: bigint;
  status: FinancingStatus;
};

const STATUS_NAMES: FinancingStatus[] = ["Created", "Funded", "Repaying", "Completed"];

function toPosition(id: bigint, raw: {
  business: string; financier: string; principal: bigint; obligation: bigint;
  repaid: bigint; createdAt: bigint; fundedAt: bigint; status: number;
}): Position {
  const status = STATUS_NAMES[raw.status] ?? "Created";
  return {
    id,
    business: raw.business,
    financier: raw.financier,
    principal: raw.principal,
    obligation: raw.obligation,
    repaid: raw.repaid,
    outstanding: raw.obligation - raw.repaid,
    createdAt: raw.createdAt,
    fundedAt: raw.fundedAt,
    status,
  };
}

export async function readPositionCount(): Promise<bigint> {
  return (await publicClient.readContract({
    address: contractAddress(),
    abi: kobyFinancingAbi,
    functionName: "positionCount",
  })) as bigint;
}

export async function readPosition(id: bigint): Promise<Position> {
  const raw = (await publicClient.readContract({
    address: contractAddress(),
    abi: kobyFinancingAbi,
    functionName: "getPosition",
    args: [id],
  })) as unknown as {
    business: string; financier: string; principal: bigint; obligation: bigint;
    repaid: bigint; createdAt: bigint; fundedAt: bigint; status: number;
  };
  return toPosition(id, raw);
}

export async function readAllowance(owner: string, spender: string, token: string): Promise<bigint> {
  return (await publicClient.readContract({
    address: token as Hex,
    abi: erc20Abi,
    functionName: "allowance",
    args: [owner as Hex, spender as Hex],
  })) as bigint;
}

export async function readTokenBalance(owner: string, token: string): Promise<bigint> {
  return (await publicClient.readContract({
    address: token as Hex,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [owner as Hex],
  })) as bigint;
}

// ---- Write params (prepared, then sent via the wallet) --------------------

export function encodeCreate(business: string, principal: bigint, obligation: bigint): Hex {
  return encodeFunctionData({
    abi: kobyFinancingAbi,
    functionName: "create",
    args: [business as Hex, principal, obligation],
  });
}

export function encodeFund(id: bigint): Hex {
  return encodeFunctionData({ abi: kobyFinancingAbi, functionName: "fund", args: [id] });
}

export function encodeRepay(id: bigint, amount: bigint): Hex {
  return encodeFunctionData({ abi: kobyFinancingAbi, functionName: "repay", args: [id, amount] });
}

export function encodeApprove(spender: string, amount: bigint): Hex {
  return encodeFunctionData({
    abi: erc20Abi,
    functionName: "approve",
    args: [spender as Hex, amount],
  });
}

/** Submit a prepared transaction through the connected wallet. Returns the real hash. */
export async function sendViaWallet(
  provider: Eip1193Provider,
  from: string,
  to: string,
  data: Hex,
): Promise<string> {
  const hash = (await provider.request({
    method: "eth_sendTransaction",
    params: [{ from, to, data, value: "0x0" }],
  })) as string;
  if (typeof hash !== "string" || !/^0x[0-9a-fA-F]{64}$/.test(hash)) {
    throw new Error("Wallet did not return a valid transaction hash.");
  }
  return hash;
}

/** Wait until the transaction reaches the required confirmation depth. */
export async function waitForConfirmation(hash: string): Promise<void> {
  const receipt = await publicClient.waitForTransactionReceipt({
    hash: hash as Hex,
    confirmations: REQUIRED_CONFIRMATIONS,
  });
  if (receipt.status === "reverted") {
    throw new Error("Transaction reverted onchain. The financing contract rejected this call and no state changed.");
  }
}

// ---- History (direct log reads; ENVIO replaces this read path later) ------

export type FinancingEvent = {
  name: "FinancingCreated" | "FinancingFunded" | "RepaymentRecorded" | "FinancingCompleted";
  positionId: bigint;
  txHash: string;
  blockNumber: bigint;
  args: Record<string, string | bigint>;
};

const EVENT_NAMES = ["FinancingCreated", "FinancingFunded", "RepaymentRecorded", "FinancingCompleted"] as const;

/**
 * Read raw contract logs directly from RPC. This is the pre-ENVIO history
 * path: best-effort for lists/history, while actionable state always comes
 * from direct reads above. Throws on RPC range limits — callers show the
 * honest "activity unavailable" state, never fabricated events.
 */
export async function readFinancingEvents(fromBlock: bigint = 0n): Promise<FinancingEvent[]> {
  const address = contractAddress();
  const out: FinancingEvent[] = [];
  for (const name of EVENT_NAMES) {
    const event = kobyFinancingAbi.find((e) => e.type === "event" && e.name === name);
    if (!event) continue;
    const logs = await publicClient.getContractEvents({
      address,
      abi: kobyFinancingAbi,
      eventName: name,
      fromBlock,
      toBlock: "latest",
    });
    for (const log of logs) {
      const args: Record<string, string | bigint> = {};
      for (const [k, v] of Object.entries(log.args ?? {})) {
        if (typeof v === "bigint" || typeof v === "string") args[k] = v;
      }
      const positionId = args.id as bigint;
      out.push({
        name,
        positionId,
        txHash: log.transactionHash ?? "",
        blockNumber: log.blockNumber,
        args,
      });
    }
  }
  out.sort((a, b) => (a.blockNumber < b.blockNumber ? -1 : a.blockNumber > b.blockNumber ? 1 : 0));
  return out;
}

/** All positions, newest first. Reads every position id — fine at MVP scale. */
export async function listPositions(): Promise<Position[]> {
  const count = await readPositionCount();
  const ids: bigint[] = [];
  for (let i = 0n; i < count; i++) ids.push(i);
  const positions = await Promise.all(ids.map((id) => readPosition(id)));
  return positions.reverse();
}

/**
 * Extract the new position id from a confirmed create receipt by decoding
 * the real FinancingCreated event. Returns null when the event is absent
 * (e.g. unexpected receipt shape) — callers fall back to positionCount - 1
 * or show the hash with an explorer link, never a guessed id.
 */
export async function readCreatedIdFromReceipt(hash: string): Promise<bigint | null> {
  const receipt = await publicClient.getTransactionReceipt({ hash: hash as Hex });
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== (monadConfig.contractAddress ?? "").toLowerCase()) continue;
    try {
      const decoded = decodeEventLog({
        abi: kobyFinancingAbi,
        data: log.data,
        topics: log.topics as [`0x${string}`, ...`0x${string}`[]],
      });
      if (decoded.eventName === "FinancingCreated") {
        const args = decoded.args as { id: bigint };
        return args.id;
      }
    } catch {
      continue;
    }
  }
  return null;
}

// ---- Unit conversion (UI boundary only; never accounting logic) ------------

/** Decimal USD string -> USDC base units (6 decimals). Integer math only. */
export function usdToBaseUnits(usd: string): bigint | null {
  const trimmed = usd.trim().replace(/[$,]/g, "");
  const match = /^(\d+)(?:\.(\d{1,6}))?$/.exec(trimmed);
  if (!match) return null;
  const frac = (match[2] ?? "").padEnd(USDC_DECIMALS, "0");
  return BigInt(match[1]) * 10n ** BigInt(USDC_DECIMALS) + BigInt(frac);
}

export { USDC_DECIMALS, isFinancingConfigured };
export type { Eip1193Provider };
