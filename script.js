/* ---------------------------------------------------------
   Data
--------------------------------------------------------- */
let WORDS = [
  { en: "Butterfly", id: "Kupu-kupu" },
  { en: "Whisper", id: "Bisikan" },
  { en: "Journey", id: "Perjalanan" },
  { en: "Mirror", id: "Cermin" },
  { en: "Thunder", id: "Guntur" },
  { en: "Pillow", id: "Bantal" },
  { en: "Harvest", id: "Panen" },
  { en: "Shadow", id: "Bayangan" },
  { en: "Compass", id: "Kompas" },
  { en: "Lantern", id: "Lentera" },
  { en: "Feather", id: "Bulu" },
  { en: "Horizon", id: "Cakrawala" },
  { en: "Puzzle", id: "Teka-teki" },
  { en: "Anchor", id: "Jangkar" },
  { en: "Blossom", id: "Kuncup Bunga" },
  { en: "Whistle", id: "Peluit" },
  { en: "Canyon", id: "Ngarai" },
  { en: "Drizzle", id: "Gerimis" },
  { en: "Umbrella", id: "Payung" },
  { en: "Lighthouse", id: "Mercusuar" },
];

let order = WORDS.map((_, i) => i);
let currentIndex = 0;
let isShuffled = false;

const cardEl = document.getElementById("card");
const cardInner = document.getElementById("cardInner");
const wordEnEl = document.getElementById("wordEn");
const wordIdEl = document.getElementById("wordId");
const counterEl = document.getElementById("counter");
const btnBack = document.getElementById("btnBack");
const btnNext = document.getElementById("btnNext");
const btnShuffle = document.getElementById("btnShuffle");
const shuffleLabel = document.getElementById("shuffleLabel");

/* ==========================================================
Bagian untuk databse di bawah ini
========================================================== */

const STORAGE_KEY = "flashcard_words";

const editWordsBtn = document.getElementById("editWordsBtn");
const editorModal = document.getElementById("editorModal");
const editorTextarea = document.getElementById("editorTextarea");
const saveEditor = document.getElementById("saveEditor");
const cancelEditor = document.getElementById("cancelEditor");

const modalContent = document.querySelector(".modal-content");

/* ==========================================================
Sampai Sini
========================================================== */

/* Durasi ini harus sama dengan transition transform di .card-inner
   (style.css), supaya sensor kebuka tepat saat animasi selesai. */
const CARD_FLIP_MS = window.matchMedia("(prefers-reduced-motion: reduce)")
  .matches
  ? 0
  : 650;
let censorTimeoutId = null;

function render(censorDuringFlip) {
  const w = WORDS[order[currentIndex]];
  const wasFlipped = cardEl.classList.contains("flipped");

  if (censorDuringFlip && wasFlipped) {
    window.clearTimeout(censorTimeoutId);
    wordIdEl.classList.add("censored");
    censorTimeoutId = window.setTimeout(() => {
      wordIdEl.classList.remove("censored");
    }, CARD_FLIP_MS);
  }

  wordEnEl.textContent = w.en;
  wordIdEl.textContent = w.id;
  counterEl.textContent = `${String(currentIndex + 1).padStart(2, "0")} / ${WORDS.length}`;
  cardEl.classList.remove("flipped");
}

/* ==========================================================
   LOAD & SAVE
========================================================== */

function refreshOrder() {
  order = WORDS.map((_, i) => i);

  if (currentIndex >= WORDS.length) {
    currentIndex = 0;
  }

  counterEl.textContent = `${String(currentIndex + 1).padStart(2, "0")} / ${WORDS.length}`;

  render();
}

function wordsToText() {
  return WORDS.map((w) => `${w.en},${w.id}`).join("\n");
}

function openEditor() {
  editorTextarea.value = wordsToText();

  editorModal.classList.add("show");

  editorTextarea.focus();
}

function closeEditor() {
  editorModal.classList.remove("show");
}

/* ==========================================================
   SAVE EDITOR
========================================================== */

