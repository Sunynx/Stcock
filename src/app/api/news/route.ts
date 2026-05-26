import { NextResponse } from 'next/server';
import { MemoryCache } from '@/lib/memoryCache';
import { simpleFetch_ } from '@/lib/yahoo';

export const dynamic = 'force-dynamic';

const newsCache = new MemoryCache<any>(
  5 * 60 * 1000,   // 5 minutes TTL (more frequent updates for "latest" news)
  10 * 60 * 1000,  // 10 minutes Stale While Revalidate
  15 * 60 * 1000   // 15 minutes Cleanup interval
);

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/xml, application/xml, application/rss+xml, */*'
};

function parseRssFeed(xmlText: string, defaultSource: string): any[] {
  const items: any[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  
  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemContent = match[1];
    
    const titleMatch = itemContent.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
    const linkMatch = itemContent.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/);
    const pubDateMatch = itemContent.match(/<pubDate>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/pubDate>/);
    const descMatch = itemContent.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/);
    
    const title = (titleMatch?.[1] || '').trim();
    const link = (linkMatch?.[1] || '').trim();
    const pubDate = (pubDateMatch?.[1] || '').trim();
    let desc = (descMatch?.[1] || '').trim();
    
    desc = desc
      .replace(/<[^>]*>?/gm, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();

    if (title && link) {
      items.push({
        title,
        link,
        pubDate: pubDate ? new Date(pubDate).getTime() : Date.now(),
        pubDateStr: pubDate,
        description: desc.length > 180 ? desc.substring(0, 177) + '...' : desc,
        source: defaultSource
      });
    }
  }
  return items;
}

export async function GET() {
  try {
    const data = await newsCache.getOrUpdate('index_market_news_feed', async () => {
      // 1. Fetch general index news from Yahoo Finance for S&P 500, NASDAQ, Dow, SPY, QQQ
      const yfSearchUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=SPY,QQQ,^GSPC,^IXIC,S%26P500,NASDAQ&newsCount=25&quotesCount=0&enableFuzzyQuery=false&lang=en-US`;
      
      const [investingRes, tradingViewRes, yfRes] = await Promise.allSettled([
        fetch('https://www.investing.com/rss/news_285.rss', { headers, next: { revalidate: 300 } }).then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.text();
        }),
        fetch('https://www.tradingview.com/blog/en/feed/', { headers, next: { revalidate: 300 } }).then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.text();
        }),
        simpleFetch_(yfSearchUrl)
      ]);

      const newsList: any[] = [];

      // Parse Investing.com RSS
      if (investingRes.status === 'fulfilled' && investingRes.value) {
        newsList.push(...parseRssFeed(investingRes.value, 'Investing.com'));
      }

      // Parse TradingView RSS
      if (tradingViewRes.status === 'fulfilled' && tradingViewRes.value) {
        newsList.push(...parseRssFeed(tradingViewRes.value, 'TradingView'));
      }

      // Parse Yahoo Finance Search index results
      if (yfRes.status === 'fulfilled' && yfRes.value?.news) {
        const yfNews = yfRes.value.news.map((n: any) => {
          const timestamp = n.providerPublishTime ? n.providerPublishTime * 1000 : Date.now();
          return {
            title: n.title || '',
            link: n.link || '',
            pubDate: timestamp,
            pubDateStr: new Date(timestamp).toUTCString(),
            description: n.title || '',
            source: n.publisher || 'Yahoo Finance'
          };
        });
        newsList.push(...yfNews);
      }

      // Remove duplicate links
      const seen = new Set();
      const uniqueNews = newsList.filter(item => {
        const dup = seen.has(item.link);
        seen.add(item.link);
        return !dup;
      });

      // Filter specifically for S&P 500, NASDAQ, SPX, Dow, Indices, and General US Market indicators
      const keywords = ['s&p', 'spx', 'spy', 'nasdaq', 'qqq', 'index', 'indices', 'market', 'dow', 'dia', 'ตลาดหุ้น', 'ดัชนี'];
      const filteredNews = uniqueNews.filter(item => {
        const text = (item.title + ' ' + (item.description || '')).toLowerCase();
        return keywords.some(kw => text.includes(kw));
      });

      // Sort by publish date descending (latest first)
      filteredNews.sort((a, b) => b.pubDate - a.pubDate);

      // Return top 12 latest relevant news items
      return filteredNews.slice(0, 12);
    });

    return NextResponse.json({ success: true, news: data });
  } catch (error: any) {
    console.error('API Error in index news route:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to aggregate index news' }, { status: 500 });
  }
}
