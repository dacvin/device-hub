/* DeviceHub — generic catalog (lookup-table) renderer + add/edit dialog.
   A page calls renderCatalog(cfg) after shell:ready.
   cfg = {
     field:    device property to count against (e.g. "dept")
     singular: "Department"
     rowIcon:  optional (item) => lucide icon name
     cols:     extra columns [{ label, get:(item)=>html, mono:bool, align:'right' }]
     form:     extra dialog fields beyond Name
               [{ key, label, type:'text'|'select'|'number', opts:[], mono, ph, required, suffix, icons:bool }]
     items:    [{ name, ... }]
   }
*/
window.renderCatalog = function (cfg) {
  const counts = {};
  window.DEVICES.forEach(d => { const k = d[cfg.field]; counts[k] = (counts[k] || 0) + 1; });
  const total = window.DEVICES.length;
  const art = (w) => /^[aeiou]/i.test(w) ? "an" : "a";
  const lc = cfg.singular.toLowerCase();

  let q = "";
  const root = document.getElementById("catalog");

  function rows(list) {
    return list.map(it => {
      const n = counts[it.name] || 0;
      const pct = total ? Math.round((n / total) * 100) : 0;
      const href = `Device List.html?${cfg.field}=${encodeURIComponent(it.name)}`;
      const nameCell = cfg.rowIcon
        ? `<div class="row" style="gap:11px"><span class="cat-ic"><i data-lucide="${cfg.rowIcon(it)}"></i></span><span class="namecell">${it.name}</span></div>`
        : `<span class="namecell">${it.name}</span>`;
      const extra = (cfg.cols || []).map(c =>
        `<td class="${c.mono ? 'mono-cell' : ''}" style="${c.align === 'right' ? 'text-align:right' : ''}">${c.get(it)}</td>`).join("");
      return `<tr>
        <td>${nameCell}</td>
        ${extra}
        <td>
          <a class="cnt cnt-link" href="${href}" title="View ${n} device${n === 1 ? '' : 's'} in the list">
            <span class="cnt-track"><span class="cnt-fill" style="width:${pct}%"></span></span>
            <span class="cnt-v">${n}</span>
            <i data-lucide="arrow-right" class="cnt-arrow"></i>
          </a>
        </td>
        <td class="actcol"><div class="rowact row" style="gap:4px">
          <button class="icon-btn js-edit" data-name="${it.name}" style="width:30px;height:30px;border:none" title="Edit"><i data-lucide="pencil"></i></button>
          <button class="icon-btn js-del" data-name="${it.name}" style="width:30px;height:30px;border:none" title="Delete"><i data-lucide="trash-2"></i></button>
        </div></td>
      </tr>`;
    }).join("");
  }

  function render() {
    const list = cfg.items.filter(it => !q || it.name.toLowerCase().includes(q.toLowerCase()));
    const head = `<tr>
        <th>Name</th>
        ${(cfg.cols || []).map(c => `<th style="${c.align === 'right' ? 'text-align:right' : ''}">${c.label}</th>`).join("")}
        <th style="width:200px">Devices</th>
        <th class="actcol"></th>
      </tr>`;
    const body = list.length
      ? rows(list)
      : `<tr><td colspan="${(cfg.cols||[]).length + 3}"><div class="cat-empty">No ${lc}s match “${q}”.</div></td></tr>`;
    root.innerHTML = `
      <div class="cat-meta">${cfg.items.length} ${cfg.items.length === 1 ? lc : lc + "s"} · ${total} devices catalogued</div>
      <div class="card table-wrap">
        <div class="table-scroll">
          <table class="table"><thead>${head}</thead><tbody>${body}</tbody></table>
        </div>
      </div>`;
    lucide.createIcons();
  }

  /* ---------- Add / edit dialog ---------- */
  const ICON_CHOICES = ["laptop","monitor","printer","network","server","smartphone","webcam","hard-drive","cpu","keyboard","mouse-pointer","tablet","router","tv"];

  function fieldHTML(f, val) {
    const v = val == null ? "" : String(val);
    if (f.type === "select") {
      const opts = (f.icons ? ICON_CHOICES : f.opts || []);
      return `<select class="select" data-key="${f.key}">
        <option value="">${f.ph || "Select…"}</option>
        ${opts.map(o => `<option ${o === v ? "selected" : ""}>${o}</option>`).join("")}
      </select>`;
    }
    if (f.type === "number") {
      return `<div class="row" style="gap:10px"><input class="input" type="number" data-key="${f.key}" value="${v}" placeholder="${f.ph || ""}" style="max-width:120px">${f.suffix ? `<span class="field-hint" style="margin:0">${f.suffix}</span>` : ""}</div>`;
    }
    return `<input class="input" type="text" data-key="${f.key}" value="${v}" placeholder="${f.ph || ""}" ${f.mono ? 'style="font-family:var(--font-mono)"' : ""}>`;
  }

  function openDialog(item) {
    const editing = !!item;
    const fields = [{ key: "name", label: cfg.singular + " name", type: "text", required: true, ph: `e.g. ${cfg.placeholderName || ""}` }, ...(cfg.form || [])];
    const overlay = document.createElement("div");
    overlay.className = "dialog-overlay";
    overlay.innerHTML = `
      <div class="dialog" role="dialog" aria-modal="true">
        <div class="dialog-head">
          <div>
            <h2 class="dialog-title">${editing ? "Edit " + lc : "Add " + art(lc) + " " + lc}</h2>
            <p class="dialog-desc">${editing ? "Update the details for this " + lc + "." : "Create a new " + lc + " in the catalog."}</p>
          </div>
          <button class="icon-btn js-close" style="border:none" title="Close"><i data-lucide="x"></i></button>
        </div>
        <div class="dialog-body">
          ${fields.map(f => `<div class="field">
              <label class="label">${f.label}${f.required ? ' <span style="color:var(--destructive)">*</span>' : ""}</label>
              ${fieldHTML(f, editing ? item[f.key] : (f.key === "name" ? "" : (f.default ?? "")))}
            </div>`).join("")}
        </div>
        <div class="dialog-foot">
          <button class="btn btn-ghost js-close">Cancel</button>
          <button class="btn btn-primary js-save"><i data-lucide="check"></i> ${editing ? "Save changes" : "Create " + lc}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    lucide.createIcons();
    requestAnimationFrame(() => overlay.classList.add("open"));

    const close = () => { overlay.classList.remove("open"); setTimeout(() => overlay.remove(), 150); document.removeEventListener("keydown", onKey); };
    const onKey = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    overlay.addEventListener("mousedown", e => { if (e.target === overlay) close(); });
    overlay.querySelectorAll(".js-close").forEach(b => b.addEventListener("click", close));
    overlay.querySelector("input")?.focus();

    overlay.querySelector(".js-save").addEventListener("click", () => {
      const data = {};
      overlay.querySelectorAll("[data-key]").forEach(el => { data[el.dataset.key] = el.type === "number" ? (el.value ? Number(el.value) : "") : el.value.trim(); });
      const nameEl = overlay.querySelector('[data-key="name"]');
      if (!data.name) { nameEl.style.borderColor = "var(--destructive)"; nameEl.focus(); return; }
      if (editing) { Object.assign(item, data); }
      else { cfg.items.push(data); cfg.items.sort((a, b) => a.name.localeCompare(b.name)); }
      close();
      render();
    });
  }

  /* ---------- wiring ---------- */
  const search = document.getElementById("cat-search");
  if (search) search.addEventListener("input", e => { q = e.target.value; render(); });

  const addBtn = document.querySelector(".topbar .actions .btn-primary");
  if (addBtn) addBtn.addEventListener("click", () => openDialog(null));

  root.addEventListener("click", e => {
    const edit = e.target.closest(".js-edit");
    if (edit) { const it = cfg.items.find(i => i.name === edit.dataset.name); if (it) openDialog(it); return; }
    const del = e.target.closest(".js-del");
    if (del) {
      const it = cfg.items.find(i => i.name === del.dataset.name);
      const used = counts[del.dataset.name] || 0;
      if (used > 0) { alert(`“${del.dataset.name}” still has ${used} device${used === 1 ? "" : "s"} assigned and can't be deleted.`); return; }
      const i = cfg.items.indexOf(it);
      if (i > -1) { cfg.items.splice(i, 1); render(); }
    }
  });

  render();
};