function saveWords() {
  const lines = editorTextarea.value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const newWords = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const comma = line.indexOf(",");

    if (comma === -1) {
      alert(
        `Baris ${i + 1} tidak valid.\n\nGunakan format:\nEnglish,Indonesia`,
      );

      return;
    }

    const en = line.substring(0, comma).trim();
    const id = line.substring(comma + 1).trim();

    if (!en || !id) {
      alert(`Baris ${i + 1} tidak valid.`);

      return;
    }

    newWords.push({
      en,
      id,
    });
  }

  if (newWords.length === 0) {
    alert("Minimal harus ada satu kata.");

    return;
  }

  WORDS = newWords;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(WORDS));

  refreshOrder();

  closeEditor();
}

function goNext() {
  currentIndex = (currentIndex + 1) % order.length;
  render(true);
}

function goBack() {
  currentIndex = (currentIndex - 1 + order.length) % order.length;
  render(true);
}

function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function toggleShuffle() {
  isShuffled = !isShuffled;
  if (isShuffled) {
    order = shuffleArray(WORDS.map((_, i) => i));
    shuffleLabel.textContent = "Urut";
    btnShuffle.classList.add("is-shuffled");
  } else {
    order = WORDS.map((_, i) => i);
    shuffleLabel.textContent = "Acak";
    btnShuffle.classList.remove("is-shuffled");
  }
  currentIndex = 0;
  render();
}

function flipCard() {
  cardEl.classList.toggle("flipped");
}

// mouse clicks are handled by the page-wide click listener below (splash
// follows the cursor anywhere), so this only needs to toggle the flip
cardEl.addEventListener("click", () => flipCard());
cardEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    flipCard();
    const rect = cardEl.getBoundingClientRect();
    spawnSplash(rect.left + rect.width / 2, rect.top + rect.height / 2);
  }
});

btnNext.addEventListener("click", goNext);
btnBack.addEventListener("click", goBack);
btnShuffle.addEventListener("click", toggleShuffle);

/* ==========================================================
   KUNCI TOMBOL EDIT SAAT MOBILE LANDSCAPE
   Modal editor butuh ruang vertikal yang cukup, jadi di HP
   posisi landscape tombol Edit dinonaktifkan dan labelnya
   berubah menjadi ajakan untuk memutar layar ke portrait.
========================================================== */

const mobileLandscapeQuery = window.matchMedia(
  "(orientation: landscape) and (max-height: 500px)",
);

function updateEditLockState(e) {
  const isLocked = e.matches;
  editWordsBtn.disabled = isLocked;
  editWordsBtn.setAttribute("aria-disabled", String(isLocked));
  editWordsBtn.setAttribute(
    "aria-label",
    isLocked ? "Putar layar ke mode portrait untuk mengedit" : "Edit kata",
  );
  if (isLocked && editorModal.classList.contains("show")) {
    closeEditor();
  }
}

updateEditLockState(mobileLandscapeQuery);
mobileLandscapeQuery.addEventListener("change", updateEditLockState);

editWordsBtn.addEventListener("click", () => {
  if (editWordsBtn.disabled) return;
  openEditor();
});

cancelEditor.addEventListener("click", closeEditor);

saveEditor.addEventListener("click", saveWords);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && editorModal.classList.contains("show")) {
    closeEditor();
  }
});

editorModal.addEventListener("pointerdown", (e) => {
  spawnSplash(e.clientX, e.clientY);

  if (e.target === editorModal) {
    closeEditor();
  }
});

document
  .querySelector(".modal-content")
  .addEventListener("pointerdown", (e) => {
    spawnSplash(e.clientX, e.clientY);
  });

document.addEventListener("keydown", (e) => {
  if (e.target === cardEl) return;
  if (e.key === "ArrowRight") goNext();
  if (e.key === "ArrowLeft") goBack();
});

const savedWords = localStorage.getItem(STORAGE_KEY);

if (savedWords) {
  try {
    WORDS = JSON.parse(savedWords);
  } catch (e) {
    console.error(e);
  }
}

order = WORDS.map((_, i) => i);

render();

/* ---------------------------------------------------------
   Rain + splash canvas
   Uses gambar1.png as the particle sprite. If the file isn't
   present yet, a soft vector drop is drawn instead so the
   page still looks finished — it swaps to the real image
   automatically once gambar1.png is added.
--------------------------------------------------------- */
const rainCanvas = document.getElementById("rainCanvas");
const rainCtx = rainCanvas.getContext("2d");
const splashCanvas = document.getElementById("splashCanvas");
const splashCtx = splashCanvas.getContext("2d");
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

