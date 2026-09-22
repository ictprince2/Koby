import { Container } from "@/components/layout/Container";
import { isContractConfigured, isNetworkConfigured, kobyConfig } from "@/lib/config";

/**
 * SiteFooter — minimal structural footer. Reports configuration truthfully:
 * pending D23 verification is shown as pending, never filled with guesses.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-koby-border">
      <Container>
        <div className="flex flex-col gap-2 py-6 text-xs text-koby-text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>Koby turns future business cash flow into programmable liquidity.</p>
          <p aria-live="polite">
            Network: {kobyConfig.chainName} · Contract:{" "}
            {isContractConfigured() ? "configured" : "not yet deployed (D23 pending)"}
            {isNetworkConfigured() ? "" : " · Network config pending D23 verification"}
          </p>
        </div>
      </Container>
    </footer>
  );
}
