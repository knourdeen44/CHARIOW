/*
 * video.js — Génère une courte VIDÉO de pub (texte animé) dans le navigateur.
 *
 * 100 % gratuit, sans clé, sans serveur : on dessine un fond animé + du texte sur un
 * <canvas>, et on enregistre en .webm via MediaRecorder. Idéal Status / TikTok (vertical).
 *
 * Fond :
 *   - par défaut : dégradé animé aux couleurs de la marque (vert/ambre) — toujours fiable.
 *   - optionnel : une image que TU fournis (fichier local) — pas de problème de CORS.
 *     (Les images IA en ligne sont bloquées au canvas par leur anti-bot ; on les contourne
 *      en te laissant déposer le fichier, ce qui est propre et instantané.)
 */

const Video = (() => {
  function sizeFor(plateforme = "") {
    if (/facebook|feed/i.test(plateforme)) return { w: 1080, h: 1080 };
    return { w: 720, h: 1280 };
  }

  function supported() {
    if (typeof MediaRecorder === "undefined") return false;
    return ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].some((m) =>
      MediaRecorder.isTypeSupported(m)
    );
  }

  // Charge un fichier image local (object URL) -> propre pour le canvas (même origine).
  function loadLocalImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Image illisible"));
      img.src = url;
    });
  }

  function drawCover(ctx, img, W, H, zoom) {
    const s = Math.max(W / img.width, H / img.height) * zoom;
    const w = img.width * s;
    const h = img.height * s;
    ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
  }

  // Fond dégradé animé (vert -> ambre) + bulles douces qui dérivent.
  function drawGradientBg(ctx, W, H, t) {
    const shift = (Math.sin(t * 0.6) + 1) / 2; // 0..1
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#0f5e39");
    g.addColorStop(Math.min(0.9, 0.4 + shift * 0.3), "#16794a");
    g.addColorStop(1, "#d97706");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 0.12;
    for (let i = 0; i < 4; i++) {
      const x = W * (0.2 + 0.2 * i) + Math.sin(t * 0.8 + i) * 60;
      const y = H * (0.15 + 0.22 * i) + Math.cos(t * 0.6 + i) * 60;
      const r = W * (0.22 + 0.05 * i);
      ctx.fillStyle = i % 2 ? "#ffffff" : "#fbbf24";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function wrap(ctx, text, maxWidth) {
    const words = (text || "").split(/\s+/);
    const lines = [];
    let line = "";
    for (const word of words) {
      const test = line ? line + " " + word : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else line = test;
    }
    if (line) lines.push(line);
    return lines;
  }

  function drawTextBlock(ctx, text, W, H, opts = {}) {
    const size = opts.size || Math.round(W / 13);
    ctx.font = `bold ${size}px Arial, sans-serif`;
    ctx.textAlign = "center";
    const lines = wrap(ctx, text, W * 0.86);
    const lh = size * 1.2;
    let y = (opts.y != null ? opts.y : H * 0.72) - (lines.length * lh) / 2;
    lines.forEach((ln) => {
      ctx.lineWidth = size / 6;
      ctx.strokeStyle = "rgba(0,0,0,0.55)";
      ctx.fillStyle = opts.color || "#ffffff";
      ctx.strokeText(ln, W / 2, y);
      ctx.fillText(ln, W / 2, y);
      y += lh;
    });
  }

  /*
   * create({ lines, texteEcran, plateforme, bgImageFile?, onProgress })
   * Retourne une Promise<Blob> (.webm).
   */
  async function create({ lines, texteEcran, plateforme, bgImageFile, onProgress }) {
    if (!supported()) throw new Error("Ton navigateur ne sait pas enregistrer de vidéo (essaie Chrome).");

    const { w: W, h: H } = sizeFor(plateforme);
    const bg = bgImageFile ? await loadLocalImage(bgImageFile) : null;

    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    const mime = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find((m) =>
      MediaRecorder.isTypeSupported(m)
    );
    const stream = canvas.captureStream(30);
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 4000000 });
    const chunks = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);

    const segs = lines.filter(Boolean);
    const SEG = 3500;
    const total = segs.length * SEG;

    return new Promise((resolve, reject) => {
      rec.onstop = () => resolve(new Blob(chunks, { type: mime }));
      rec.onerror = (e) => reject(e.error || new Error("Erreur enregistrement"));
      rec.start();

      const t0 = performance.now();
      function frame(now) {
        const elapsed = now - t0;
        if (elapsed >= total) {
          rec.stop();
          return;
        }
        const seg = Math.min(segs.length - 1, Math.floor(elapsed / SEG));
        const segT = (elapsed - seg * SEG) / SEG;
        const tSec = elapsed / 1000;

        if (bg) {
          ctx.fillStyle = "#0f5e39";
          ctx.fillRect(0, 0, W, H);
          drawCover(ctx, bg, W, H, 1.0 + (elapsed / total) * 0.1);
        } else {
          drawGradientBg(ctx, W, H, tSec);
        }

        // Voile bas pour lisibilité
        const grad = ctx.createLinearGradient(0, H * 0.45, 0, H);
        grad.addColorStop(0, "rgba(0,0,0,0)");
        grad.addColorStop(1, "rgba(0,0,0,0.75)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, H * 0.45, W, H * 0.55);

        if (texteEcran) {
          drawTextBlock(ctx, texteEcran, W, H, { size: Math.round(W / 20), y: H * 0.1, color: "#fbbf24" });
        }

        ctx.globalAlpha = Math.min(1, segT * 3);
        drawTextBlock(ctx, segs[seg], W, H, { y: H * 0.74 });
        ctx.globalAlpha = 1;

        if (onProgress) onProgress(Math.round((elapsed / total) * 100));
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
  }

  return { create, supported, sizeFor };
})();
