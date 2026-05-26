import { StockNews } from './types';

const API_KEY = '3KXPXI46GOQUZB9J';
const BASE_URL = 'https://www.alphavantage.co/query';

function parseTimestamp(timeString: string | undefined): number | null {
  if (!timeString) return null;
  // Alpha Vantage time format: YYYYMMDDTHHMMSS
  const match = timeString.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
  if (match) {
    const [_, year, month, day, hour, minute, second] = match;
    const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
    return date.getTime();
  }
  return null;
}

export async function fetchAlphaVantageNews(symbol: string): Promise<StockNews[] | null> {
  try {
    const url = `${BASE_URL}?function=NEWS_SENTIMENT&tickers=${symbol}&apikey=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.Information && data.Information.includes('rate limit')) {
      console.warn('Alpha Vantage rate limit hit for news:', data.Information);
      return null;
    }
    
    if (data.Information) {
      console.warn('Alpha Vantage info returned for news:', data.Information);
      return null;
    }

    if (!data.feed || !Array.isArray(data.feed)) {
      return null;
    }

    return data.feed.map((item: any) => {
      // Find ticker specific sentiment if available
      let sentimentScore = item.overall_sentiment_score;
      if (item.ticker_sentiment && Array.isArray(item.ticker_sentiment)) {
        const tickerData = item.ticker_sentiment.find((t: any) => t.ticker === symbol);
        if (tickerData && tickerData.ticker_sentiment_score !== undefined) {
          sentimentScore = parseFloat(tickerData.ticker_sentiment_score);
        }
      }

      return {
        title: item.title || '',
        publisher: item.source || '',
        link: item.url || '',
        snippet: item.summary || '',
        timestamp: parseTimestamp(item.time_published),
        thumbnail: item.banner_image || '',
        sentimentScore: sentimentScore !== undefined ? parseFloat(sentimentScore) : undefined
      };
    });
  } catch (error) {
    console.error(`Error fetching Alpha Vantage news for ${symbol}:`, error);
    return null;
  }
}

export async function fetchAlphaVantageOverview(symbol: string): Promise<any | null> {
  try {
    const url = `${BASE_URL}?function=OVERVIEW&symbol=${symbol}&apikey=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.Information && data.Information.includes('rate limit')) {
      console.warn('Alpha Vantage rate limit hit for overview:', data.Information);
      return null;
    }
    
    if (data.Information) {
       console.warn('Alpha Vantage info returned for overview:', data.Information);
       return null;
    }

    // Alpha Vantage returns empty object {} if symbol not found
    if (!data.Symbol) {
      return null;
    }

    return {
      biz: data.Description || '',
      sector: data.Sector || '',
      industry: data.Industry || '',
      roe: data.ReturnOnEquityTTM ? parseFloat(data.ReturnOnEquityTTM) : null,
      netMargin: data.ProfitMargin ? parseFloat(data.ProfitMargin) : null,
      targetPrice: data.AnalystTargetPrice ? parseFloat(data.AnalystTargetPrice) : null,
      recommendation: null, // AV Overview doesn't provide recommendation key directly
      shortInterest: data.ShortPercentOutstanding ? parseFloat(data.ShortPercentOutstanding) : null,
      beta: data.Beta ? parseFloat(data.Beta) : null,
      floatShares: data.SharesFloat ? parseFloat(data.SharesFloat) : null,
      sharesOutstanding: data.SharesOutstanding ? parseFloat(data.SharesOutstanding) : null,
      marketCap: data.MarketCapitalization ? parseFloat(data.MarketCapitalization) : null,
      pe: data.PERatio ? parseFloat(data.PERatio) : null,
      forwardPE: data.ForwardPE ? parseFloat(data.ForwardPE) : null,
      eps: data.EPS ? parseFloat(data.EPS) : null,
      divYield: data.DividendYield ? parseFloat(data.DividendYield) : null,
      fiftyTwoWkPct: data['52WeekHigh'] && data['52WeekLow'] ? null : null, // Might need to compute this if needed
      exchange: data.Exchange || ''
    };
  } catch (error) {
    console.error(`Error fetching Alpha Vantage overview for ${symbol}:`, error);
    return null;
  }
}
