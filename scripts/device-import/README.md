# Device import

One-off importer for the 3 asset ledgers (`Sổ tài sản - P402/P501/P502 ….xlsx`).
Maps **directly from the Excel files** (deterministic) into Supabase — the same
scripts target local or remote purely via env vars.

## Prerequisites

```sh
pip install supabase openpyxl defusedxml
```

The 3 `.xlsx` ledgers must be present (default `--ledger-dir .`; they live at the
repo root and are not committed).

## Run

Order matters: devices first, then photos.

```sh
# 1. Devices  (WIPE=1 clears existing devices first — clean re-import)
SUPABASE_URL=<url> SUPABASE_KEY=<secret/service_role> WIPE=1 \
  python3 import_devices.py --ledger-dir /path/to/ledgers

# 2. Photos  (attaches ~84 embedded JPEGs to the imported devices)
SUPABASE_URL=<url> SUPABASE_KEY=<secret/service_role> \
  python3 import_photos.py --ledger-dir /path/to/ledgers
```

**Local** (`supabase status` → API URL + Secret key):

```sh
SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_KEY=sb_secret_… WIPE=1 python3 import_devices.py
SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_KEY=sb_secret_… python3 import_photos.py
```

**Remote** — use the project URL and the **service_role / secret** key (bypasses RLS).
Both env vars are required (no defaults) so you can't run against the wrong target by accident.

## What it does (mapping decisions)

- **648 devices**, room from filename → `location` (`P402 · <Vị trí>`), unit CEE.
- `manufacturer` → one seeded **`Unknown`** (ledgers have no vendor data).
- **Groups**: ~75 raw categories → **68** canonical (near-dups merged by casing/punctuation).
- **Units** → `device_unit` enum: Cái→`piece`, Bộ→`set`, Con→`unit`, Thùng→`box`, Chiếc→`item`; blank→`piece`.
- **Codes** kept verbatim (not globally unique — ledgers reuse tags across rooms).
- **Quantity** = accounting qty (fallback counted qty, else 1).
- **Condition** = 100, except rows flagged `hư` (broken) → 30.
- **Import date** = `dd/mm/yy` or Excel date → ISO, else null.
- **Notes** = assignee (`Người sử dụng`), `hư` flag, and original `Ghi chú`.
- **Photos**: embedded JPEGs mapped to devices via drawing-anchor row → uploaded to
  the `device-photos` bucket, `photos` JSONB set (cover = first).

Idempotency: manufacturer + groups are upserted by name. `import_devices.py` with
`WIPE=1` deletes all devices first. `import_photos.py` is additive — run once per import.

## parse_ledgers.py — ledgers → JSON (no DB)

Structured extraction of **all 648 item rows** into JSON, including the columns
the importer ignores (`Thừa`/`Thiếu` surplus/missing, `Phẩm chất` quality marks)
and a derived `loan` block interpreting the checkout/check-in signals embedded
in the sheets:

| Signal | Source | JSON |
|---|---|---|
| Active borrower | `Người sử dụng` = person (thầy/cô/anh/chị/sếp …) | `loan.borrower` (9 rows) |
| Borrowed/held per note | `Ghi chú` "… mượn" / "… giữ" | `loan.borrowerNote` (2) |
| Lost units | `Thiếu` subcolumn | `missingQty` (31 rows) |
| Returned | note "Đã trả" | `loan.returned` (1) |
| Return requested | note "yêu cầu/đề xuất trả" | `loan.returnRequested` (3) |
| Transfer slip | note "phiếu điều chuyển … NNN" | `loan.transferTo` (9) |
| Decommission request | "XIN GIẢM MÃ" | `loan.decommissionRequested` (4) |
| Serial number | note "Mã seri …" | `serialNumber` (16) |
| Broken | `hư` in image/user column | `broken` (4) |

`Người sử dụng` free text that is *not* a person (`hư`, `Thiếu 1`, `Nằm ở 504`, …)
stays in `user` without becoming a borrower.

```sh
python3 parse_ledgers.py --ledger-dir /path/to/ledgers   # out: ./json/
```

Writes `json/P402.json`, `json/P501.json`, `json/P502.json` + combined
`json/all.json` (gitignored — contains staff names) and prints a signal summary.
Row detection mirrors `import_devices.py`, so counts line up (648).
