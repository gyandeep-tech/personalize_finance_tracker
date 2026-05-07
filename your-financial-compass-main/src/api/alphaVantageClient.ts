const API_KEY = "79ZQ35IN0SMEYAI5";
const BASE_URL = "https://www.alphavantage.co/query";

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: string;
}

export interface MarketData {
  vix: number; // Market volatility index
  trend: "bullish" | "bearish" | "neutral";
  recommendedRisk: "low" | "medium" | "high";
  topStocks: StockQuote[];
}

export interface AllocationRecommendation {
  assetClass: string;
  allocation: number;
  rationale: string;
}

// Fetch real-time stock quote
export const fetchStockQuote = async (symbol: string): Promise<StockQuote | null> => {
  try {
    const response = await fetch(
      `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`
    );
    const data = await response.json();

    if (data["Global Quote"] && data["Global Quote"]["05. price"]) {
      return {
        symbol,
        price: parseFloat(data["Global Quote"]["05. price"]),
        change: parseFloat(data["Global Quote"]["09. change"]) || 0,
        changePercent: parseFloat(data["Global Quote"]["10. change percent"]) || 0,
        timestamp: new Date().toISOString(),
      };
    }
    return null;
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    return null;
  }
};

// Fetch VIX (Volatility Index) - using UVXY as proxy
export const fetchVIX = async (): Promise<number> => {
  try {
    const response = await fetch(
      `${BASE_URL}?function=GLOBAL_QUOTE&symbol=UVXY&apikey=${API_KEY}`
    );
    const data = await response.json();

    if (data["Global Quote"] && data["Global Quote"]["05. price"]) {
      return parseFloat(data["Global Quote"]["05. price"]);
    }
    return 25; // Default VIX level
  } catch (error) {
    console.error("Error fetching VIX:", error);
    return 25;
  }
};

// Fetch intraday data for trend analysis
export const fetchTrendData = async (
  symbol: string = "SPY"
): Promise<"bullish" | "bearish" | "neutral"> => {
  try {
    const response = await fetch(
      `${BASE_URL}?function=INTRADAY&symbol=${symbol}&interval=60min&apikey=${API_KEY}`
    );
    const data = await response.json();

    if (data["Time Series (60min)"]) {
      const timeSeries = Object.entries(data["Time Series (60min)"]).slice(0, 5);
      const closes = timeSeries.map((entry: any) => parseFloat(entry[1]["4. close"]));

      if (closes.length > 1) {
        const avgClose = closes.reduce((a, b) => a + b) / closes.length;
        const latestClose = closes[0];

        if (latestClose > avgClose * 1.01) return "bullish";
        if (latestClose < avgClose * 0.99) return "bearish";
      }
    }
    return "neutral";
  } catch (error) {
    console.error("Error fetching trend data:", error);
    return "neutral";
  }
};

// Fetch top Indian stocks (using common symbols)
export const fetchTopStocks = async (): Promise<StockQuote[]> => {
  // Using US market proxies for Indian sectors (since Alpha Vantage is US-focused)
  // In production, you'd integrate NSE API directly
  const symbols = ["MSFT", "GOOGL", "AAPL", "NVDA", "TSLA"]; // Tech stocks

  const quotes = await Promise.all(symbols.map((sym) => fetchStockQuote(sym)));
  return quotes.filter((q) => q !== null) as StockQuote[];
};

// Get market data and recommendations based on current conditions
export const getMarketData = async (): Promise<MarketData> => {
  const vix = await fetchVIX();
  const trend = await fetchTrendData();
  const topStocks = await fetchTopStocks();

  // Determine risk level based on VIX
  let recommendedRisk: "low" | "medium" | "high";
  if (vix > 30) {
    recommendedRisk = "low"; // High volatility -> conservative
  } else if (vix < 15) {
    recommendedRisk = "high"; // Low volatility -> aggressive
  } else {
    recommendedRisk = "medium";
  }

  return {
    vix: Math.round(vix * 10) / 10,
    trend,
    recommendedRisk,
    topStocks,
  };
};

// Get optimized allocation based on market conditions
export const getOptimizedAllocation = (
  risk: "low" | "medium" | "high",
  marketData?: MarketData
): AllocationRecommendation[] => {
  const baseAllocations = {
    low: [
      { assetClass: "Government Bonds", allocation: 50, rationale: "Safe, stable returns" },
      { assetClass: "Dividend Stocks", allocation: 30, rationale: "Blue-chip companies" },
      { assetClass: "Money Market", allocation: 20, rationale: "High liquidity" },
    ],
    medium: [
      { assetClass: "Large Cap Stocks", allocation: 45, rationale: "Stable growth" },
      { assetClass: "Corporate Bonds", allocation: 30, rationale: "Balanced returns" },
      { assetClass: "Small Cap Growth", allocation: 15, rationale: "Growth potential" },
      { assetClass: "International", allocation: 10, rationale: "Diversification" },
    ],
    high: [
      { assetClass: "Growth Stocks", allocation: 60, rationale: "Maximum returns" },
      { assetClass: "Tech Equities", allocation: 25, rationale: "High growth sectors" },
      { assetClass: "Emerging Markets", allocation: 15, rationale: "High volatility play" },
    ],
  };

  let allocations = [...baseAllocations[risk]];

  // Adjust based on market conditions if available
  if (marketData) {
    if (marketData.vix > 30 && risk === "high") {
      // High volatility -> reduce aggressive allocations
      allocations = allocations.map((a) =>
        a.assetClass.includes("Growth") || a.assetClass.includes("Tech")
          ? { ...a, allocation: Math.max(10, a.allocation - 10) }
          : a
      );
    }
  }

  return allocations;
};

// Batch fetch for multiple stocks (more efficient)
export const fetchMultipleQuotes = async (symbols: string[]): Promise<StockQuote[]> => {
  const quotes = await Promise.all(symbols.map((sym) => fetchStockQuote(sym)));
  return quotes.filter((q) => q !== null) as StockQuote[];
};
