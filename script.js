/* ===================================================================
   OG BINGUS — interactions + AI Meme Lab
   The Gemini call runs server-side (/api/generate) so the API key
   (GEMINI_API_KEY, a Vercel env var) never reaches the browser.
=================================================================== */
(() => {
  "use strict";

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

  /* ---------- prompt chips ---------- */
  $$("#aiChips .chip").forEach((c) =>
    c.addEventListener("click", () => {
      $("#aiPrompt").value = c.dataset.fill;
      $("#aiPrompt").focus();
    })
  );

  /* ---------- load the OG Bingus reference image as base64 (once) ---------- */
  const REF_SRC = "binguslogo.png";
  let refPromise = null;
  function getReference() {
    if (refPromise) return refPromise;
    refPromise = fetch(REF_SRC)
      .then((r) => r.blob())
      .then((blob) =>
        new Promise((resolve, reject) => {
          const fr = new FileReader();
          fr.onload = () => {
            const url = String(fr.result);
            const comma = url.indexOf(",");
            resolve({
              mimeType: (url.slice(5, url.indexOf(";")) || "image/png"),
              data: url.slice(comma + 1),
            });
          };
          fr.onerror = reject;
          fr.readAsDataURL(blob);
        })
      )
      .catch(() => null); // generation still works without the reference
    return refPromise;
  }

  /* ===================================================================
     AI IMAGE MAKER  (calls the serverless function)
  =================================================================== */
  const aiGo = $("#aiGo");

  aiGo.addEventListener("click", async () => {
    const prompt = $("#aiPrompt").value.trim();
    if (!prompt) { toast("Describe your meme first 🐱"); $("#aiPrompt").focus(); return; }

    setLoading(aiGo, true);
    const stage = $("#aiStage");
    stage.innerHTML =
      `<div class="stage-empty"><span class="spinner" style="border-color:rgba(180,85,108,.3);border-top-color:#b5556c"></span><p>Summoning Bingus…</p></div>`;

    try {
      const ref = await getReference();
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          image: ref ? ref.data : undefined,
          mimeType: ref ? ref.mimeType : undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.image) {
        throw new Error(data.error || `Request failed (${res.status}).`);
      }

      stage.innerHTML = "";
      const img = new Image();
      img.alt = "AI generated Bingus meme";
      img.src = data.image;
      stage.appendChild(img);

      const dl = document.createElement("a");
      dl.href = data.image;
      dl.download = "og-bingus-meme.png";
      dl.className = "btn btn-primary lab-go";
      dl.textContent = "⬇ Download";
      stage.appendChild(dl);

      toast("Fresh wrinkles served 🔥");
    } catch (e) {
      stage.innerHTML = `<div class="stage-error">😿 ${e.message}</div>`;
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
})();
