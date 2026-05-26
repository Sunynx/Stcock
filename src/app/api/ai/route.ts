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

    const prompt = `คุณเป็นนักวิเคราะห์หุ้นมืออาชีพ วิเคราะห์หุ้น ${symbol} จากข้อมูลด้านล่าง แล้วตอบเป็น JSON เท่านั้น ห้ามมี markdown

ข้อมูลพื้นฐาน: ${fundamentals}

ข่าวล่าสุด:
${headlines || 'ไม่มีข่าว'}

ตอบเป็น JSON format นี้เท่านั้น:
{"aiAnalysis":"วิเคราะห์หุ้นสั้นๆ 2-3 บรรทัดภาษาไทย รวมจุดแข็ง จุดอ่อน และคำแนะนำ (ซื้อ/ถือ/รอ)","aiNewsSummary":"สรุปข่าวเป็นภาษาไทย 2 บรรทัด บอกผลกระทบต่อราคา","aiSentiment":{"score":-10 ถึง 10,"label":"bullish หรือ bearish หรือ neutral","reason":"เหตุผลสั้นๆ ภาษาไทย"}}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 400 }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorText = await res.text();
      if (res.status === 429) {
        console.warn(`[Gemini API] Rate Limit Exceeded (429).`);
      } else {
        console.error('Gemini API Error:', res.status, errorText);
      }
      return NextResponse.json({ success: false, error: `AI Error: ${res.status} - ${errorText}` }, { status: 502 });
    }

    const j = await res.json();
    const text = j?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return NextResponse.json({ success: false, error: 'Invalid response from AI' }, { status: 500 });
    }

    let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const result = JSON.parse(cleaned);

    if (!result.aiAnalysis || !result.aiSentiment) {
      return NextResponse.json({ success: false, error: 'AI output format incorrect' }, { status: 500 });
    }

    const s = result.aiSentiment;
    const score = typeof s.score === 'number' ? Math.max(-10, Math.min(10, s.score)) : 0;
    const label = ['bullish','bearish','neutral'].includes(s.label) ? s.label : 'neutral';
    const emoji = label === 'bullish' ? '🟢' : label === 'bearish' ? '🔴' : '🟡';

    const output = {
      aiAnalysis: result.aiAnalysis,
      aiNewsSummary: result.aiNewsSummary || '',
      aiSentiment: { score, label, emoji, reason: s.reason || '' }
    };

    return NextResponse.json({ success: true, ...output });

  } catch (error: any) {
    console.error('AI Route Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
