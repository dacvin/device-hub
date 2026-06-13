/* DeviceHub — seed data for static mockups */
window.LOOKUPS = {
  groups: ["Laptop", "Desktop", "Monitor", "Printer", "Network", "Server", "Mobile", "Peripheral"],
  manufacturers: ["Dell", "Apple", "Lenovo", "HP", "Cisco", "Synology", "Logitech", "Samsung"],
  units: ["Piece", "Set", "Box"],
  sources: ["Purchased", "Leased", "Donated", "Transferred"],
};

/* Reference "today" so derived flags are deterministic in the mock. */
window.DH_TODAY = new Date("2026-05-30");

/* STATUS = lifecycle state. A device is exactly ONE of these (mutually exclusive).
   Set by admins (assign → in use, send for service → repair, decommission → retired). */
window.STATUS = {
  "in-use":  { label: "In use",     tone: "success" },
  "storage": { label: "In storage", tone: "info" },
  "repair":  { label: "In repair",  tone: "warning" },
  "retired": { label: "Retired",    tone: "muted" },
};

/* FLAGS = attention indicators. Independent of status and of each other — a device
   can carry zero, one, or several. Derived from dates, never stored. */
window.FLAGS = {
  warranty:  { label: "Warranty expiring", icon: "shield-alert",   tone: "warning" },
  inventory: { label: "Inventory overdue", icon: "calendar-clock", tone: "warning" },
};

/* Derive the flag list for a device — warranty expiring soon, inventory overdue. */
window.deviceFlags = function (d, today) {
  today = today || window.DH_TODAY || new Date();
  const out = [];
  if (d.status === "retired") return out;          // no alerts on retired gear
  if (d.wEnd) {
    const end = new Date(d.wEnd);
    const in90 = new Date(today); in90.setDate(in90.getDate() + 90);
    if (end >= today && end <= in90) out.push("warranty");   // expiring soon (not already expired)
  }
  if (d.lastCheck) {
    const due = new Date(d.lastCheck); due.setMonth(due.getMonth() + (d.cycle || 12));
    if (due < today) out.push("inventory");                  // overdue for a check
  }
  return out;
};

