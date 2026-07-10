#!/usr/bin/env python3
"""Attach embedded ledger photos to already-imported devices.

Run AFTER import_devices.py against the same target. Maps each embedded image
to its device by parsing the drawing-anchor row → asset code, uploads to the
device-photos bucket, and sets the device's `photos` JSONB.

  SUPABASE_URL=... SUPABASE_KEY=... python3 import_photos.py [--ledger-dir DIR]

Requires: pip install supabase openpyxl
Photos are additive (does not clear existing). Re-running duplicates uploads,
so run once per import.
"""
import argparse, os, posixpath, re, sys, uuid, zipfile
from collections import defaultdict
from datetime import datetime, timezone

import openpyxl
from supabase import create_client

# Prefer defusedxml (hardened against XXE / billion-laughs); fall back to the
# stdlib parser for these trusted, locally-owned ledger files.
try:
    import defusedxml.ElementTree as ET
except ImportError:
    import xml.etree.ElementTree as ET

SHEETS = ('Kiểm kê tài sản', 'kiểm kê CCDC')
NS = {
    'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
    'pr': 'http://schemas.openxmlformats.org/package/2006/relationships',
    'xdr': 'http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing',
    'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
    'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
}


def env(name):
    v = os.environ.get(name)
    if not v:
        sys.exit(f"error: {name} env var is required.")
    return v


def norm(s):
    return re.sub(r'\s+', ' ', str(s).replace('\n', ' ')).strip() if s is not None else ''


def code_map(path, room):
    """{(room, sheet): {excel_row: code}} using the same header-label rules."""
    out = defaultdict(dict)
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    for sheet in SHEETS:
        ws = wb[sheet]
        hr = next((r for r in range(1, 20) if norm(ws.cell(r, 1).value).upper() == 'STT'), None)
        cc = next((c for c in range(1, ws.max_column + 1)
                   if 'mã' in norm(ws.cell(hr, c).value).lower()), None)
        for r in range(hr + 1, ws.max_row + 1):
            code = norm(ws.cell(r, cc).value)
            if code:
                out[(room, sheet)][r] = code
    wb.close()
    return out


def rels(z, path):
    relpath = posixpath.join(posixpath.dirname(path), '_rels', posixpath.basename(path) + '.rels')
    if relpath not in z.namelist():
        return {}
    return {rel.get('Id'): posixpath.normpath(posixpath.join(posixpath.dirname(path), rel.get('Target')))
            for rel in ET.fromstring(z.read(relpath)).findall('pr:Relationship', NS)}


def extract(path, room, rc):
    """yield (code, image_bytes, orig_name) for each embedded image."""
    z = zipfile.ZipFile(path)
    wbx = ET.fromstring(z.read('xl/workbook.xml'))
    wb_rels = rels(z, 'xl/workbook.xml')
    name_to_ws = {s.get('name'): wb_rels[s.get('{%s}id' % NS['r'])]
                  for s in wbx.find('main:sheets', NS).findall('main:sheet', NS)}
    for sheet in SHEETS:
        wsx_path = name_to_ws[sheet]
        ws_rels = rels(z, wsx_path)
        dr = ET.fromstring(z.read(wsx_path)).find('main:drawing', NS)
        if dr is None:
            continue
        drawing_path = ws_rels[dr.get('{%s}id' % NS['r'])]
        dr_rels = rels(z, drawing_path)
        for anc in list(ET.fromstring(z.read(drawing_path))):
            frm = anc.find('xdr:from', NS)
            blip = anc.find('.//a:blip', NS)
            if frm is None or blip is None:
                continue
            excel_row = int(frm.find('xdr:row', NS).text) + 1
            img_path = dr_rels.get(blip.get('{%s}embed' % NS['r']))
            codes = rc[(room, sheet)]
            code = codes.get(excel_row) or next(
                (codes[excel_row + d] for d in (-1, 1, -2, 2, -3, 3) if excel_row + d in codes), None)
            if code and img_path:
                yield code, z.read(img_path), posixpath.basename(img_path)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--ledger-dir', default=os.environ.get('LEDGER_DIR', '.'))
    args = ap.parse_args()
    url, key = env('SUPABASE_URL'), env('SUPABASE_KEY')
    files = {r: os.path.join(args.ledger_dir, f) for f in os.listdir(args.ledger_dir)
             if f.endswith('.xlsx') for r in ('P402', 'P501', 'P502') if r in f}
    if len(files) != 3:
        sys.exit(f"error: expected 3 ledgers in {args.ledger_dir}, found {sorted(files)}")

    sk = create_client(url, key)
    # (code, room) -> device id  (room parsed from the location prefix)
    dev = {}
    for d in sk.table('devices').select('id,code,location').execute().data:
        dev[(d['code'], (d['location'] or '').split(' ')[0])] = d['id']

    photos = defaultdict(list)  # device id -> descriptors
    for room, path in sorted(files.items()):
        rc = code_map(path, room)
        for code, data, orig in extract(path, room, rc):
            dev_id = dev.get((code, room))
            if not dev_id:
                print(f"  skip: no device for {room}/{code}")
                continue
            keypath = f"{dev_id}/{uuid.uuid4()}.jpg"
            sk.storage.from_('device-photos').upload(
                keypath, data, {'content-type': 'image/jpeg', 'upsert': 'false'})
            photos[dev_id].append({
                'path': keypath, 'file_name': orig, 'size_bytes': len(data),
                'mime_type': 'image/jpeg', 'sort_order': len(photos[dev_id]),
                'uploaded_at': datetime.now(timezone.utc).isoformat(),
            })

    for dev_id, descs in photos.items():
        sk.table('devices').update({'photos': descs}).eq('id', dev_id).execute()
    print(f"uploaded {sum(len(v) for v in photos.values())} photos across {len(photos)} devices")


if __name__ == '__main__':
    main()
