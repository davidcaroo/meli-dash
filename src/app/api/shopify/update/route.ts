import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;

    if (!WEBHOOK_URL) {
      return NextResponse.json({ success: false, error: 'Webhook URL not configured' }, { status: 500 });
    }

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    console.log(`Proxy: POST ${WEBHOOK_URL} -> Status ${response.status}`);
    console.log(`Proxy: n8n response:`, responseText);

    if (!response.ok) {
      return NextResponse.json({ success: false, error: `n8n error (${response.status}): ${responseText}` }, { status: response.status });
    }

    return NextResponse.json({ success: true, n8nResponse: responseText });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