let dpr = Math.min(window.devicePixelRatio || 1, 2);
let W = window.innerWidth;
let H = window.innerHeight;

function setupCanvas(canvas, ctx) {
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function resize() {
  W = window.innerWidth;
  H = window.innerHeight;
  setupCanvas(rainCanvas, rainCtx);
  setupCanvas(splashCanvas, splashCtx);
}
window.addEventListener("resize", resize);
resize();

let spriteReady = false;
const sprite = new Image();
sprite.onload = () => {
  spriteReady = sprite.naturalWidth > 0;
};
sprite.onerror = () => {
  spriteReady = false;
};
sprite.src = "gambar1.png";

function drawSprite(ctx, x, y, size, rotationDeg, alpha) {
  try {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rotationDeg * Math.PI) / 180);
    ctx.globalAlpha = alpha;
    if (spriteReady) {
      ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
    } else {
      // fallback: a soft teardrop, drawn to match the palette, so the
      // page still looks finished before gambar1.png is added
      ctx.fillStyle = "rgba(224, 178, 96, 0.85)";
      ctx.beginPath();
      ctx.moveTo(0, -size / 2);
      ctx.quadraticCurveTo(size / 2, size / 6, 0, size / 2);
      ctx.quadraticCurveTo(-size / 2, size / 6, 0, -size / 2);
      ctx.fill();
    }
    ctx.restore();
  } catch (err) {
    // never let a single bad frame kill the whole animation loop
    ctx.restore();
  }
}

/* --- falling rain particles --- */
const RAIN_COUNT = prefersReducedMotion ? 12 : 34;
const dropParticles = [];

function makeDrop(initial) {
  return {
    x: Math.random() * W,
    y: initial ? Math.random() * H : -60 - Math.random() * 200,
    size: 18 + Math.random() * 24,
    vy: 50 + Math.random() * 70,
    rot: Math.random() * 360,
    vRot: (Math.random() * 2 - 1) * 70,
    alpha: 0.55 + Math.random() * 0.4,
  };
}

for (let i = 0; i < RAIN_COUNT; i++) {
  dropParticles.push(makeDrop(true));
}

/* --- click splash particles --- */
const splashParticles = [];

function spawnSplash(x, y) {
  const count = 12;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const speed = 70 + Math.random() * 140;
    splashParticles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 40,
      size: 10 + Math.random() * 14,
      rot: Math.random() * 360,
      vRot: (Math.random() * 2 - 1) * 260,
      life: 0,
      maxLife: 0.55 + Math.random() * 0.35,
    });
  }
}

// splash appears wherever the page is clicked — anywhere on screen,
// not just on the flashcard — and is drawn on its own top-most canvas
function createSplash(e) {
  spawnSplash(e.clientX, e.clientY);
}

document.addEventListener("pointerdown", createSplash);

/* --- animation loop --- */
let lastTime = performance.now();

function tick(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  rainCtx.clearRect(0, 0, W, H);
  for (const p of dropParticles) {
    p.y += p.vy * dt;
    p.rot += p.vRot * dt;
    p.x += Math.sin(p.y * 0.01) * 6 * dt;
    if (p.y > H + 60) {
      Object.assign(p, makeDrop(false));
      p.y = -60;
    }
    drawSprite(rainCtx, p.x, p.y, p.size, p.rot, p.alpha);
  }

  splashCtx.clearRect(0, 0, W, H);
  for (let i = splashParticles.length - 1; i >= 0; i--) {
    const s = splashParticles[i];
    s.life += dt;
    if (s.life >= s.maxLife) {
      splashParticles.splice(i, 1);
      continue;
    }
    s.vy += 220 * dt; // gravity
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.rot += s.vRot * dt;
    const t = 1 - s.life / s.maxLife;
    drawSprite(splashCtx, s.x, s.y, s.size * (0.6 + 0.4 * t), s.rot, t * 0.9);
  }

  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);


document.addEventListener("pointerdown", (e) => {
    if (e.target instanceof HTMLElement) {
        e.target.blur();
    }
});