window.DEVICES = [
  { code:"DEV-2041-XPS",  name:"Dell XPS 15 9530",        group:"Laptop",  mfr:"Dell",     model:"XPS 15 9530",      sn:"5KQ8R2",   cond:92, loc:"HCMC · Floor 4 · Desk E-12", qty:1,  status:"in-use",  unit:"Piece", source:"Purchased", imported:"2023-08-14", lastCheck:"2025-03-02", cycle:12, wStart:"2023-08-14", wEnd:"2026-08-14", spec:"Intel i7-13700H · 32GB · 1TB SSD · RTX 4050", photo:"assets/devicephotos/DEV-2041-XPS.png" },
  { code:"DEV-2088-MBP",  name:"MacBook Pro 14 M3",       group:"Laptop",  mfr:"Apple",    model:"MacBook Pro 14",   sn:"C02XR3",   cond:88, loc:"HCMC · Floor 3 · Desk D-04", qty:1,  status:"in-use",  unit:"Piece", source:"Purchased", imported:"2024-01-20", lastCheck:"2026-04-11", cycle:12, wStart:"2024-01-20", wEnd:"2027-01-20", spec:"Apple M3 Pro · 36GB · 1TB SSD", photo:"assets/devicephotos/DEV-2088-MBP.png" },
  { code:"DEV-1903-T14",  name:"ThinkPad T14 Gen 4",      group:"Laptop",  mfr:"Lenovo",   model:"ThinkPad T14",     sn:"PF3K9A",   cond:74, loc:"Hanoi · Floor 2 · Desk S-21", qty:1, status:"in-use",  unit:"Piece", source:"Leased",    imported:"2022-06-30", lastCheck:"2026-03-18", cycle:12, wStart:"2022-06-30", wEnd:"2025-06-30", spec:"AMD Ryzen 7 · 16GB · 512GB SSD" },
  { code:"DEV-3110-U27",  name:"Dell UltraSharp U2723QE", group:"Monitor", mfr:"Dell",     model:"U2723QE",          sn:"CN0H2M",   cond:96, loc:"HCMC · Floor 4 · Desk E-12", qty:2, status:"in-use",  unit:"Piece", source:"Purchased", imported:"2023-08-14", lastCheck:"2025-03-02", cycle:24, wStart:"2023-08-14", wEnd:"2026-08-14", spec:'27" 4K IPS · USB-C 90W hub', photo:"assets/devicephotos/DEV-3110-U27.png" },
  { code:"DEV-4501-LJ",   name:"HP LaserJet Pro M404",    group:"Printer", mfr:"HP",       model:"LaserJet M404",    sn:"VNB8C1",   cond:61, loc:"HCMC · Floor 1 · Print room", qty:1, status:"in-use",  unit:"Piece", source:"Purchased", imported:"2021-11-05", lastCheck:"2024-01-09", cycle:12, wStart:"2021-11-05", wEnd:"2023-11-05", spec:"Mono laser · duplex · network", photo:"assets/devicephotos/DEV-4501-LJ.png" },
  { code:"DEV-5002-SW",   name:"Cisco Catalyst 9200",     group:"Network", mfr:"Cisco",    model:"Catalyst 9200",    sn:"FOC24K",   cond:99, loc:"HCMC · Server room · Rack A", qty:1, status:"in-use",  unit:"Piece", source:"Purchased", imported:"2024-03-12", lastCheck:"2026-04-30", cycle:6,  wStart:"2024-03-12", wEnd:"2029-03-12", spec:"48-port PoE+ managed switch", photo:"assets/devicephotos/DEV-5002-SW.png" },
  { code:"DEV-5210-NAS",  name:"Synology RS1221+",        group:"Server",  mfr:"Synology", model:"RS1221+",          sn:"21F0PT",   cond:95, loc:"HCMC · Server room · Rack A", qty:1, status:"in-use",  unit:"Piece", source:"Purchased", imported:"2023-02-28", lastCheck:"2026-04-30", cycle:6,  wStart:"2023-02-28", wEnd:"2026-02-28", spec:"8-bay rackmount NAS · 64TB", photo:"assets/devicephotos/DEV-5210-NAS.png" },
  { code:"DEV-6033-IPH",  name:"iPhone 14 (test)",        group:"Mobile",  mfr:"Apple",    model:"iPhone 14",        sn:"DX3R8L",   cond:80, loc:"HCMC · Floor 3 · QA cabinet", qty:1, status:"storage", unit:"Piece", source:"Purchased", imported:"2023-05-19", lastCheck:"2026-02-22", cycle:12, wStart:"2023-05-19", wEnd:"2025-05-19", spec:"128GB · QA device pool" },
  { code:"DEV-7001-C920", name:"Logitech C920 Webcam",    group:"Peripheral", mfr:"Logitech", model:"C920",             sn:"LZ9920",   cond:70, loc:"HCMC · Floor 2 · Meeting B", qty:4, status:"in-use",  unit:"Set",   source:"Purchased", imported:"2022-09-10", lastCheck:"2024-11-15", cycle:24, wStart:"2022-09-10", wEnd:"2024-09-10", spec:"1080p webcam · meeting rooms", photo:"assets/devicephotos/DEV-7001-C920.png" },
  { code:"DEV-3140-S27",  name:"Samsung S27 ViewFinity",  group:"Monitor", mfr:"Samsung",  model:"S27 ViewFinity",   sn:"SM27VF",   cond:90, loc:"HCMC · Floor 5 · Desk F-08", qty:1, status:"in-use",  unit:"Piece", source:"Purchased", imported:"2024-02-02", lastCheck:"2025-03-28", cycle:24, wStart:"2024-02-02", wEnd:"2027-02-02", spec:'27" QHD · 100Hz', photo:"assets/devicephotos/DEV-3140-S27.png" },
  { code:"DEV-1850-OPT",  name:"Dell OptiPlex 7010",      group:"Desktop", mfr:"Dell",     model:"OptiPlex 7010",    sn:"DLOPT7",   cond:34, loc:"Service bench · HCMC · IT", qty:1, status:"repair",  unit:"Piece", source:"Purchased", imported:"2020-04-17", lastCheck:"2026-02-01", cycle:12, wStart:"2020-04-17", wEnd:"2023-04-17", spec:"i5-13500 · 16GB · 512GB — PSU fault, awaiting part" },
  { code:"DEV-1620-PRE",  name:"Lenovo ThinkCentre M70q", group:"Desktop", mfr:"Lenovo",   model:"ThinkCentre M70q", sn:"LNM70Q",   cond:55, loc:"Storage · Hanoi · Cabinet 1", qty:1, status:"retired",   unit:"Piece", source:"Transferred", imported:"2019-12-03", lastCheck:"2023-06-20", cycle:12, wStart:"2019-12-03", wEnd:"2022-12-03", spec:"Decommissioned — pending disposal" },
];
