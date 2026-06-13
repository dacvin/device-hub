/* DeviceHub — state helpers: skeleton renderers, error/empty/permission blocks, toast, confirm.
   Attach to window.DH (created by shell.js). Load AFTER shell.js. */
(function () {
  const DH = (window.DH = window.DH || {});

  /* ---------- Skeleton builders (return HTML strings) ---------- */
  DH.sk = {
    line(w = "100%", cls = "") { return `<span class="sk sk-line ${cls}" style="width:${w}"></span>`; },
    circle(d = 36) { return `<span class="sk sk-circle" style="width:${d}px;height:${d}px"></span>`; },
    block(w, h, r = 8) { return `<span class="sk" style="width:${w};height:${h};border-radius:${r}px"></span>`; },
    // a table of n skeleton rows with the given grid-template-columns
    table(n = 8, cols = "40px 28px 120px 1fr 90px 110px 90px") {
      let out = "";
      for (let i = 0; i < n; i++) {
        out += `<div class="sk-row" style="grid-template-columns:${cols}">`
          + cols.split(" ").map((c, j) =>
              j === 0 ? `<span class="sk sk-circle" style="width:18px;height:18px"></span>`
              : `<span class="sk sk-line ${j % 3 ? "" : "sm"}" style="width:${60 + ((i + j) % 4) * 10}%"></span>`).join("")
          + `</div>`;
      }
      return out;
    },
    kpis(n = 4) {
      let out = "";
      for (let i = 0; i < n; i++)
        out += `<div class="card sk-kpi"><span class="sk sk-line sm" style="width:50%"></span>`
          + `<span class="sk sk-line lg" style="width:40%;height:24px"></span>`
          + `<span class="sk sk-line sm" style="width:70%"></span></div>`;
      return out;
    },
  };

  /* ---------- Full-card state blocks ---------- */
  function actionsHTML(actions) {
    return (actions || []).map(a =>
      `<${a.href ? "a" : "button"} class="btn ${a.variant || "btn-outline"}" ${a.href ? `href="${a.href}"` : ""} ${a.id ? `id="${a.id}"` : ""}>${a.icon ? `<i data-lucide="${a.icon}"></i>` : ""} ${a.label}</${a.href ? "a" : "button"}>`).join("");
  }
  DH.errorState = function ({ title = "Couldn't load this", desc = "Something went wrong while fetching data. Check your connection and try again.", code = "", retryId = "retry" } = {}) {
    return `<div class="card state-card">
      <div class="state-ic error"><i data-lucide="cloud-alert"></i></div>
      <div class="state-title">${title}</div>
      <div class="state-desc">${desc}</div>
      <div class="state-actions">
        <button class="btn btn-outline" id="${retryId}"><i data-lucide="refresh-cw"></i> Try again</button>
      </div>
      ${code ? `<div class="state-meta">${code}</div>` : ""}
    </div>`;
  };
  DH.emptyState = function ({ icon = "inbox", title = "Nothing here yet", desc = "", actions = [] } = {}) {
    return `<div class="card state-card">
      <div class="state-ic neutral"><i data-lucide="${icon}"></i></div>
      <div class="state-title">${title}</div>
      ${desc ? `<div class="state-desc">${desc}</div>` : ""}
      ${actions.length ? `<div class="state-actions">${actionsHTML(actions)}</div>` : ""}
    </div>`;
  };
  DH.permissionDenied = function ({ what = "this page", need = "IT Admin", role = "Viewer" } = {}) {
    return `<div class="card state-card">
      <div class="state-ic warn"><i data-lucide="lock"></i></div>
      <div class="state-title">You don't have access to ${what}</div>
      <div class="state-desc">Your role (<b>${role}</b>) is read-only here. ${need} access is required. Ask an IT Admin if you need it.</div>
      <div class="state-actions">
        <a class="btn btn-outline" href="Overview.html"><i data-lucide="arrow-left"></i> Back to overview</a>
        <button class="btn btn-primary" id="req-access"><i data-lucide="send"></i> Request access</button>
      </div>
    </div>`;
  };

  /* ---------- Toast (Sonner-style) ---------- */
  function region() {
    let r = document.getElementById("toastRegion");
    if (!r) { r = document.createElement("div"); r.id = "toastRegion"; r.className = "toast-region"; document.body.appendChild(r); }
    return r;
  }
  const TOAST_IC = { success: "circle-check-big", error: "circle-alert", info: "info" };
  DH.toast = function (title, { type = "success", desc = "", duration = 4000 } = {}) {
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.setAttribute("role", type === "error" ? "alert" : "status");
    el.innerHTML = `<span class="t-ic"><i data-lucide="${TOAST_IC[type] || "info"}"></i></span>
      <div class="t-body"><div class="t-title">${title}</div>${desc ? `<div class="t-desc">${desc}</div>` : ""}</div>
      <button class="t-close" aria-label="Dismiss"><i data-lucide="x"></i></button>`;
    region().appendChild(el);
    window.lucide && lucide.createIcons();
    requestAnimationFrame(() => el.classList.add("in"));
    const close = () => { el.classList.remove("in"); setTimeout(() => el.remove(), 200); };
    el.querySelector(".t-close").addEventListener("click", close);
    if (duration) setTimeout(close, duration);
    return close;
  };

  /* ---------- Confirm dialog (destructive) ---------- */
  DH.confirm = function ({ title = "Are you sure?", desc = "", confirmLabel = "Confirm", cancelLabel = "Cancel", icon = "triangle-alert", tone = "danger", onConfirm } = {}) {
    const overlay = document.createElement("div");
    overlay.className = "dialog-overlay open";
    overlay.innerHTML = `
      <div class="dialog confirm" role="alertdialog" aria-modal="true" aria-labelledby="cf-t">
        <div class="c-head">
          <span class="c-ic ${tone === "warn" ? "warn" : ""}"><i data-lucide="${icon}"></i></span>
          <div><div class="c-title" id="cf-t">${title}</div><div class="c-desc">${desc}</div></div>
        </div>
        <div class="c-foot">
          <button class="btn btn-outline" data-cancel>${cancelLabel}</button>
          <button class="btn ${tone === "warn" ? "btn-primary" : "btn-destructive"}" data-ok>${confirmLabel}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    window.lucide && lucide.createIcons();
    const close = () => overlay.remove();
    overlay.querySelector("[data-cancel]").addEventListener("click", close);
    overlay.querySelector("[data-ok]").addEventListener("click", () => { close(); onConfirm && onConfirm(); });
    overlay.addEventListener("mousedown", e => { if (e.target === overlay) close(); });
    document.addEventListener("keydown", function esc(e) { if (e.key === "Escape") { close(); document.removeEventListener("keydown", esc); } });
    overlay.querySelector("[data-ok]").focus();
    return close;
  };
})();
