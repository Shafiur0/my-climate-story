#!/usr/bin/env python3
"""
build_data.py — regenerate app/js/data.js from the research workbook.

    python scripts/build_data.py

Reads   Delta_Detectives_NASA_Climate_Evidence.xlsx   (repo root)
Writes  app/js/data.js

The workbook is the source of truth. It was assembled from the NASA POWER monthly
point API and the NASA GISTEMP v4 table; this script only reshapes it into the
compact bundle the frontend ships with, so the site works with no network.

Requires: openpyxl   (pip install openpyxl)
"""

import json
import math
import statistics
import sys
from pathlib import Path

try:
    import openpyxl
except ImportError:
    sys.exit("openpyxl is required:  pip install openpyxl")

ROOT = Path(__file__).resolve().parent.parent
WORKBOOK = ROOT / "Delta_Detectives_NASA_Climate_Evidence.xlsx"
OUT = ROOT / "app" / "js" / "data.js"

# Display metadata that does not live in the workbook.
# `bbox` is only a fallback — the frontend derives its own bbox from lat/lon and aspect.
SITE_META = {
    "Dhaka": dict(
        id="dhaka", bn="ঢাকা", kind="Mega-delta capital",
        note="Dense urban core on the Buriganga and Turag.",
    ),
    "Satkhira": dict(
        id="satkhira", bn="সাতক্ষীরা", kind="Coastal southwest",
        note="Sundarbans edge, tidal rivers and salinity.",
    ),
    "Sylhet": dict(
        id="sylhet", bn="সিলেট", kind="Wet northeast",
        note="Tea terraces and the Surma valley.",
    ),
    "Bhola": dict(
        id="bhola", bn="ভোলা", kind="Meghna estuary island",
        note="River island exposed to the open bay.",
    ),
}

META = {
    "team": "Delta Detectives",
    "app": "My Climate Story",
    "challenge": "Be an Earth System Trend Detective",
    "event": "NASA Space Apps Challenge 2026",
    "retrieved": "23 October 2026",
    "global2024": 1.28,
    "nMonthly": 1920,
    "nAnnual": 160,
    "nTests": 96,
}


def rows(ws):
    """Yield data rows, skipping the header."""
    it = ws.iter_rows(values_only=True)
    next(it)
    for r in it:
        if r and r[0]:
            yield r


def read_annual(wb):
    """Annual NASA sheet: Place, Lat, Lon, Year, T2M C, precip mm."""
    annual = {}
    for r in rows(wb["Annual NASA"]):
        place, lat, lon, year, t2m, precip = r[0], r[1], r[2], r[3], r[4], r[5]
        annual.setdefault(place, {"lat": lat, "lon": lon, "series": []})
        annual[place]["series"].append([int(year), round(float(t2m), 2), round(float(precip), 1)])
    return annual


def read_monthly(wb):
    """Monthly NASA sheet: Place, Lat, Lon, Year, Month, Days, T2M C, PRECTOTCORR mm/day.

    Returns the September series (2001+) and a 12-month climatology per place.
    """
    sept = {}
    clim_src = {}
    for r in rows(wb["Monthly NASA"]):
        place = r[0]
        year, month = int(r[3]), int(r[4])
        t2m = r[6]
        if t2m is None:
            continue
        clim_src.setdefault(place, {}).setdefault(month, []).append(float(t2m))
        if month == 9 and year >= 2001:
            sept.setdefault(place, []).append([year, round(float(t2m), 2)])

    clim = {}
    for p, months in clim_src.items():
        row = []
        for m in range(1, 13):
            vals = months.get(m)
            row.append(round(statistics.mean(vals), 2) if vals else None)
        clim[p] = row
    return sept, clim


