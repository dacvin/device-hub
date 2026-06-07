/* DeviceHub — shell builder + helpers for static mockups */
(function () {
  const NAV_MAIN = [
    { id: "overview", label: "Overview", icon: "layout-dashboard", href: "Overview.html" },
    { id: "devices",  label: "Devices",  icon: "hard-drive", href: "Device List.html" },
  ];
  const NAV_CATALOG = [
    { id: "departments",  label: "Departments",  icon: "building-2", href: "Departments.html" },
    { id: "groups",       label: "Groups",        icon: "layers", href: "Groups.html" },
    { id: "manufacturers",label: "Manufacturers", icon: "factory", href: "Manufacturers.html" },
  ];
  const NAV_SYSTEM = [
    { id: "members",  label: "Members",  icon: "users", href: "Members.html" },
    { id: "settings", label: "Settings", icon: "settings", href: "Settings.html" },
  ];

  function navHTML(active) {
    const item = (it) => `<a class="nav-item ${it.id === active ? "active" : ""}" href="${it.href}">
        <i data-lucide="${it.icon}"></i><span>${it.label}</span>${it.id === "devices" ? '<span class="count">12</span>' : ""}</a>`;
    return `
      <div class="nav">${NAV_MAIN.map(item).join("")}</div>
      <div class="nav-label">Catalog</div>
      <div class="nav">${NAV_CATALOG.map(item).join("")}</div>
      <div class="nav-label">System</div>
      <div class="nav">${NAV_SYSTEM.map(item).join("")}</div>`;
  }

  function mount() {
    const page = document.getElementById("page");
    if (!page) return;
    const title = page.dataset.title || "";
    const crumb = page.dataset.crumb || "";
    const active = page.dataset.active || "";
    const actionsTpl = document.getElementById("topbar-actions");
    const actions = actionsTpl ? actionsTpl.innerHTML : "";
    const contentHTML = page.innerHTML;

    document.body.innerHTML = `
      <div class="layout">
        <aside class="sidebar">
          <div class="brand"><span class="glyph"><i data-lucide="hard-drive"></i></span>Device<span class="accent">Hub</span></div>
          ${navHTML(active)}
          <div class="foot">
            <div class="userchip" id="userchip">
              <span class="avatar">AT</span>
              <div class="col"><span class="nm">Anh Tran</span><span class="ml">IT Admin</span></div>
              <i data-lucide="chevrons-up-down" style="margin-left:auto;width:15px;height:15px;color:var(--muted-foreground)"></i>
            </div>
          </div>
        </aside>
        <div class="main">
          <header class="topbar"><div class="inner">
            <div class="col" style="gap:2px">
              <div class="title">${title}</div>
              ${crumb ? `<div class="crumb">${crumb}</div>` : ""}
            </div>
            <div class="actions">${actions}
              <button class="icon-btn" id="themeBtn" title="Toggle theme"><i data-lucide="moon"></i></button>
            </div>
          </div></header>
          <div class="content">${contentHTML}</div>
        </div>
      </div>`;

    // theme
    const apply = (dark) => {
      document.documentElement.classList.toggle("dark", dark);
      const i = document.querySelector("#themeBtn i");
      if (i) { i.setAttribute("data-lucide", dark ? "sun" : "moon"); }
      window.lucide && lucide.createIcons();
    };
    apply(localStorage.getItem("dh-theme") === "dark");
    const btn = document.getElementById("themeBtn");
    btn && btn.addEventListener("click", () => {
      const dark = !document.documentElement.classList.contains("dark");
      localStorage.setItem("dh-theme", dark ? "dark" : "light");
      apply(dark);
    });

    // user menu (avatar popover)
    const chip = document.getElementById("userchip");
    chip && chip.addEventListener("click", () => toggleUserMenu(chip));
    function toggleUserMenu(anchor){
      let m = document.getElementById("userMenu");
      if (m) { m.remove(); return; }
      const dark = document.documentElement.classList.contains("dark");
      m = document.createElement("div");
      m.id = "userMenu";
      m.className = "usermenu";
      m.innerHTML = `
        <div class="um-head">
          <span class="avatar">AT</span>
          <div class="col" style="min-width:0"><span class="um-nm">Anh Tran</span><span class="um-em">anh.tran@sioux.asia</span></div>
        </div>
        <div class="um-sep"></div>
        <a class="um-item" href="Member Profile.html?email=anh.tran@sioux.asia"><i data-lucide="user"></i>View profile</a>
        <a class="um-item" href="Settings.html"><i data-lucide="settings"></i>Account settings</a>
        <button class="um-item" id="um-theme"><i data-lucide="${dark?'sun':'moon'}"></i>${dark?'Light':'Dark'} mode</button>
        <div class="um-sep"></div>
        <a class="um-item danger" href="Login.html"><i data-lucide="log-out"></i>Sign out</a>`;
      document.body.appendChild(m);
      const r = anchor.getBoundingClientRect();
      m.style.left = (r.left) + "px";
      m.style.bottom = (window.innerHeight - r.top + 6) + "px";
      m.style.width = r.width + "px";
      window.lucide && lucide.createIcons();
      const themeItem = document.getElementById("um-theme");
      themeItem && themeItem.addEventListener("click", (e) => {
        e.preventDefault();
        const d = !document.documentElement.classList.contains("dark");
        localStorage.setItem("dh-theme", d ? "dark" : "light");
        apply(d); m.remove();
      });
      setTimeout(() => document.addEventListener("mousedown", function off(e){
        if (!m.contains(e.target) && !anchor.contains(e.target)) { m.remove(); document.removeEventListener("mousedown", off); }
      }), 0);
    }

    window.lucide && lucide.createIcons();
    document.dispatchEvent(new Event("shell:ready"));
  }

  // helpers
  window.DH = {
    statusBadge(key) {
      const s = window.STATUS[key];
      if (!s) return "";
      return `<span class="badge badge-${s.tone}"><span class="dot"></span>${s.label}</span>`;
    },
    flagChips(d) {
      const fl = window.deviceFlags ? window.deviceFlags(d) : [];
      if (!fl.length) return `<span class="flag-none">—</span>`;
      return `<div class="flagrow">${fl.map(k => {
        const f = window.FLAGS[k];
        return `<span class="flag-chip flag-${f.tone}" title="${f.label}"><i data-lucide="${f.icon}"></i><span class="flag-lbl">${f.label}</span></span>`;
      }).join("")}</div>`;
    },
    initials(name) { return name.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase(); },
    // floating bulk-selection bar (returns an API to drive it from a page)
    bulkBar({ raised = false } = {}) {
      const bar = document.createElement("div");
      bar.className = "bulkbar" + (raised ? " bulkbar-raised" : "");
      bar.innerHTML = `
        <span class="bulk-count"><b class="bulk-n">0</b> selected</span>
        <span class="bulk-sep"></span>
        <div class="bulk-acts"></div>
        <button class="bulk-clear" title="Clear selection"><i data-lucide="x"></i></button>`;
      document.body.appendChild(bar);
      window.lucide && lucide.createIcons();
      return {
        el: bar,
        acts: bar.querySelector(".bulk-acts"),
        clearBtn: bar.querySelector(".bulk-clear"),
        setActions(html) { this.acts.innerHTML = html; window.lucide && lucide.createIcons(); },
        update(n) { bar.querySelector(".bulk-n").textContent = n; bar.classList.toggle("show", n > 0); },
        onClear(fn) { this.clearBtn.addEventListener("click", fn); },
      };
    },
    // generic anchored popover menu. items: [{label, icon, danger, onClick}] (or {sep:true})
    popoverMenu(anchor, items, opts = {}) {
      const existing = document.getElementById("popMenu");
      if (existing) { existing.remove(); if (existing.dataset.for === (anchor.id || "")) return; }
      const menu = document.createElement("div");
      menu.id = "popMenu"; menu.className = "popmenu"; menu.dataset.for = anchor.id || "";
      menu.innerHTML = (opts.head ? `<div class="popmenu-head">${opts.head}</div>` : "")
        + items.map((it, i) => it.sep ? `<div class="um-sep"></div>`
            : `<button class="popmenu-item ${it.danger ? "danger" : ""}" data-i="${i}">${it.icon ? `<i data-lucide="${it.icon}"></i>` : ""}${it.label}</button>`).join("");
      document.body.appendChild(menu);
      const r = anchor.getBoundingClientRect();
      const w = menu.offsetWidth || 180;
      let left = r.left; if (left + w > window.innerWidth - 8) left = r.right - w;
      menu.style.left = Math.max(8, left) + "px";
      if (opts.above) menu.style.bottom = (window.innerHeight - r.top + 6) + "px";
      else menu.style.top = (r.bottom + 6) + "px";
      window.lucide && lucide.createIcons();
      menu.querySelectorAll(".popmenu-item").forEach(el => el.addEventListener("click", () => {
        const it = items[parseInt(el.dataset.i, 10)];
        menu.remove(); it.onClick && it.onClick();
      }));
      setTimeout(() => document.addEventListener("mousedown", function off(e) {
        if (!menu.contains(e.target) && e.target !== anchor && !anchor.contains(e.target)) { menu.remove(); document.removeEventListener("mousedown", off); }
      }), 0);
    },
    // floating variation switcher (mockup affordance)
    variantSwitcher(label, options, onChange, initial = 0) {
      const bar = document.createElement("div");
      bar.className = "variant-bar";
      bar.innerHTML = `<span class="vlabel">${label}</span><div class="tabs">${
        options.map((o, i) => `<button class="tab ${i === initial ? "active" : ""}" data-i="${i}">${o}</button>`).join("")
      }</div>`;
      document.body.appendChild(bar);
      bar.querySelectorAll(".tab").forEach(t => t.addEventListener("click", () => {
        bar.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
        t.classList.add("active");
        onChange(parseInt(t.dataset.i, 10));
      }));
    },
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
