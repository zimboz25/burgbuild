export interface Env {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
}

const YAHOO_SPARK = "https://query1.finance.yahoo.com/v7/finance/spark";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/market/spark") {
      const symbols = url.searchParams.get("symbols");
      if (!symbols) {
        return Response.json(
          { error: "symbols query parameter is required" },
          { status: 400 },
        );
      }

      const range = url.searchParams.get("range") ?? "1y";
      const interval = url.searchParams.get("interval") ?? "1d";
      const yahooUrl = `${YAHOO_SPARK}?symbols=${encodeURIComponent(symbols)}&range=${encodeURIComponent(range)}&interval=${encodeURIComponent(interval)}`;

      const yahooRes = await fetch(yahooUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; BurgBuild/1.0)" },
      });

      return new Response(yahooRes.body, {
        status: yahooRes.status,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=300",
        },
      });
    }

    return env.ASSETS.fetch(request);
  },
};
