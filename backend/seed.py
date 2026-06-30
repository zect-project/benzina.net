import asyncio
import json
import sys
from pathlib import Path

import httpx
from sqlalchemy import select

from .database import async_session, init_db
from .models import Station

# Bounding box for Novosibirsk and suburbs
OSM_QUERY = """
[out:json][timeout:180];
(
  node["amenity"="fuel"](54.8,82.65,55.2,83.35);
  way["amenity"="fuel"](54.8,82.65,55.2,83.35);
);
out center;
"""

FUEL_MAP = {
    "fuel:diesel": "diesel",
    "fuel:octane_92": "92",
    "fuel:octane_95": "95",
    "fuel:octane_98": "98",
    "fuel:octane_100": "100",
    "fuel:lpg": "lpg",
    "fuel:cng": "cng",
}


def parse_station(element: dict) -> dict | None:
    tags = element.get("tags", {})

    lat = element.get("lat")
    lng = element.get("lon")
    if not lat:
        center = element.get("center", {})
        lat = center.get("lat")
        lng = center.get("lon")
    if not lat or not lng:
        return None

    fuels = {}
    for osm_key, fuel_name in FUEL_MAP.items():
        val = tags.get(osm_key)
        if val == "yes":
            fuels[fuel_name] = "available"

    addr_parts = [
        tags.get("addr:full"),
        tags.get("addr:street"),
        tags.get("addr:city"),
    ]
    address = ", ".join(p for p in addr_parts if p)

    name = tags.get("name") or tags.get("brand") or tags.get("operator") or "АЗС"

    return {
        "osm_id": str(element.get("type", "node")) + "/" + str(element["id"]),
        "brand": tags.get("brand"),
        "name": name,
        "operator": tags.get("operator"),
        "address": address,
        "lat": float(lat),
        "lng": float(lng),
        "fuels_raw": fuels if fuels else None,
    }


async def fetch_from_osm() -> list[dict]:
    async with httpx.AsyncClient(timeout=200) as client:
        resp = await client.post(
            "https://overpass-api.de/api/interpreter",
            data={"data": OSM_QUERY.strip()},
            headers={"User-Agent": "benzina.net/1.0"},
        )
        resp.raise_for_status()
        data = resp.json()

    stations = []
    for element in data.get("elements", []):
        parsed = parse_station(element)
        if parsed:
            stations.append(parsed)

    return stations


def save_to_json(stations: list[dict], path: str = "stations.json"):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(stations, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(stations)} stations to {path}")


def load_from_json(path: str = "stations.json") -> list[dict]:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


async def populate_db(stations: list[dict]):
    await init_db()
    async with async_session() as session:
        existing = (await session.execute(select(Station.osm_id))).scalars().all()
        existing_set = set(existing)

        count = 0
        for s in stations:
            if s["osm_id"] in existing_set:
                continue
            station = Station(**s)
            session.add(station)
            count += 1

        await session.commit()
        print(f"Inserted {count} new stations into DB")


async def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "fetch"

    if cmd == "fetch":
        print("Fetching stations from Overpass API...")
        stations = await fetch_from_osm()
        save_to_json(stations)

    elif cmd == "load":
        stations = load_from_json()
        await populate_db(stations)

    elif cmd == "all":
        stations = await fetch_from_osm()
        save_to_json(stations)
        await populate_db(stations)

    else:
        print("Commands: fetch, load, all")


if __name__ == "__main__":
    asyncio.run(main())
