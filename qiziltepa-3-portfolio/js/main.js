const $ = (q, root = document) => root.querySelector(q);
const $$ = (q, root = document) => [...root.querySelectorAll(q)];

// Calm page-load animation toggle
document.documentElement.classList.add("js");
document.body.classList.add("is-loading");

window.addEventListener("load", () => {
  document.body.classList.remove("is-loading");
  document.body.classList.add("is-loaded");

  // Hero reveal elements: make them appear immediately on load (staggered via CSS)
  document.querySelectorAll(".hero .reveal").forEach(el => el.classList.add("is-in"));
});

/** ===== Settings you will edit ===== */
const SETTINGS = {
  telegramUrl: "#", // keyin o'zing telegram link qo'yasan (masalan: https://t.me/username)
};

function initTelegramButtons() {
  const btns = [$("#telegramBtnTop"), $("#telegramBtnContact")].filter(Boolean);
  btns.forEach(b => b.setAttribute("href", SETTINGS.telegramUrl));
}

function initYear() {
  const y = $("#year");
  if (y) y.textContent = new Date().getFullYear();
}

/** ===== Mobile nav ===== */
function initNav() {
  const toggle = $(".nav__toggle");
  const menu = $("#navMenu");
  if (!toggle || !menu) return;

  const closeMenu = () => {
    menu.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  // Close on link click
  $$("#navMenu a").forEach(a => a.addEventListener("click", closeMenu));

  // Close outside click
  document.addEventListener("click", (e) => {
    if (!menu.classList.contains("is-open")) return;
    if (menu.contains(e.target) || toggle.contains(e.target)) return;
    closeMenu();
  });

  // Close on ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });
}

/** ===== Reveal on scroll ===== */
function initReveal() {
  const els = $$(".reveal");
  if (!els.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add("is-in");
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.12 });

  els.forEach(el => io.observe(el));
}

/** ===== Counters ===== */
function initCounters() {
  const nums = $$(".stat__num[data-count]");
  if (!nums.length) return;

  const animate = (el) => {
    const target = Number(el.getAttribute("data-count"));
    const suffix = el.textContent.replace(/[0-9]/g, "");
    const start = 0;
    const duration = 900;
    const t0 = performance.now();

    function frame(t) {
      const p = Math.min((t - t0) / duration, 1);
      const val = Math.round(start + (target - start) * (1 - Math.pow(1 - p, 3)));
      el.textContent = String(val) + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        animate(en.target);
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.6 });

  nums.forEach(n => io.observe(n));
}

