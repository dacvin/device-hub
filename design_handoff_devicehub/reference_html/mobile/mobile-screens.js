/* DeviceHub — mobile screen builders. Each returns an HTML string mounted inside <IOSDevice>.
   Global: window.MOBILE.screens.<name>(nav) and MOBILE.tabbar(active, nav). nav = 'A' | 'B'. */
(function () {
  const condColor = c => c >= 70 ? "var(--green-500)" : c >= 40 ? "oklch(0.78 0.13 75)" : "var(--destructive)";
  const ic = n => `<i data-lucide="${n}"></i>`;

  const STATUS = {
    "in-use":  { label: "In use",     tone: "success", dot: true },
    "storage": { label: "In storage", tone: "info",    dot: true },
    "repair":  { label: "In repair",  tone: "warning", dot: true },
    "retired": { label: "Retired",    tone: "muted",   dot: true },
  };
  const badge = (tone, label, dot) => `<span class="mob-badge ${tone}">${dot ? '<span class="dot"></span>' : ''}${label}</span>`;
  const statusBadge = s => badge(STATUS[s].tone, STATUS[s].label, true);

  const GROUP_ICON = { Laptop:"laptop", Desktop:"monitor", Monitor:"monitor", Printer:"printer", Network:"network", Server:"server", Mobile:"smartphone", Peripheral:"webcam" };

  const DEVICES = [
    { code:"DEV-2041-XPS", name:"Dell XPS 15 9530", group:"Laptop", mfr:"Dell", loc:"HCMC · F4 · E-12", status:"in-use", cond:88, flags:["warranty-expiring"] },
    { code:"DEV-2088-MBP", name:"MacBook Pro 14 M3", group:"Laptop", mfr:"Apple", loc:"HCMC · F3 · D-04", status:"in-use", cond:95, flags:[] },
    { code:"DEV-3110-U27", name:"Dell UltraSharp U2723", group:"Monitor", mfr:"Dell", loc:"HCMC · F4 · E-12", status:"in-use", cond:72, flags:[] },
    { code:"DEV-5210-NAS", name:"Synology RS1221+", group:"Server", mfr:"Synology", loc:"HCMC · Server room", status:"repair", cond:54, flags:["inventory-overdue"] },
    { code:"DEV-4501-LJ", name:"HP LaserJet M428", group:"Printer", mfr:"HP", loc:"HCMC · F1 · Print room", status:"storage", cond:63, flags:[] },
    { code:"DEV-7001-C920", name:"Logitech C920", group:"Peripheral", mfr:"Logitech", loc:"HCMC · Meeting B", status:"retired", cond:30, flags:[] },
  ];

  const MEMBERS = [
    { name:"Vinh Huynh", email:"vinh.huynh@gmail.com", role:"Admin", roleTone:"primary", roleIcon:"shield-check", site:"HCMC", devices:42, status:"active", you:true },
    { name:"Quan Bui", email:"quan.bui@gmail.com", role:"Admin", roleTone:"primary", roleIcon:"shield-check", site:"HCMC", devices:38, status:"active" },
    { name:"Mai Pham", email:"mai.pham@gmail.com", role:"Member", roleTone:"secondary", roleIcon:"user", site:"HCMC", devices:9, status:"active" },
    { name:"Khoa Le", email:"khoa.le@gmail.com", role:"Member", roleTone:"secondary", roleIcon:"user", site:"Hanoi", devices:6, status:"active" },
    { name:"Tuan Vo", email:"tuan.vo@gmail.com", role:"Member", roleTone:"secondary", roleIcon:"user", site:"HCMC", devices:0, status:"active" },
    { name:"Linh Dang", email:"linh.dang@gmail.com", role:"Member", roleTone:"secondary", roleIcon:"user", site:"HCMC", devices:0, status:"invited" },
  ];
  const initials = n => n.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();

  /* ---------- chrome helpers ---------- */
  function head({ title, sub, avatar, actions, back }) {
    const left = back ? `<a class="mob-back">${ic("chevron-left")}</a>` : "";
    return `<div class="mob-head ${back ? 'back' : ''}">
      ${left}
      <div class="ht"><h1>${title}</h1>${sub ? `<div class="sub">${sub}</div>` : ""}</div>
      <div class="acts">${actions || ""}${avatar ? `<span class="mob-avatar">${avatar}</span>` : ""}</div>
    </div>`;
  }

  const TABS = [
    { key:"overview", icon:"layout-dashboard", label:"Overview" },
    { key:"devices",  icon:"hard-drive",       label:"Devices" },
    { key:"members",  icon:"users",            label:"Members" },
    { key:"more",     icon:"menu",             label:"More" },
  ];
  function tabbar(active, nav) {
    const tab = t => `<div class="mob-tab ${t.key===active?'on':''}">${ic(t.icon)}<span>${t.label}</span></div>`;
    if (nav === "B") {
      // 5-tab with center Add FAB
      return `<div class="mob-tabbar">
        ${tab(TABS[0])}${tab(TABS[1])}
        <div class="mob-tab fab"><div class="mob-fab">${ic("plus")}</div></div>
        ${tab(TABS[2])}${tab(TABS[3])}
      </div>`;
    }
    // 4-tab
    return `<div class="mob-tabbar">${TABS.map(tab).join("")}</div>`;
  }

  const screen = (inner) => `<div class="mob">${inner}</div>`;

  /* ---------- screens ---------- */
  const screens = {
    login: () => screen(`
      <div class="mob-login">
        <div class="glyph">${ic("hard-drive")}</div>
        <h1>DeviceHub</h1>
        <p>Every device, accounted for. Sign in with your Sioux Workspace account.</p>
        <div class="mob-googlebtn">
          <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.6 9.2c0-.6-.1-1.2-.2-1.8H9v3.4h4.8a4.1 4.1 0 0 1-1.8 2.7v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.5z"/><path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H.9v2.3A9 9 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.9 10.7a5.4 5.4 0 0 1 0-3.4V5H.9a9 9 0 0 0 0 8z"/><path fill="#EA4335" d="M9 3.6c1.3 0 2.5.5 3.4 1.3l2.6-2.6A9 9 0 0 0 .9 5l3 2.3C4.6 5.2 6.6 3.6 9 3.6z"/></svg>
          Continue with Google
        </div>
        <div class="mob-note">${ic("shield-check")}<span>Access is limited to IT-managed @gmail.com accounts.</span></div>
      </div>`),

    overview: (nav) => screen(
      head({ title:"Overview", sub:"Fleet health", avatar:"AT" }) +
      `<div class="mob-body">
        <div class="mob-kpis">
          <div class="mob-card mob-kpi"><div class="kh"><span class="kl">Total devices</span><span class="kic">${ic("hard-drive")}</span></div><div class="kv">12</div><div class="ks">16 units · 8 groups</div></div>
          <div class="mob-card mob-kpi"><div class="kh"><span class="kl">In use</span><span class="kic">${ic("circle-check-big")}</span></div><div class="kv">9</div><div class="ks">1 storage · 1 retired</div></div>
          <div class="mob-card mob-kpi alert"><div class="kh"><span class="kl">Needs attention</span><span class="kic">${ic("triangle-alert")}</span></div><div class="kv">3</div><div class="ks">Warranty &amp; inventory</div></div>
          <div class="mob-card mob-kpi"><div class="kh"><span class="kl">In repair</span><span class="kic">${ic("wrench")}</span></div><div class="kv">1</div><div class="ks">Avg. condition 78%</div></div>
        </div>
        <div class="mob-card">
          <div class="mob-ctop"><div><div class="ct">Lifecycle status</div></div></div>
          <div style="padding:14px 16px 16px">
            <div class="mob-lifebar"><span style="width:58%;background:var(--green-500)"></span><span style="width:17%;background:oklch(0.70 0.10 230)"></span><span style="width:9%;background:oklch(0.78 0.13 75)"></span><span style="width:16%;background:var(--muted-foreground)"></span></div>
            <div class="mob-legend">
              <div class="li"><span class="sw" style="background:var(--green-500)"></span>In use<span class="lv">9</span></div>
              <div class="li"><span class="sw" style="background:oklch(0.70 0.10 230)"></span>Storage<span class="lv">1</span></div>
              <div class="li"><span class="sw" style="background:oklch(0.78 0.13 75)"></span>Repair<span class="lv">1</span></div>
              <div class="li"><span class="sw" style="background:var(--muted-foreground)"></span>Retired<span class="lv">1</span></div>
            </div>
          </div>
        </div>
        <div class="mob-card">
          <div class="mob-ctop"><div><div class="ct">Inventory by group</div><div class="cs">Share of all 12 devices</div></div></div>
          <div style="padding:6px 16px 14px">
            ${[["Laptop",3,25],["Monitor",2,17],["Desktop",2,17],["Printer",1,8],["Server",1,8]].map(([g,n,p])=>`
              <div class="mob-grouprow"><span class="gn"><span class="gi">${ic(GROUP_ICON[g])}</span>${g}</span><span class="gt"><span class="gf" style="width:${p}%"></span></span><span class="gv">${n}</span></div>`).join("")}
          </div>
        </div>
        <div class="mob-card">
          <div class="mob-ctop"><div><div class="ct">Needs attention</div><div class="cs">3 flagged</div></div></div>
          <div>
            ${DEVICES.filter(d=>d.flags.length).map(d=>`
              <div class="mob-row"><span class="ric">${ic(GROUP_ICON[d.group])}</span><span class="rm"><div class="rt">${d.name}</div><div class="rsub mono">${d.code}</div></span>${badge(d.flags[0]==="warranty-expiring"?"warning":"warning", d.flags[0]==="warranty-expiring"?"Warranty":"Overdue", false)}</div>`).join("")}
          </div>
        </div>
      </div>` + tabbar("overview", nav)),

    devices: (nav) => screen(
      head({ title:"Devices", sub:"12 devices", actions: nav==="A" ? "" : "" }) +
      `<div class="mob-search">${ic("search")}Search devices…</div>
      <div class="mob-chips">
        <div class="mob-chip on">${ic("sliders-horizontal")}All</div>
        <div class="mob-chip">Group ${ic("chevron-down")}</div>
        <div class="mob-chip">Status ${ic("chevron-down")}</div>
        <div class="mob-chip">Mfr ${ic("chevron-down")}</div>
      </div>
      <div class="mob-body" style="padding-top:14px">
        ${DEVICES.map(d=>`
          <div class="mob-card" style="padding:13px 14px;display:flex;align-items:center;gap:12px">
            <span class="ric" style="width:42px;height:42px;border-radius:11px;background:var(--secondary);color:var(--secondary-foreground);display:grid;place-items:center;flex:none">${ic(GROUP_ICON[d.group])}</span>
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:8px"><span style="font-size:15px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${d.name}</span></div>
              <div class="mono" style="font-size:11.5px;color:var(--muted-foreground);margin:1px 0 7px">${d.code} · ${d.mfr}</div>
              <div style="display:flex;align-items:center;gap:10px">${statusBadge(d.status)}<span class="mob-cond"><span class="ct"><span class="cf" style="width:${d.cond}%;background:${condColor(d.cond)}"></span></span><span class="cv">${d.cond}%</span></span></div>
            </div>
            <span class="chev" style="color:var(--muted-foreground)">${ic("chevron-right")}</span>
          </div>`).join("")}
      </div>
      ${nav==="A" ? `<div class="mob-floatfab">${ic("plus")}</div>` : ""}` + tabbar("devices", nav)),

    deviceDetails: (nav) => screen(
      head({ title:"Device", back:true, actions:`<span class="mob-iconbtn">${ic("pencil")}</span>` }) +
      `<div class="mob-body">
        <div class="mob-hero"><span class="hic">${ic("laptop")}</span><div><div class="hn">Dell XPS 15 9530</div><div class="hc mono">DEV-2041-XPS</div><div class="hb">${badge("secondary","Laptop",false)}${statusBadge("in-use")}</div></div></div>
        <div class="mob-card" style="display:flex;align-items:center;gap:16px;padding:16px">
          <div style="position:relative;width:64px;height:64px;flex:none">
            <svg width="64" height="64" viewBox="0 0 64 64"><circle cx="32" cy="32" r="27" fill="none" stroke="var(--muted)" stroke-width="7"/><circle cx="32" cy="32" r="27" fill="none" stroke="var(--green-500)" stroke-width="7" stroke-linecap="round" stroke-dasharray="170" stroke-dashoffset="20" transform="rotate(-90 32 32)"/></svg>
            <div style="position:absolute;inset:0;display:grid;place-items:center;font-size:15px;font-weight:600">88%</div>
          </div>
          <div><div style="font-size:13px;color:var(--muted-foreground)">Condition</div><div style="font-size:15px;font-weight:500;margin-top:2px">Good — in service</div><div style="font-size:12px;color:var(--muted-foreground);margin-top:4px">Warranty ends in 47 days</div></div>
        </div>
        <div class="mob-card">
          <div class="mob-sechead">${ic("fingerprint")}Identification</div>
          <div class="mob-dl"><div><div class="k">Group</div><div class="v">Laptop</div></div><div><div class="k">Manufacturer</div><div class="v">Dell</div></div><div><div class="k">Serial</div><div class="v mono">5KQ8R2</div></div><div><div class="k">Location</div><div class="v">HCMC · F4 · E-12</div></div></div>
        </div>
        <div class="mob-card">
          <div class="mob-sechead">${ic("history")}Recent activity</div>
          <div class="mob-tl">
            <div class="mob-tlrow"><span class="mob-tldot">${ic("circle-dot")}</span><div><div class="ti">Status set to <b>In use</b></div><div class="tm">by Vinh Huynh · 2 days ago</div></div></div>
            <div class="mob-tlrow"><span class="mob-tldot">${ic("user-check")}</span><div><div class="ti">Moved to Desk E-12</div><div class="tm">5 days ago</div></div></div>
            <div class="mob-tlrow"><span class="mob-tldot">${ic("plus")}</span><div><div class="ti">Registered</div><div class="tm">12 Mar 2024</div></div></div>
          </div>
        </div>
      </div>` + tabbar("devices", nav)),

    createDevice: () => screen(
      head({ title:"Add device", back:true }) +
      `<div class="mob-body" style="padding-bottom:120px">
        <div class="mob-section-label">General</div>
        <div class="mob-field"><label class="mob-label">Device name <span class="req">*</span></label><div class="mob-input" style="color:var(--muted-foreground)">e.g. Dell XPS 15</div></div>
        <div class="mob-field"><label class="mob-label">Device code <span class="req">*</span></label><div class="mob-input mono" style="color:var(--muted-foreground)">DEV-0000-XXX</div></div>
        <div class="mob-field"><label class="mob-label">Group <span class="req">*</span></label><div class="mob-select">Select…${ic("chevron-down")}</div></div>
        <div class="mob-field"><label class="mob-label">Manufacturer</label><div class="mob-select">Select…${ic("chevron-down")}</div></div>
        <div class="mob-section-label" style="margin-top:14px">Lifecycle</div>
        <div class="mob-field"><label class="mob-label">Status</label><div class="mob-select">In storage${ic("chevron-down")}</div></div>
        <div class="mob-field"><label class="mob-label">Condition — 100%</label><input type="range" min="0" max="100" value="100" style="width:100%;accent-color:var(--primary)"></div>
      </div>
      <div class="mob-actionbar"><button class="mob-btn outline">Cancel</button><button class="mob-btn primary">${ic("check")}Create</button></div>`),

    editDevice: () => screen(
      head({ title:"Edit device", back:true }) +
      `<div class="mob-body" style="padding-bottom:120px">
        <div class="mob-section-label">General</div>
        <div class="mob-field"><label class="mob-label">Device name <span class="req">*</span></label><div class="mob-input">Dell XPS 15 9530</div></div>
        <div class="mob-field"><label class="mob-label">Device code <span class="req">*</span></label><div class="mob-input mono">DEV-2041-XPS</div></div>
        <div class="mob-field"><label class="mob-label">Group <span class="req">*</span></label><div class="mob-select" style="color:var(--foreground)">Laptop${ic("chevron-down")}</div></div>
        <div class="mob-field"><label class="mob-label">Status</label><div class="mob-select" style="color:var(--foreground)">In use${ic("chevron-down")}</div></div>
        <div class="mob-field"><label class="mob-label">Condition — 88%</label><input type="range" min="0" max="100" value="88" style="width:100%;accent-color:var(--primary)"></div>
      </div>
      <div class="mob-actionbar"><button class="mob-btn ghostdanger">${ic("trash-2")}</button><button class="mob-btn primary">${ic("check")}Save changes</button></div>`),

    more: (nav) => screen(
      head({ title:"More", avatar:"AT" }) +
      `<div class="mob-body">
        <div class="mob-card" style="display:flex;align-items:center;gap:13px;padding:16px"><span class="mob-avatar" style="width:46px;height:46px;font-size:16px">AT</span><div style="flex:1"><div style="font-size:16px;font-weight:600">Vinh Huynh</div><div style="font-size:12.5px;color:var(--muted-foreground)">vinh.huynh@gmail.com</div></div>${badge("primary","Admin",false)}</div>
        <div class="mob-section-label">Catalog</div>
        <div class="mob-card">
          <div class="mob-row"><span class="ric">${ic("boxes")}</span><span class="rm"><div class="rt">Units</div></span><span class="mob-badge muted">3</span><span class="chev">${ic("chevron-right")}</span></div>
          <div class="mob-row"><span class="ric">${ic("layers")}</span><span class="rm"><div class="rt">Groups</div></span><span class="mob-badge muted">8</span><span class="chev">${ic("chevron-right")}</span></div>
          <div class="mob-row"><span class="ric">${ic("factory")}</span><span class="rm"><div class="rt">Manufacturers</div></span><span class="mob-badge muted">8</span><span class="chev">${ic("chevron-right")}</span></div>
        </div>
        <div class="mob-section-label">System</div>
        <div class="mob-card">
          <div class="mob-row"><span class="ric">${ic("settings")}</span><span class="rm"><div class="rt">Settings</div></span><span class="chev">${ic("chevron-right")}</span></div>
          <div class="mob-row"><span class="ric" style="background:color-mix(in oklch,var(--destructive) 13%,var(--card));color:var(--destructive)">${ic("log-out")}</span><span class="rm"><div class="rt" style="color:var(--destructive)">Sign out</div></span></div>
        </div>
      </div>` + tabbar("more", nav)),

    units: (nav) => screen(
      head({ title:"Units", back:true, actions:`<span class="mob-iconbtn primary">${ic("plus")}</span>` }) +
      `<div class="mob-body">
        <div class="mob-card">
          ${[["Piece","A single, individually tracked item",10],["Set","A group counted and moved as one",1],["Box","A sealed carton of identical items",1]].map(([n,d,c])=>`
            <div class="mob-row"><span class="rm"><div class="rt">${n}</div><div class="rsub">${d}</div></span><span class="mob-badge secondary">${c} ${ic("arrow-right")}</span></div>`).join("")}
        </div>
      </div>` + tabbar("more", nav)),

    groups: (nav) => screen(
      head({ title:"Groups", back:true, actions:`<span class="mob-iconbtn primary">${ic("plus")}</span>` }) +
      `<div class="mob-body">
        <div class="mob-card">
          ${[["Laptop","laptop",3,12],["Monitor","monitor",2,24],["Desktop","monitor",2,12],["Printer","printer",1,12],["Server","server",1,6]].map(([n,i,c,m])=>`
            <div class="mob-row"><span class="ric">${ic(i)}</span><span class="rm"><div class="rt">${n}</div><div class="rsub">${m}-month cycle</div></span><span class="mob-badge secondary">${c} ${ic("arrow-right")}</span></div>`).join("")}
        </div>
      </div>` + tabbar("more", nav)),

    manufacturers: (nav) => screen(
      head({ title:"Manufacturers", back:true, actions:`<span class="mob-iconbtn primary">${ic("plus")}</span>` }) +
      `<div class="mob-body">
        <div class="mob-card">
          ${[["Dell","support.dell.com",3],["Apple","getsupport.apple.com",2],["HP","support.hp.com",2],["Lenovo","support.lenovo.com",1],["Synology","synology.com/support",1]].map(([n,s,c])=>`
            <div class="mob-row"><span class="rm"><div class="rt">${n}</div><div class="rsub mono">${s}</div></span><span class="mob-badge secondary">${c} ${ic("arrow-right")}</span></div>`).join("")}
        </div>
      </div>` + tabbar("more", nav)),

    members: (nav) => screen(
      head({ title:"Members", sub:"8 members", actions:`<span class="mob-iconbtn primary">${ic("user-plus")}</span>` }) +
      `<div class="mob-chips">
        <div class="mob-chip on">All</div><div class="mob-chip">Admins</div><div class="mob-chip">Members</div>
      </div>
      <div class="mob-body" style="padding-top:14px">
        <div class="mob-card">
          ${MEMBERS.map(m=>`
            <div class="mob-row"><span class="ravatar">${initials(m.name)}</span><span class="rm"><div class="rt">${m.name}${m.you?' <span style="font-size:10px;color:var(--muted-foreground);font-weight:500">You</span>':''}</div><div class="rsub">${m.site} · ${m.role}</div></span>${m.status==="invited"?badge("warning","Invited",true):badge(m.roleTone,m.role,false)}<span class="chev">${ic("chevron-right")}</span></div>`).join("")}
        </div>
      </div>` + tabbar("members", nav)),

    memberProfile: (nav) => screen(
      head({ title:"Profile", back:true, actions:`<span class="mob-iconbtn">${ic("pencil")}</span>` }) +
      `<div class="mob-body">
        <div class="mob-phead"><span class="pa">AT</span><div class="pn">Vinh Huynh</div><div class="pe">vinh.huynh@gmail.com</div><div class="pb">${badge("primary","Admin",false)}${badge("success","Active",true)}</div></div>
        <div class="mob-card">
          <div class="mob-sechead">${ic("id-card")}Details</div>
          <div class="mob-dl"><div><div class="k">Site</div><div class="v">HCMC</div></div><div><div class="k">Phone</div><div class="v mono">+84 28 7100 1010</div></div><div><div class="k">Member since</div><div class="v">Mar 2021</div></div><div><div class="k">Last active</div><div class="v">Active now</div></div></div>
        </div>
        <div class="mob-card">
          <div class="mob-sechead">${ic("key-round")}Permissions</div>
          ${[["View inventory",1],["Manage all devices",1],["Manage catalogs",1],["Manage members",1],["Change settings",1]].map(([l,y])=>`
            <div class="mob-perm ${y?'yes':'no'}"><span class="pic">${ic(y?'check':'minus')}</span>${l}</div>`).join("")}
        </div>
      </div>` + tabbar("members", nav)),

    settings: (nav) => screen(
      head({ title:"Settings", back:true }) +
      `<div class="mob-body">
        <div class="mob-section-label">Appearance</div>
        <div class="mob-card pad"><div class="mob-seg"><button>Light</button><button class="on">Dark</button><button>System</button></div></div>
        <div class="mob-section-label">Inventory defaults</div>
        <div class="mob-card">
          <div class="mob-row"><span class="rm"><div class="rt">Auto-generate code</div><div class="rsub">Suggest from group</div></span><span class="mob-switch on"></span></div>
          <div class="mob-row"><span class="rm"><div class="rt">Code prefix</div></span><span class="rsub mono">DEV-</span><span class="chev">${ic("chevron-right")}</span></div>
          <div class="mob-row"><span class="rm"><div class="rt">Inventory cycle</div></span><span class="rsub">12 months</span><span class="chev">${ic("chevron-right")}</span></div>
        </div>
        <div class="mob-section-label">Notifications</div>
        <div class="mob-card">
          <div class="mob-row"><span class="rm"><div class="rt">Warranty expiring</div><div class="rsub">90 days before</div></span><span class="mob-switch on"></span></div>
          <div class="mob-row"><span class="rm"><div class="rt">Weekly summary</div></span><span class="mob-switch on"></span></div>
          <div class="mob-row"><span class="rm"><div class="rt">New device added</div></span><span class="mob-switch"></span></div>
        </div>
      </div>` + tabbar("more", nav)),
  };

  window.MOBILE = { screens, tabbar };
})();
