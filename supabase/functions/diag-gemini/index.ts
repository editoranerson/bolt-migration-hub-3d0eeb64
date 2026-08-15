import { corsHeaders } from "../_shared/cors.ts";

export default async function handler(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  const results: Record<string, unknown> = {};

  // 1. Check if key exists
  results.key_present = !!apiKey;
  results.key_prefix = apiKey ? apiKey.slice(0, 8) + "..." : "NONE";
  results.key_length = apiKey ? apiKey.length : 0;

  if (!apiKey) {
    return new Response(JSON.stringify(results, null, 2), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // 2. Test models that might work
  const modelsToTest = [
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.5-flash-lite",
    "gemini-1.5-flash",
    "gemini-flash-latest",
  ];

  results.model_tests = [];

  for (const model of modelsToTest) {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "Diga olá" }] }],
          generationConfig: { temperature: 0.9, maxOutputTokens: 50 },
        }),
      });

      clearTimeout(timeoutId);

      const text = await res.text();
      let parsed: unknown = null;
      try {
        parsed = JSON.parse(text);
      } catch {
        /* keep null */
      }

      const p = parsed as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        error?: { message?: string; status?: string };
      };
      results.model_tests.push({
        model,
        status: res.status,
        ok: res.ok,
        reply: p?.candidates?.[0]?.content?.parts?.[0]?.text ?? null,
        error: p?.error ?? null,
        raw_snippet: text.slice(0, 300),
      });
    } catch (err) {
      results.model_tests.push({
        model,
        error: err instanceof Error ? `${err.name}: ${err.message}` : String(err),
      });
    }
  }

  // 3. List available models
  try {
    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const listRes = await fetch(listUrl);
    const listData = await listRes.json();
    results.list_status = listRes.status;
    results.available_models = (listData.models ?? []).map(
      (m: { name: string; displayName: string }) => ({
        name: m.name,
        displayName: m.displayName,
      }),
    );
  } catch (err) {
    results.list_error = err instanceof Error ? err.message : String(err);
  }

  return new Response(JSON.stringify(results, null, 2), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}
