import { NextResponse } from 'next/server';
import { MemoryCache } from '@/lib/memoryCache';

export const dynamic = 'force-dynamic';

const newsCache = new MemoryCache<any>(
  10 * 60 * 1000,  // 10 minutes TTL
  15 * 60 * 1000,  // 15 minutes Stale While Revalidate
  20 * 60 * 1000   // 20 minutes Cleanup interval
);

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/xml, application/xml, application/rss+xml, */*'
};

function parseRssFeed(xmlText: string, source: string): any[] {
  const items: any[] = [];
  // Match <item> blocks
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  
  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemContent = match[1];
    
    // Extract title, link, pubDate, description
    // Handles CDATA tags gracefully
    const titleMatch = itemContent.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
    const linkMatch = itemContent.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/);
    const pubDateMatch = itemContent.match(/<pubDate>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/pubDate>/);
    const descMatch = itemContent.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/);
    
    const title = (titleMatch?.[1] || '').trim();
    const link = (linkMatch?.[1] || '').trim();
    const pubDate = (pubDateMatch?.[1] || '').trim();
    let desc = (descMatch?.[1] || '').trim();
    
    // Clean up HTML tags and escape characters in description
    desc = desc
      .replace(/<[^>]*>?/gm, '') // Remove HTML tags
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
        source
      });
    }
  }
  return items;
}

export async function GET() {
  try {
    const data = await newsCache.getOrUpdate('market_news_feed', async () => {
      const [investingRes, tradingViewRes] = await Promise.allSettled([
        fetch('https://www.investing.com/rss/news_285.rss', { headers, next: { revalidate: 600 } }).then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.text();
        }),
        fetch('https://www.tradingview.com/blog/en/feed/', { headers, next: { revalidate: 600 } }).then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.text();
        })
      ]);

      const newsList: any[] = [];

      if (investingRes.status === 'fulfilled' && investingRes.value) {
        newsList.push(...parseRssFeed(investingRes.value, 'Investing.com'));
      } else if (investingRes.status === 'rejected') {
        console.error('Failed to fetch Investing.com RSS:', investingRes.reason);
      }

      if (tradingViewRes.status === 'fulfilled' && tradingViewRes.value) {
        newsList.push(...parseRssFeed(tradingViewRes.value, 'TradingView'));
      } else if (tradingViewRes.status === 'rejected') {
        console.error('Failed to fetch TradingView RSS:', tradingViewRes.reason);
      }

      // Sort by publish date descending
      newsList.sort((a, b) => b.pubDate - a.pubDate);

      // Return top 12 combined news items
      return newsList.slice(0, 12);
    });

    return NextResponse.json({ success: true, news: data });
  } catch (error: any) {
    console.error('API Error in news route:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to aggregate news' }, { status: 500 });
  }
}
