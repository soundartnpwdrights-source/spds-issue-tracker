"""Build the public data.json from an export of the tracker database.

Usage: python3 tools/build_data.py <export_dir> <output data.json>
<export_dir> holds issues/*.json and reports/*.json (ArtifactData list with out_dir).
Removes DAP names and long ID numbers (Aadhaar, PDS, UDID) from report text.
"""
import json, glob, os, re, sys
from datetime import datetime, timezone, timedelta

exp, out = sys.argv[1], sys.argv[2]
KNOWN = ["Shunmugathai","Karthikeyan","Krishnammal","Jeevesh","Sakthivel","N.B. Saswin","Sivakumar R",
         "Ganapandithan","Thirumaikumar","P.Ganesan","Mariyammal","Swarnalatha","OVIYAN.V"]

def clean(m):
    m = m or ""
    for n in KNOWN:
        m = re.sub(r"\bDAP " + re.escape(n) + r"\b", "a DAP", m)
        m = m.replace(n, "[name removed]")
    m = re.sub(r"\b(DAP|Dap|dap)( name)?\s*[:\-]\s*[A-Z][\w. ]{1,30}", r"\1", m)
    m = re.sub(r"\b(TN)?\d{9,}\b", "[number removed]", m)
    m = re.sub(r"^ ?a DAP", "A DAP", m)
    return m.strip()

def load(kind):
    rows = []
    for f in sorted(glob.glob(os.path.join(exp, kind, "*.json"))):
        d = json.load(open(f, encoding="utf-8"))
        d = d.get("data", d)
        d["id"] = os.path.basename(f)[:-5]
        rows.append(d)
    return rows

issues, reports = load("issues"), load("reports")
for i in issues:
    for k in ("title", "resolution"):
        i[k] = clean(i.get(k, ""))
    for k in ("createdAt", "updatedAt", "source"):
        i.pop(k, None)
for r in reports:
    r["message"] = clean(r.get("message", ""))
    r["reportedBy"] = clean(r.get("reportedBy", ""))
    for k in ("appNo", "createdAt", "source"):
        r.pop(k, None)
now = datetime.now(timezone(timedelta(hours=5, minutes=30))).isoformat(timespec="minutes")
json.dump({"updated": now, "issues": issues, "reports": reports},
          open(out, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print(f"{len(issues)} issues, {len(reports)} reports -> {out}")