def read_trends(wb):
    """Trend Tests sheet: Place, Start, End, Month, slope, lo, hi, tau, p, q."""
    out = []
    for r in rows(wb["Trend Tests"]):
        out.append({
            "site": r[0], "start": int(r[1]), "end": int(r[2]), "month": int(r[3]),
            "slope": round(float(r[4]), 3), "lo": round(float(r[5]), 3),
            "hi": round(float(r[6]), 3), "tau": round(float(r[7]), 3),
            "p": float(r[8]), "q": float(r[9]),
        })
    return out


def read_gistemp(wb):
    return [[int(r[0]), float(r[1])] for r in rows(wb["Global GISTEMP"])]


def decade_compare(annual):
    """1985-1994 vs 2015-2024 means — the data-quality finding shown on the Method page."""
    out = {}
    for place, d in annual.items():
        s = d["series"]
        early = [x for x in s if 1985 <= x[0] <= 1994]
        late = [x for x in s if 2015 <= x[0] <= 2024]
        out[place] = {
            "tEarly": round(statistics.mean(x[1] for x in early), 2),
            "tLate": round(statistics.mean(x[1] for x in late), 2),
            "pEarly": round(statistics.mean(x[2] for x in early)),
            "pLate": round(statistics.mean(x[2] for x in late)),
        }
    return out


def main():
    if not WORKBOOK.exists():
        sys.exit(f"Workbook not found: {WORKBOOK}")

    wb = openpyxl.load_workbook(WORKBOOK, data_only=True)

    annual = read_annual(wb)
    sept, clim = read_monthly(wb)
    trends = read_trends(wb)
    gistemp = read_gistemp(wb)
    dq = decade_compare(annual)

    sites = []
    for place, d in annual.items():
        meta = SITE_META[place]
        trend = next(t for t in trends
                     if t["site"] == place and t["start"] == 2001 and t["month"] == 9)
        last = d["series"][-1]
        lat, lon = float(d["lat"]), float(d["lon"])
        span = 0.9
        lon_span = span / max(0.2, math.cos(math.radians(lat)))
        sites.append({
            "name": place,
            "bn": meta["bn"],
            "id": meta["id"],
            "lat": lat,
            "lon": lon,
            "bbox": [round(lon - lon_span / 2, 4), round(lat - span / 2, 4),
                     round(lon + lon_span / 2, 4), round(lat + span / 2, 4)],
            "kind": meta["kind"],
            "note": meta["note"],
            "annual": d["series"],
            "clim": clim[place],
            "sept": sept[place],
            "trend": {"slope": trend["slope"], "lo": trend["lo"], "hi": trend["hi"],
                      "tau": trend["tau"], "p": trend["p"], "q": trend["q"]},
            "t2024": last[1],
            "p2024": last[2],
            "dq": dq[place],
        })

    bundle = {"meta": META, "sites": sites, "trends": trends, "gistemp": gistemp}

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", encoding="utf-8") as f:
        f.write("/* My Climate Story — NASA data bundle\n")
        f.write("   Sources: NASA POWER (MERRA-2) monthly point API, NASA GISTEMP v4\n")
        f.write("   Retrieved 23 October 2026. Values are model-based reanalysis estimates.\n")
        f.write("   GENERATED by scripts/build_data.py — do not edit by hand.\n")
        f.write("   Input: Delta_Detectives_NASA_Climate_Evidence.xlsx */\n")
        f.write("window.NASA_DATA = ")
        f.write(json.dumps(bundle, ensure_ascii=False, separators=(",", ":")))
        f.write(";\n")

    print(f"wrote {OUT.relative_to(ROOT)}  ({OUT.stat().st_size / 1024:.0f} KB)")
    print(f"  sites   {len(sites)}: {', '.join(s['name'] for s in sites)}")
    print(f"  trends  {len(trends)} tests")
    print(f"  gistemp {len(gistemp)} years")
    for s in sites:
        print(f"  {s['name']:<9} sept n={len(s['sept']):<3} "
              f"slope {s['trend']['slope']:+.3f} °C/dec  q={s['trend']['q']:.4f}")


if __name__ == "__main__":
    main()
