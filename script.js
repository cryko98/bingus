/* ===================================================================
   OG BINGUS — interactions + Gemini-powered Meme Lab
=================================================================== */
(() => {
  "use strict";

  /* ---------- tiny helpers ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
  }

  /* ---------- copy contract address ---------- */
  $("#caCopy").addEventListener("click", async () => {
    const ca = $("#ca").textContent.trim();
    try {
      await navigator.clipboard.writeText(ca);
      toast("Contract copied — hi bingus 🐾");
    } catch {
      toast("Couldn't copy, select it manually");
    }
  });

  /* ---------- API key persistence ---------- */
  const KEY_STORE = "bingus_gemini_key";
  const apiKeyInput = $("#apiKey");
  apiKeyInput.value = localStorage.getItem(KEY_STORE) || "";
  $("#saveKey").addEventListener("click", () => {
    const v = apiKeyInput.value.trim();
    if (!v) { localStorage.removeItem(KEY_STORE); toast("Key cleared"); return; }
    localStorage.setItem(KEY_STORE, v);
    toast("Key saved in this browser ✓");
  });
  const getKey = () => apiKeyInput.value.trim() || localStorage.getItem(KEY_STORE) || "";

  /* ---------- tabs ---------- */
  $$(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      $$(".tab").forEach((t) => t.classList.remove("is-active"));
      tab.classList.add("is-active");
      const which = tab.dataset.tab;
      $("#panel-ai").hidden = which !== "ai";
      $("#panel-caption").hidden = which !== "caption";
    });
  });

  /* ---------- prompt chips ---------- */
  $$("#aiChips .chip").forEach((c) =>
    c.addEventListener("click", () => { $("#aiPrompt").value = c.dataset.fill; })
  );

  /* ===================================================================
     GEMINI CALLS
  =================================================================== */
  const GEM = "https://generativelanguage.googleapis.com/v1beta/models";

  // Generate an image with gemini-2.5-flash-image (nano banana)
  async function geminiImage(prompt) {
    const key = getKey();
    if (!key) throw new Error("NO_KEY");
    const res = await fetch(`${GEM}/gemini-2.5-flash-image:generateContent?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text:
          `${prompt}. High quality meme illustration of Bingus the famous wrinkly hairless sphynx cat ` +
          `(pink skin, big blue eyes, large ears). Funny, shareable, internet meme aesthetic.` }] }],
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(parseApiError(res.status, body));
    }
    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const img = parts.find((p) => p.inlineData?.data);
    if (!img) {
      const txt = parts.find((p) => p.text)?.text;
      throw new Error(txt ? `Gemini replied with text instead of an image: "${txt.slice(0, 120)}"` : "No image returned.");
    }
    return `data:${img.inlineData.mimeType || "image/png"};base64,${img.inlineData.data}`;
  }

  // Generate a punchy meme caption with gemini-2.5-flash
  async function geminiCaption() {
    const key = getKey();
    if (!key) throw new Error("NO_KEY");
    const res = await fetch(`${GEM}/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text:
          "Write a short, funny TWO-LINE meme caption about $BINGUS, a Solana memecoin based on " +
          "Bingus the wrinkly sphynx cat. Crypto degen humor, wholesome chaos. " +
          'Respond ONLY as JSON: {"top":"<all caps top text>","bottom":"<all caps bottom text>"}. ' +
          "Keep each line under 40 characters." }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 1.1 },
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(parseApiError(res.status, body));
    }
    const data = await res.json();
    const txt = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    let obj;
    try { obj = JSON.parse(txt); }
    catch { obj = { top: "WHEN $BINGUS PUMPS", bottom: "HI BINGUS" }; }
    return obj;
  }

  function parseApiError(status, body) {
    let msg = "";
    try { msg = JSON.parse(body)?.error?.message || ""; } catch { /* noop */ }
    if (status === 400 && /API key not valid/i.test(msg)) return "Invalid API key. Double-check it.";
    if (status === 403) return "Access denied — your key may not have access to this model.";
    if (status === 429) return "Rate limited. Wait a moment and try again.";
    if (status === 404) return "Model not found for your key/region. Try again later.";
    return msg || `Request failed (${status}).`;
  }

  /* ===================================================================
     AI IMAGE MAKER
  =================================================================== */
  const aiGo = $("#aiGo");
  aiGo.addEventListener("click", async () => {
    const prompt = $("#aiPrompt").value.trim();
    if (!prompt) { toast("Describe your meme first 🐱"); return; }
    if (!getKey()) { toast("Add a Gemini API key above"); apiKeyInput.focus(); return; }

    setLoading(aiGo, true);
    const stage = $("#aiStage");
    stage.innerHTML = `<div class="stage-empty"><span class="spinner" style="border-color:rgba(180,85,108,.3);border-top-color:#b5556c"></span><p>Summoning Bingus…</p></div>`;
    try {
      const src = await geminiImage(prompt);
      stage.innerHTML = "";
      const img = new Image();
      img.alt = "AI generated Bingus meme";
      img.src = src;
      stage.appendChild(img);
      const dl = makeDownload(src, "og-bingus-meme.png", "⬇ Download");
      stage.appendChild(dl);
      toast("Fresh wrinkles served 🔥");
    } catch (e) {
      stage.innerHTML = `<div class="stage-error">${e.message === "NO_KEY"
        ? "Add your Gemini API key above to generate images."
        : "😿 " + e.message}</div>`;
    } finally {
      setLoading(aiGo, false);
    }
  });

  function setLoading(btn, on) {
    btn.classList.toggle("is-loading", on);
    btn.disabled = on;
    const sp = $(".spinner", btn);
    if (sp) sp.hidden = !on;
  }

  function makeDownload(href, name, label) {
    const a = document.createElement("a");
    a.href = href; a.download = name; a.className = "btn btn-primary lab-go"; a.textContent = label;
    return a;
  }

  /* ===================================================================
     CLASSIC CAPTION MAKER  (canvas + the OG Bingus SVG)
  =================================================================== */
  const canvas = $("#capCanvas");
  const ctx = canvas.getContext("2d");

  // Build a standalone SVG string of Bingus from the inline <symbol> + gradients
  function bingusSVG() {
    const inner = $("#bingus").innerHTML;
    const g1 = $("#headShade").outerHTML;
    const g2 = $("#bodyShade").outerHTML;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 340"><defs>${g1}${g2}</defs>${inner}</svg>`;
  }

  let bingusImg = null;
  function loadBingus() {
    return new Promise((resolve) => {
      if (bingusImg) return resolve(bingusImg);
      const svg = bingusSVG();
      const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
      const img = new Image();
      img.onload = () => { bingusImg = img; resolve(img); };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  async function drawMeme(top, bottom) {
    const W = canvas.width, H = canvas.height;
    // background
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#ffe9dd");
    grad.addColorStop(1, "#ffd2dc");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // bingus centered
    const img = await loadBingus();
    if (img) {
      const size = 460;
      ctx.drawImage(img, (W - size) / 2, (H - size) / 2 + 20, size, size * (340 / 320));
    }

    // meme text
    drawText(top, H * 0.16, W);
    drawText(bottom, H * 0.9, W);
  }

  function drawText(text, y, W) {
    if (!text) return;
    text = text.toUpperCase();
    let size = 64;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    // shrink to fit
    do {
      ctx.font = `800 ${size}px Impact, 'Arial Black', 'Baloo 2', sans-serif`;
      size -= 2;
    } while (ctx.measureText(text).width > W - 50 && size > 22);

    ctx.lineWidth = size / 7;
    ctx.strokeStyle = "#2c1820";
    ctx.strokeText(text, W / 2, y);
    ctx.fillStyle = "#fff";
    ctx.fillText(text, W / 2, y);
  }

  const capTop = $("#capTop");
  const capBottom = $("#capBottom");
  const redraw = () => drawMeme(capTop.value || "", capBottom.value || "");
  capTop.addEventListener("input", redraw);
  capBottom.addEventListener("input", redraw);

  // initial canvas render
  loadBingus().then(() => drawMeme("HI BINGUS", "$BINGUS"));

  // let Gemini write the caption
  $("#capAi").addEventListener("click", async () => {
    if (!getKey()) { toast("Add a Gemini API key above"); apiKeyInput.focus(); return; }
    const btn = $("#capAi");
    const old = btn.textContent;
    btn.textContent = "✨ thinking…"; btn.disabled = true;
    try {
      const { top, bottom } = await geminiCaption();
      capTop.value = top || ""; capBottom.value = bottom || "";
      await redraw();
      toast("Caption brewed by Gemini ✓");
    } catch (e) {
      toast(e.message === "NO_KEY" ? "Add your Gemini key first" : "😿 " + e.message);
    } finally {
      btn.textContent = old; btn.disabled = false;
    }
  });

  // download caption meme
  $("#capDownload").addEventListener("click", () => {
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "og-bingus-caption.png";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast("Saved — go spread the wrinkle 🐾");
    }, "image/png");
  });
})();
