// Vercel serverless function — generates a Bingus meme with Gemini.
// The API key is read from the GEMINI_API_KEY environment variable and
// never exposed to the browser. Set it in Vercel → Project → Settings →
// Environment Variables as GEMINI_API_KEY.

const MODEL = "gemini-2.5-flash-image";

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return res.status(500).json({ error: "Server is missing GEMINI_API_KEY. Add it in your Vercel project settings." });
  }

  try {
    const body = await readBody(req);
    const { prompt, image, mimeType } = body;
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Missing prompt." });
    }

    const parts = [];
    // The OG Bingus reference image (so the result actually looks like him)
    if (image) {
      parts.push({ inlineData: { mimeType: mimeType || "image/png", data: image } });
    }
    parts.push({
      text:
        `${prompt}. Create a high-quality, funny, shareable internet meme featuring Bingus — ` +
        `the wrinkly hairless sphynx cat shown in the reference image. Keep his pink skin, ` +
        `big dark eyes, large ears and unmistakable look. Bold meme aesthetic.`,
    });

    const apiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts }] }),
      }
    );

    const data = await apiRes.json().catch(() => ({}));
    if (!apiRes.ok) {
      return res.status(apiRes.status).json({ error: cleanError(apiRes.status, data) });
    }

    const outParts = data?.candidates?.[0]?.content?.parts || [];
    const imgPart = outParts.find((p) => p.inlineData && p.inlineData.data);
    if (!imgPart) {
      const txt = outParts.find((p) => p.text)?.text;
      return res.status(502).json({
        error: txt
          ? `Gemini replied with text instead of an image: "${txt.slice(0, 140)}"`
          : "No image was returned. Try rephrasing your prompt.",
      });
    }

    return res.status(200).json({
      image: `data:${imgPart.inlineData.mimeType || "image/png"};base64,${imgPart.inlineData.data}`,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Server error." });
  }
};

// Read + parse the JSON body whether or not the platform pre-parsed it.
function readBody(req) {
  if (req.body) {
    return typeof req.body === "string" ? safeJson(req.body) : req.body;
  }
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => { raw += chunk; });
    req.on("end", () => resolve(safeJson(raw)));
    req.on("error", () => resolve({}));
  });
}

function safeJson(s) {
  try { return JSON.parse(s || "{}"); } catch { return {}; }
}

function cleanError(status, data) {
  const msg = data?.error?.message || "";
  if (status === 400 && /API key not valid/i.test(msg)) return "The server's GEMINI_API_KEY is invalid.";
  if (status === 403) return "Access denied — the key may not have access to this model.";
  if (status === 429) return "Rate limited by Gemini. Wait a moment and try again.";
  if (status === 404) return "Model unavailable for this key/region right now.";
  return msg || `Gemini request failed (${status}).`;
}
