/* DeviceHub — photo & document uploaders for the device forms.
   Renders real, working dropzones (click or drag-drop). In a production build
   these POST to your asset store; here they preview locally so the UX is faithful.

   Markup helpers return HTML strings; call initUploads(rootEl) after inserting. */

window.UPLOAD = {
  photoZone(opts = {}) {
    const previews = opts.previews || [];
    const thumbs = previews.map((p, i) => UPLOAD._photoThumb(p, i === 0)).join("");
    return `
      <div class="photogrid" data-dz="photos">
        <input type="file" accept="image/*" multiple hidden />
        ${thumbs}
        <button type="button" class="photo-add"><i data-lucide="image-plus"></i><span>Add photo</span></button>
      </div>
      <div class="field-hint" style="margin-top:8px">First photo is the cover · drag &amp; drop or click · PNG or JPG, up to 5 MB each.</div>`;
  },
  _photoThumb(p, isCover) {
    return `<div class="photo-thumb ${isCover ? "is-cover" : ""}" draggable="true" title="${p.name || ""}">
      ${p.src ? `<img src="${p.src}" alt="" draggable="false" />` : `<span class="photo-mock"><i data-lucide="${p.icon || "image"}"></i></span>`}
      <span class="cover-badge">Cover</span>
      <button type="button" class="photo-del" title="Remove"><i data-lucide="x"></i></button>
    </div>`;
  },

  docsZone(existing = []) {
    const items = existing.map(f => UPLOAD._li(f.name, f.size)).join("");
    return `
      <div class="dropzone dz-docs" data-dz="docs">
        <input type="file" multiple hidden />
        <div class="dz-empty">
          <span class="dz-ic"><i data-lucide="upload"></i></span>
          <div class="dz-title">Upload documents</div>
          <div class="dz-sub">Invoices, warranty cards, manuals · PDF, DOCX, XLSX, images</div>
        </div>
      </div>
      <ul class="filelist">${items}</ul>`;
  },

  _iconFor(name) {
    const ext = (name.split(".").pop() || "").toLowerCase();
    if (ext === "pdf") return "file-text";
    if (["doc", "docx", "txt", "rtf"].includes(ext)) return "file-text";
    if (["xls", "xlsx", "csv"].includes(ext)) return "file-spreadsheet";
    if (["png", "jpg", "jpeg", "gif", "webp", "heic"].includes(ext)) return "file-image";
    if (["zip", "rar", "7z"].includes(ext)) return "file-archive";
    return "file";
  },
  _fmt(bytes) {
    if (bytes == null) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
    return (bytes / 1024 / 1024).toFixed(1) + " MB";
  },
  _li(name, size) {
    return `<li class="fileitem">
      <span class="file-ic"><i data-lucide="${UPLOAD._iconFor(name)}"></i></span>
      <div class="file-meta"><span class="file-name">${name}</span><span class="file-size">${typeof size === "number" ? UPLOAD._fmt(size) : (size || "")}</span></div>
      <button type="button" class="icon-btn file-del" title="Remove" style="border:none;width:30px;height:30px"><i data-lucide="x"></i></button>
    </li>`;
  },
};

window.initUploads = function (root) {
  root = root || document;

  root.querySelectorAll('.photogrid[data-dz="photos"]').forEach(grid => {
    const input = grid.querySelector("input");
    const addTile = grid.querySelector(".photo-add");
    const refreshCover = () => {
      [...grid.querySelectorAll(".photo-thumb")].forEach((t, i) => t.classList.toggle("is-cover", i === 0));
    };
    const addFiles = (files) => {
      [...files].forEach(f => {
        if (!f.type.startsWith("image/")) return;
        const el = document.createElement("div");
        el.className = "photo-thumb";
        el.draggable = true;
        el.title = f.name;
        el.innerHTML = `<img src="${URL.createObjectURL(f)}" alt="" draggable="false" /><span class="cover-badge">Cover</span><button type="button" class="photo-del" title="Remove"><i data-lucide="x"></i></button>`;
        grid.insertBefore(el, addTile);
      });
      refreshCover();
      window.lucide && lucide.createIcons();
    };
    addTile.addEventListener("click", () => input.click());
    input.addEventListener("change", () => { addFiles(input.files); input.value = ""; });
    grid.addEventListener("click", e => {
      const del = e.target.closest(".photo-del");
      if (del) { del.closest(".photo-thumb").remove(); refreshCover(); }
    });

    // drag-to-reorder (internal) — first photo is the cover
    let dragEl = null;
    grid.addEventListener("dragstart", e => {
      const t = e.target.closest(".photo-thumb");
      if (!t) return;
      dragEl = t; t.classList.add("drag-src");
      e.dataTransfer.effectAllowed = "move";
      try { e.dataTransfer.setData("text/plain", "reorder"); } catch (_) {}
    });
    grid.addEventListener("dragend", () => {
      if (dragEl) dragEl.classList.remove("drag-src");
      dragEl = null; grid.classList.remove("dragging"); refreshCover();
    });
    const afterEl = (x, y) => {
      const thumbs = [...grid.querySelectorAll(".photo-thumb:not(.drag-src)")];
      for (const t of thumbs) {
        const r = t.getBoundingClientRect();
        if (y < r.bottom && x < r.left + r.width / 2) return t;
      }
      return addTile;
    };
    grid.addEventListener("dragover", e => {
      e.preventDefault();
      if (dragEl) { grid.insertBefore(dragEl, afterEl(e.clientX, e.clientY)); }
      else { grid.classList.add("dragging"); } // external file drag
    });
    ["dragleave", "drop"].forEach(ev => grid.addEventListener(ev, e => { e.preventDefault(); if (!dragEl) grid.classList.remove("dragging"); }));
    grid.addEventListener("drop", e => { if (!dragEl && e.dataTransfer.files.length) addFiles(e.dataTransfer.files); });
    refreshCover();
  });

  root.querySelectorAll('.dropzone[data-dz="docs"]').forEach(zone => {
    const input = zone.querySelector("input");
    const list = zone.parentElement.querySelector(".filelist") || zone.nextElementSibling;
    zone.addEventListener("click", () => input.click());
    const add = (files) => {
      [...files].forEach(f => list.insertAdjacentHTML("beforeend", UPLOAD._li(f.name, f.size)));
      window.lucide && lucide.createIcons();
    };
    input.addEventListener("change", () => add(input.files));
    dnd(zone, input, add);
    list && list.addEventListener("click", e => {
      const del = e.target.closest(".file-del");
      if (del) del.closest(".fileitem").remove();
    });
  });

  function dnd(zone, input, onFiles) {
    ["dragenter", "dragover"].forEach(ev => zone.addEventListener(ev, e => { e.preventDefault(); zone.classList.add("dragging"); }));
    ["dragleave", "drop"].forEach(ev => zone.addEventListener(ev, e => { e.preventDefault(); zone.classList.remove("dragging"); }));
    zone.addEventListener("drop", e => {
      const files = e.dataTransfer.files;
      if (!files.length) return;
      if (onFiles) onFiles(files);
      else { input.files = files; input.dispatchEvent(new Event("change")); }
    });
  }

  window.lucide && lucide.createIcons();
};
