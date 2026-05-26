import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { symbol, fundamentals, headlines, provider = 'gemini' } = body;

    const prompt = `คุณคือ "ผู้ชี้ขาดการจัดการความเสี่ยงและผู้ดำเนินรายการโต๊ะกลม (Risk Management Judge and Debate Facilitator)" 
หน้าที่ของคุณคือประเมินข้อโต้แย้งจำลองจากนักวิเคราะห์ 3 สาย (Risky Analyst, Neutral Analyst, Safe Analyst) ที่วิเคราะห์ข้อมูลของหุ้น ${symbol}
จากนั้นให้คุณตัดสินใจและออกคำแนะนำแบบเฉียบขาด โดยตอบเป็น "ภาษาไทย" (เว้นแต่หัวข้อหลักให้ใช้ภาษาอังกฤษตามที่กำหนด) ห้ามใช้สัญลักษณ์ Markdown (เช่นดอกจันหรือเครื่องหมายชาร์ป) แต่ให้จัดเรียงย่อหน้าและเว้นบรรทัดให้อ่านง่าย โดยต้องมีโครงสร้าง 4 ส่วนนี้เท่านั้น:

1. SUMMARY OF KEY ARGUMENTS
- Risky Analyst: สรุปมุมมองเชิงบวก โอกาสเติบโต และปัจจัยกระตุ้นราคา (Catalyst) ที่น่าสนใจที่สุด
- Safe Analyst: ยกคำเตือนเรื่องความเสี่ยง ความผันผวน (เช่น ATR กว้าง) หรือสัญญาณเตือนทางเทคนิค/มหภาค
- Neutral Analyst: สรุปมุมมองกลางๆ สภาพตลาดแบบ Range-bound หรือจุดเปลี่ยนสำคัญที่ต้องจับตา

2. RATIONALE FOR THE DECISION
อธิบายเหตุผลในการตัดสินใจแบบลึกซึ้ง ว่าทำไมน้ำหนักถึงเอียงไปทางฝั่งใดฝั่งหนึ่ง และความเสี่ยงใดที่ต้องระวังเป็นพิเศษ

3. LEARNINGS FROM PAST MISTAKES
ให้คุณจำลองบทเรียนจากความผิดพลาดในอดีต (เช่น การเข้าซื้อตอนผันผวนสูง หรือ การรีบขายหมูเกินไป) และนำมาปรับใช้ในการเข้าซื้อหุ้น ${symbol} รอบนี้

4. REFINED STRATEGIC PLAN (THE DECISION)
- Recommendation: [BUY / HOLD / SELL]
- Initial Entry: แผนการเข้าซื้อไม้แรก (ระบุระดับราคา หรือ สัดส่วนความเสี่ยง)
- Secondary Entry: [ถ้ามี] แผนการซื้อไม้ที่สอง หากเงื่อนไขบางอย่างเป็นจริง
- Risk Management (Stop-Loss): จุดตัดขาดทุน หรือจุดหนีตายเมื่อผิดทาง
- Monitoring: ปัจจัยหรือตัวเลขทางเศรษฐกิจ/ธุรกิจที่ต้องจับตาดูอย่างใกล้ชิด

ข้อมูลพื้นฐานของหุ้น: 
${fundamentals}

ข่าวล่าสุดและ Sentiment ของตลาด:
${headlines || 'ไม่มีข่าว'}`;

    let apiKey = '';
    let url = '';
    let headers: Record<string, string> = { 'Content-Type': 'application/json' };
    let payload: any = {};
    let isStreamGenerateContent = false;
    let isOpenAICompatible = false;

    if (provider === 'groq') {
      apiKey = process.env.GROQ_API_KEY || '';
      if (!apiKey) return NextResponse.json({ success: false, error: 'GROQ_API_KEY is not configured in .env.local' }, { status: 500 });
      url = 'https://api.groq.com/openai/v1/chat/completions';
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      };
      payload = {
        model: 'llama3-8b-8192', // Fast fallback, but let's use a standard model
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 1000,
        stream: true
      };
      payload.model = 'llama3-70b-8192'; // Better Groq model
      isOpenAICompatible = true;
    } else if (provider === 'openrouter') {
      apiKey = process.env.OPENROUTER_API_KEY || '';
      if (!apiKey) return NextResponse.json({ success: false, error: 'OPENROUTER_API_KEY is not configured in .env.local' }, { status: 500 });
      url = 'https://openrouter.ai/api/v1/chat/completions';
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'StockSense Pro'
      };
      payload = {
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 1000,
        stream: true
      };
      isOpenAICompatible = true;
    } else {
      apiKey = process.env.GEMINI_API_KEY || '';
      if (!apiKey) return NextResponse.json({ success: false, error: 'GEMINI_API_KEY is not configured in .env.local' }, { status: 500 });
      url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${apiKey}`;
      payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 800 }
      };
      isStreamGenerateContent = true;
    }

    let res: Response | null = null;
    let attempts = 0;
    const maxAttempts = 3;
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    while (attempts < maxAttempts) {
      attempts++;
      try {
        res = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });

        if (res.status === 429) {
          if (attempts < maxAttempts) {
            const waitTime = 2000 * attempts;
            console.warn(`[AI API] Rate Limit (429) hit. Retrying in ${waitTime}ms... (Attempt ${attempts}/${maxAttempts})`);
            await delay(waitTime);
            continue;
          }
        }
        break; // If success or non-429 error, break loop
      } catch (err) {
        if (attempts >= maxAttempts) {
          throw err;
        }
        await delay(1000 * attempts);
      }
    }

    if (!res || !res.ok) {
      const status = res ? res.status : 500;
      const errorText = res ? await res.text() : 'No response from API';
      if (status === 429) {
        return NextResponse.json({ success: false, error: 'ระบบ AI มีผู้ใช้งานเยอะเกินไป (Error 429 Rate Limit) กรุณารอสักครู่แล้วกดวิเคราะห์ใหม่ครับ ⏳' }, { status: 429 });
      }
      return NextResponse.json({ success: false, error: `AI Error: ${status} - ${errorText}` }, { status: 502 });
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
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const dataStr = trimmed.slice(6);
              if (dataStr.trim() === '[DONE]') continue;
              try {
                const data = JSON.parse(dataStr);
                let textChunk = '';
                if (isOpenAICompatible) {
                  textChunk = data?.choices?.[0]?.delta?.content || '';
                } else {
                  textChunk = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
                }
                
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
