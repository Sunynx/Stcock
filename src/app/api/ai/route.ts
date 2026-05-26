import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { symbol, fundamentals, headlines } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'GEMINI_API_KEY is not configured in .env' }, { status: 500 });
    }

    const prompt = `คุณเป็นนักวิเคราะห์หุ้นมืออาชีพ วิเคราะห์หุ้น ${symbol} จากข้อมูลด้านล่าง ตอบเป็นรูปแบบ Markdown ให้อ่านง่าย สวยงาม มีหัวข้อดังนี้:
1. สรุปภาพรวม (Executive Summary) - วิเคราะห์สั้นๆ รวมจุดแข็ง จุดอ่อน และคำแนะนำ (ซื้อ/ถือ/รอ)
2. สรุปข่าวล่าสุด - บอกผลกระทบต่อราคา
3. Sentiment - บอกว่า Bullish, Bearish, หรือ Neutral พร้อมเหตุผลสั้นๆ

ข้อมูลพื้นฐาน: ${fundamentals}

ข่าวล่าสุด:
${headlines || 'ไม่มีข่าว'}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${apiKey}`;
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 800 }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json({ success: false, error: `AI Error: ${res.status}` }, { status: 502 });
    }

    const stream = new ReadableStream({
      async start(controller) {
        const reader = res.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6);
              if (dataStr.trim() === '[DONE]') continue;
              try {
                const data = JSON.parse(dataStr);
                const textChunk = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (textChunk) {
                  controller.enqueue(new TextEncoder().encode(textChunk));
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
      },
    });

  } catch (error: any) {
    console.error('AI Route Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
