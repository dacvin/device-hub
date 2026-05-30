/* DeviceHub — shell builder + helpers for static mockups */
(function () {
  const NAV_MAIN = [
    { id: "overview", label: "Overview", icon: "layout-dashboard", href: "#" },
    { id: "devices",  label: "Devices",  icon: "hard-drive", href: "Device List.html" },
  ];
  const NAV_CATALOG = [
    { id: "departments",  label: "Departments",  icon: "building-2", href: "Departments.html" },
    { id: "groups",       label: "Groups",        icon: "layers", href: "Groups.html" },
    { id: "manufacturers",label: "Manufacturers", icon: "factory", href: "Manufacturers.html" },
  ];

  function navHTML(active) {
    const item = (it) => `<a class="nav-item ${it.id === active ? "active" : ""}" href="${it.href}">
        <i data-lucide="${it.icon}"></i><span>${it.label}</span>${it.id === "devices" ? '<span class="count">12</span>' : ""}</a>`;
    return `
      <div class="nav">${NAV_MAIN.map(item).join("")}</div>
      <div class="nav-label">Catalog</div>
      <div class="nav">${NAV_CATALOG.map(item).join("")}</div>
      <div class="nav-label">System</div>
      <div class="nav">
        <a class="nav-item" href="#"><i data-lucide="users"></i><span>Members</span></a>
        <a class="nav-item" href="#"><i data-lucide="settings"></i><span>Settings</span></a>
      </div>`;
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
            <div class="userchip">
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
