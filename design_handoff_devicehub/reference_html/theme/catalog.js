/* DeviceHub — generic catalog (lookup-table) renderer + create/edit dialog.
   A page calls renderCatalog(cfg) after shell:ready.
   cfg = {
     field:    device property to count against (e.g. "group")
     singular: "Group"
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
  const lc = cfg.singular.toLowerCase();
  const cap = cfg.singular.charAt(0).toUpperCase() + cfg.singular.slice(1);

  let q = "";
  const root = document.getElementById("catalog");
  const extraColCount = (cfg.cols || []).length;

  /* ---------- Bulk selection ---------- */
  const selected = new Set();
  let bulk;

  function visible() {
    return cfg.items.filter(it => !q || it.name.toLowerCase().includes(q.toLowerCase()));
  }

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
      return `<tr data-name="${it.name}">
        <td class="checkcol" style="width:40px;padding-right:0"><span class="checkbox" data-name="${it.name}"></span></td>
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
          <button class="icon-btn js-del ${n ? 'is-disabled' : ''}" data-name="${it.name}" style="width:30px;height:30px;border:none" title="${n ? `Can’t delete — ${n} device${n === 1 ? '' : 's'} assigned` : 'Delete'}"><i data-lucide="trash-2"></i></button>
        </div></td>
      </tr>`;
    }).join("");
  }

  function render() {
    const list = visible();
    const head = `<tr>
        <th class="checkcol" style="width:40px;padding-right:0"><span class="checkbox"></span></th>
        <th>Name</th>
        ${(cfg.cols || []).map(c => `<th style="${c.align === 'right' ? 'text-align:right' : ''}">${c.label}</th>`).join("")}
        <th style="width:200px">Devices</th>
        <th class="actcol"></th>
      </tr>`;
    const body = list.length
      ? rows(list)
      : `<tr><td colspan="${extraColCount + 4}"><div class="cat-empty">No ${lc}s match “${q}”.</div></td></tr>`;
    root.innerHTML = `
      <div class="cat-meta">${cfg.items.length} ${cfg.items.length === 1 ? lc : lc + "s"} · ${total} devices catalogued</div>
      <div class="card table-wrap">
        <div class="table-scroll">
          <table class="table" id="cat-tbl"><thead>${head}</thead><tbody>${body}</tbody></table>
        </div>
      </div>`;
    lucide.createIcons();
    syncChecks();
  }

  function syncChecks() {
    document.querySelectorAll('#cat-tbl tbody .checkbox[data-name]').forEach(box => {
      const on = selected.has(box.dataset.name);
      box.classList.toggle('checked', on);
      box.innerHTML = on ? '<i data-lucide="check"></i>' : '';
      const tr = box.closest('tr'); if (tr) tr.classList.toggle('row-selected', on);
    });
    const head = document.querySelector('#cat-tbl thead .checkbox');
    if (head) {
      const vis = visible();
      const sel = vis.filter(it => selected.has(it.name)).length;
      const allOn = sel > 0 && sel === vis.length, part = sel > 0 && sel < vis.length;
      head.classList.toggle('checked', allOn);
      head.classList.toggle('indeterminate', part);
      head.innerHTML = allOn ? '<i data-lucide="check"></i>' : part ? '<i data-lucide="minus"></i>' : '';
    }
    lucide.createIcons();
    if (bulk) bulk.update(selected.size);
  }
  function clearSel() { selected.clear(); syncChecks(); }

  /* ---------- Create / edit dialog ---------- */
  const ICON_CHOICES = ["laptop","monitor","printer","network","server","smartphone","webcam","hard-drive","cpu","keyboard","mouse-pointer","tablet","router","tv","box","boxes","package","layers","container","scale-3d","ruler","blocks"];

  function fieldHTML(f, val) {
    const v = val == null ? "" : String(val);
    if (f.icons) {
      return `<div class="iconpick" data-key="${f.key}">
        ${ICON_CHOICES.map(o => `<button type="button" class="iconpick-btn ${o === v ? "on" : ""}" data-icon="${o}" title="${o}"><i data-lucide="${o}"></i></button>`).join("")}
      </div>`;
    }
    if (f.type === "select") {
      return `<select class="select" data-key="${f.key}">
        <option value="">${f.ph || "Select…"}</option>
        ${(f.opts || []).map(o => `<option ${o === v ? "selected" : ""}>${o}</option>`).join("")}
      </select>`;
    }
    if (f.type === "number") {
      return `<div class="row" style="gap:10px"><input class="input" type="number" data-key="${f.key}" value="${v}" placeholder="${f.ph || ""}" style="max-width:120px">${f.suffix ? `<span class="field-hint" style="margin:0">${f.suffix}</span>` : ""}</div>`;
    }
    return `<input class="input" type="text" data-key="${f.key}" value="${v}" placeholder="${f.ph || ""}" ${f.mono ? 'style="font-family:var(--font-mono)"' : ""}>`;
  }

  function openDialog(item) {
    const editing = !!item;
    const fields = [{ key: "name", label: cap + " name", type: "text", required: true, ph: `e.g. ${cfg.placeholderName || ""}` }, ...(cfg.form || [])];
    const overlay = document.createElement("div");
    overlay.className = "dialog-overlay";
    overlay.innerHTML = `
      <div class="dialog" role="dialog" aria-modal="true">
        <div class="dialog-head">
          <div>
            <h2 class="dialog-title">${editing ? "Edit " + lc : "Create " + cap}</h2>
            <p class="dialog-desc">${editing ? "Update the details for this " + lc + "." : "New " + lc + "s become selectable when adding or editing a device."}</p>
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
          <button class="btn btn-primary js-save">${editing ? "Save" : "Create"}</button>
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

    // icon picker selection
    overlay.querySelectorAll(".iconpick").forEach(pick => pick.addEventListener("click", e => {
      const b = e.target.closest(".iconpick-btn"); if (!b) return;
      pick.querySelectorAll(".iconpick-btn").forEach(x => x.classList.remove("on"));
      b.classList.add("on");
    }));

    overlay.querySelector(".js-save").addEventListener("click", () => {
      const data = {};
      overlay.querySelectorAll("[data-key]").forEach(el => {
        if (el.classList.contains("iconpick")) { const on = el.querySelector(".iconpick-btn.on"); data[el.dataset.key] = on ? on.dataset.icon : ""; }
        else { data[el.dataset.key] = el.type === "number" ? (el.value ? Number(el.value) : "") : el.value.trim(); }
      });
      const nameEl = overlay.querySelector('[data-key="name"]');
      if (!data.name) { nameEl.style.borderColor = "var(--destructive)"; nameEl.focus(); return; }
      if (editing) { Object.assign(item, data); }
      else { cfg.items.push(data); cfg.items.sort((a, b) => a.name.localeCompare(b.name)); }
      close();
      render();
      window.DH && DH.toast && DH.toast(editing ? `${cap} updated` : `${cap} created`, { desc: `“${data.name}” has been ${editing ? "updated" : "added to the catalog"}.` });
    });
  }

  /* ---------- wiring ---------- */
  const search = document.getElementById("cat-search");
  if (search) search.addEventListener("input", e => { q = e.target.value; clearSel(); render(); });

  const addBtn = document.querySelector(".topbar .actions .btn-primary");
  if (addBtn) addBtn.addEventListener("click", () => openDialog(null));

  function deleteItems(names) {
    const blocked = names.filter(nm => (counts[nm] || 0) > 0);
    const removable = names.filter(nm => !(counts[nm] || 0));
    const doRemove = () => {
      removable.forEach(nm => { const i = cfg.items.findIndex(x => x.name === nm); if (i > -1) cfg.items.splice(i, 1); });
      clearSel(); render();
      window.DH && DH.toast && DH.toast(`${removable.length} ${removable.length === 1 ? lc : lc + "s"} deleted`, blocked.length ? { desc: `${blocked.length} skipped — still in use.` } : undefined);
    };
    // nothing deletable — surface it as a notification, not a yes/no decision
    if (!removable.length) {
      window.DH && DH.toast && DH.toast("Can’t delete", { type: "error", desc: `${blocked.length} ${blocked.length === 1 ? lc : lc + "s"} still ${blocked.length === 1 ? "has" : "have"} devices assigned.` });
      return;
    }
    window.DH && DH.confirm ? DH.confirm({
      title: `Delete ${removable.length} ${removable.length === 1 ? lc : lc + "s"}?`,
      desc: `Are you sure you want to delete ${removable.length === 1 ? "this " + lc : "the selected " + lc + "s"}?`,
      confirmLabel: "Delete", icon: "trash-2", onConfirm: doRemove,
    }) : doRemove();
  }

  root.addEventListener("click", e => {
    const box = e.target.closest(".checkbox");
    if (box) {
      if (box.closest("thead")) {
        const vis = visible();
        const allOn = vis.length && vis.every(it => selected.has(it.name));
        vis.forEach(it => allOn ? selected.delete(it.name) : selected.add(it.name));
      } else if (box.dataset.name) {
        selected.has(box.dataset.name) ? selected.delete(box.dataset.name) : selected.add(box.dataset.name);
      }
      syncChecks();
      return;
    }
    const edit = e.target.closest(".js-edit");
    if (edit) { const it = cfg.items.find(i => i.name === edit.dataset.name); if (it) openDialog(it); return; }
    const del = e.target.closest(".js-del");
    if (del) { if (del.classList.contains("is-disabled")) return; deleteItems([del.dataset.name]); return; }
  });

  // bulk bar (Export + Delete only)
  if (window.DH && DH.bulkBar) {
    bulk = DH.bulkBar();
    bulk.setActions(
      `<button class="btn btn-outline btn-sm" id="cat-bulk-export"><i data-lucide="download"></i> Export</button>`
      + `<button class="btn btn-outline btn-sm" id="cat-bulk-delete" style="color:var(--destructive)"><i data-lucide="trash-2"></i> Delete</button>`);
    bulk.onClear(clearSel);
    document.getElementById("cat-bulk-export").addEventListener("click", () => { const n = selected.size; clearSel(); DH.toast && DH.toast("Export started", { type: "info", desc: `Preparing a CSV of ${n} ${n === 1 ? lc : lc + "s"}…` }); });
    document.getElementById("cat-bulk-delete").addEventListener("click", () => deleteItems([...selected]));
  }

  render();
};
