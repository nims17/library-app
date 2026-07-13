import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Uses Google's Gemini API (free tier, no billing account required) to
// read a photo of a book's cover and identify its title/author, so the
// admin's Add-a-Book form can auto-fill instead of requiring the title to
// be typed by hand. Best-effort: if it can't make out the cover, it just
// returns nulls and the admin falls back to typing the title in.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured" },
      { status: 500 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("photo");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No photo provided" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const base64 = bytes.toString("base64");
  const mimeType = file.type || "image/jpeg";

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const requestBody = {
    contents: [
      {
        parts: [
          {
            text:
              "This is a photo of a book's front cover. Identify the exact " +
              "title and author as printed on it. Respond with ONLY compact " +
              'JSON, no markdown fences, no other text, in this exact shape: ' +
              '{"title": string or null, "author": string or null}. Use null ' +
              "for a field if the photo doesn't clearly show it.",
          },
          { inline_data: { mime_type: mimeType, data: base64 } },
        ],
      },
    ],
    generationConfig: { temperature: 0 },
  };

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
  } catch {
    return NextResponse.json(
      { error: "Couldn't reach the book identification service." },
      { status: 502 }
    );
  }

  if (!res.ok) {
    return NextResponse.json(
      { error: `Book identification failed (${res.status})` },
      { status: 502 }
    );
  }

  const json = await res.json();
  const text: string | undefined =
    json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    return NextResponse.json(
      { error: "Couldn't read a response from the identification service." },
      { status: 502 }
    );
  }

  // Gemini usually returns clean JSON given the instructions above, but
  // strip any ```json fences defensively in case a fenced block slips in.
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();

  let parsed: { title?: string | null; author?: string | null };
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return NextResponse.json(
      { title: null, author: null, error: "Couldn't make out that cover." }
    );
  }

  return NextResponse.json({
    title: parsed.title || null,
    author: parsed.author || null,
  });
}