/** ===== Data loaders ===== */
async function loadJSON(path) {
  const res = await fetch(path, { cache: "no-cache" });
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

/** ===== Leadership & Staff ===== */
function renderPeopleCard(p) {
  return `
    <article class="card reveal">
      <h3>${escapeHtml(p.name)}</h3>
      <p class="muted">${escapeHtml(p.role)}</p>
      ${p.note ? `<p style="margin-top:10px">${escapeHtml(p.note)}</p>` : ""}
    </article>
  `;
}

async function initLeadership() {
  const grid = $("#leadershipGrid");
  if (!grid) return;

  try {
    const data = await loadJSON("data/staff.json");
    const leadership = (data.people || []).filter(p => p.group === "Rahbariyat");
    grid.innerHTML = leadership.map(renderPeopleCard).join("");
    initReveal();
  } catch (e) {
    grid.innerHTML = `<div class="card">Rahbariyat ma’lumotlari yuklanmadi.</div>`;
  }
}

function unique(arr) { return [...new Set(arr)]; }

async function initStaff() {
  const grid = $("#staffGrid");
  const chipsWrap = $("#staffChips");
  const search = $("#staffSearch");
  if (!grid || !chipsWrap || !search) return;

  let all = [];
  let activeGroup = "Barchasi";
  let q = "";

  try {
    const data = await loadJSON("data/staff.json");
    all = (data.people || []).filter(p => p.group !== "Rahbariyat");

    const groups = ["Barchasi", ...unique(all.map(p => p.group || "Boshqa"))];

    chipsWrap.innerHTML = groups.map(g => `
      <button class="chip ${g === activeGroup ? "is-active" : ""}" type="button" data-group="${escapeHtml(g)}">${escapeHtml(g)}</button>
    `).join("");

    chipsWrap.addEventListener("click", (e) => {
      const btn = e.target.closest(".chip");
      if (!btn) return;
      activeGroup = btn.getAttribute("data-group");
      $$(".chip", chipsWrap).forEach(x => x.classList.toggle("is-active", x === btn));
      paint();
    });

    search.addEventListener("input", () => {
      q = search.value.trim().toLowerCase();
      paint();
    });

    function paint() {
      const filtered = all.filter(p => {
        const groupOk = (activeGroup === "Barchasi") || ((p.group || "Boshqa") === activeGroup);
        const text = `${p.name} ${p.role} ${p.note || ""}`.toLowerCase();
        const qOk = !q || text.includes(q);
        return groupOk && qOk;
      });

      grid.innerHTML = filtered.map(renderPeopleCard).join("") || `<div class="card">Mos natija topilmadi.</div>`;
      initReveal();
    }

    paint();
  } catch {
    grid.innerHTML = `<div class="card">O‘qituvchilar ma’lumotlari yuklanmadi.</div>`;
  }
}

/** ===== News ===== */
function renderNewsItem(n) {
  return `
    <article class="card newsItem reveal">
      <div class="newsItem__shine" aria-hidden="true"></div>
      <div class="newsItem__meta">
        <span class="tag">${escapeHtml(n.category || "E’lon")}</span>
        <span>${escapeHtml(n.date || "")}</span>
      </div>
      <h3 class="newsItem__title">${escapeHtml(n.title || "")}</h3>
      <p class="newsItem__text">${escapeHtml(n.excerpt || "")}</p>
    </article>
  `;
}

async function initNews() {
  const grid = $("#newsGrid");
  if (!grid) return;

  try {
    const data = await loadJSON("data/news.json");
    const items = (data.items || []).slice().sort((a,b) => (b.date || "").localeCompare(a.date || ""));
    grid.innerHTML = items.map(renderNewsItem).join("") || `<div class="card">Hozircha yangilik yo‘q.</div>`;
    initReveal();
  } catch {
    grid.innerHTML = `<div class="card">Yangiliklar yuklanmadi.</div>`;
  }
}

/** ===== Gallery + Lightbox ===== */
function renderGalleryItem(it) {
  const thumb = it.thumb || it.src;
  return `
    <div class="gItem reveal" role="button" tabindex="0"
      data-src="${escapeAttr(it.src)}"
      data-caption="${escapeAttr(it.caption || "")}">
      <img src="${escapeAttr(thumb)}" alt="${escapeAttr(it.caption || "Galereya rasm")}" loading="lazy" decoding="async" />
      <div class="gItem__cap">${escapeHtml(it.caption || "")}</div>
    </div>
  `;
}

async function initGallery() {
  const grid = $("#galleryGrid");
  const chipsWrap = $("#galleryChips");
  const search = $("#gallerySearch");
  const dlg = $("#lightbox");
  const img = $("#lightboxImg");
  const cap = $("#lightboxCap");
  const closeBtn = $(".lightbox__close");
  if (!grid || !chipsWrap || !search || !dlg || !img || !cap || !closeBtn) return;

  let all = [];
  let active = "Barchasi";
  let q = "";

  function openLightbox(src, caption) {
    img.src = src;
    img.alt = caption || "Rasm";
    cap.textContent = caption || "";
    dlg.showModal();
  }

  closeBtn.addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => {
    const rect = dlg.getBoundingClientRect();
    const inDialog = rect.top <= e.clientY && e.clientY <= rect.bottom && rect.left <= e.clientX && e.clientX <= rect.right;
    if (!inDialog) dlg.close();
  });

  try {
    const data = await loadJSON("data/gallery.json");
    all = data.items || [];

    const cats = ["Barchasi", ...unique(all.map(x => x.category || "Boshqa"))];
    chipsWrap.innerHTML = cats.map(c => `
      <button class="chip ${c === active ? "is-active" : ""}" type="button" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>
    `).join("");

    chipsWrap.addEventListener("click", (e) => {
      const btn = e.target.closest(".chip");
      if (!btn) return;
      active = btn.getAttribute("data-cat");
      $$(".chip", chipsWrap).forEach(x => x.classList.toggle("is-active", x === btn));
      paint();
    });

    search.addEventListener("input", () => {
      q = search.value.trim().toLowerCase();
      paint();
    });

    grid.addEventListener("click", (e) => {
      const item = e.target.closest(".gItem");
      if (!item) return;
      openLightbox(item.dataset.src, item.dataset.caption);
    });

    grid.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      const item = e.target.closest(".gItem");
      if (!item) return;
      openLightbox(item.dataset.src, item.dataset.caption);
    });

    function paint() {
      const filtered = all.filter(it => {
        const catOk = (active === "Barchasi") || ((it.category || "Boshqa") === active);
        const text = `${it.caption || ""} ${it.category || ""}`.toLowerCase();
        const qOk = !q || text.includes(q);
        return catOk && qOk;
      });

      grid.innerHTML = filtered.map(renderGalleryItem).join("") || `<div class="card">Hozircha media yo‘q.</div>`;
      initReveal();
    }

    paint();
  } catch {
    grid.innerHTML = `<div class="card">Galereya yuklanmadi.</div>`;
  }
}

/** ===== Achievements ===== */
function renderAchievement(a) {
  return `
    <article class="card reveal">
      <h3>${escapeHtml(a.title || "")}</h3>
      <p class="muted">${escapeHtml(a.type || "")} • ${escapeHtml(a.year || "")}</p>
      <p style="margin-top:10px">${escapeHtml(a.note || "")}</p>
    </article>
  `;
}

async function initAchievements() {
  const grid = $("#achievementsGrid");
  if (!grid) return;

  try {
    const data = await loadJSON("data/achievements.json");
    const items = data.items || [];
    grid.innerHTML = items.map(renderAchievement).join("") || `<div class="card">Hozircha yutuqlar qo‘shilmagan.</div>`;
    initReveal();
  } catch {
    grid.innerHTML = `<div class="card">Yutuqlar yuklanmadi.</div>`;
  }
}

/** ===== Helpers ===== */
function escapeHtml(s="") {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}
function escapeAttr(s="") {
  return escapeHtml(s).replace(/"/g, "&quot;");
}

/** ===== Boot ===== */
initTelegramButtons();
initYear();
initNav();
initReveal();
initCounters();

initLeadership();
initStaff();
initNews();
initGallery();
initAchievements();
