from contextlib import asynccontextmanager
from datetime import datetime, timedelta

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, func, nulls_last
from sqlalchemy.orm import selectinload

from .database import init_db, async_session, get_session, engine
from .models import Station, Report
from .schemas import (
    FuelReport,
    ReportResponse,
    StationResponse,
    StationDetailResponse,
    StatsResponse,
    UserStatsResponse,
)

FUEL_TYPES = ["fuel_92", "fuel_95", "fuel_98", "fuel_diesel"]


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="benzina.net", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def compute_weight(total_reports: int) -> int:
    return min(5, 1 + total_reports // 20)


async def get_user_report_count(session, user_id: str) -> int:
    cnt = await session.scalar(
        select(func.count(Report.id)).where(Report.user_id == user_id)
    )
    return cnt or 0


async def compute_station_status(session, reports: list[Report]) -> tuple[str, dict[str, str]]:
    fuel_scores: dict[str, dict[str, float]] = {
        ft: {"available": 0.0, "none": 0.0}
        for ft in FUEL_TYPES
    }

    for r in reports:
        user_reports_count = await get_user_report_count(session, r.user_id)
        weight = compute_weight(user_reports_count)
        if weight == 0:
            continue
        fuels = r.fuels or {}
        for ft in FUEL_TYPES:
            val = fuels.get(ft, "unknown")
            if val in fuel_scores[ft]:
                fuel_scores[ft][val] += weight

    fuel_details: dict[str, str] = {}
    overall_values = []
    for ft in FUEL_TYPES:
        scores = fuel_scores[ft]
        best = max(scores, key=scores.get)
        if scores[best] == 0:
            fuel_details[ft] = "unknown"
        else:
            fuel_details[ft] = best
            overall_values.append(best)

    if not overall_values:
        return "unknown", fuel_details
    if all(v == "available" for v in overall_values):
        return "available", fuel_details
    if all(v == "none" for v in overall_values):
        return "none", fuel_details
    return "partial", fuel_details


@app.get("/api/stations", response_model=list[StationResponse])
async def list_stations(
    search: str = "",
    user_id: str = Query(default=""),
    session=Depends(get_session),
):
    query = select(Station)
    if search:
        query = query.where(
            Station.name.ilike(f"%{search}%")
            | Station.brand.ilike(f"%{search}%")
            | Station.address.ilike(f"%{search}%")
            | Station.operator.ilike(f"%{search}%")
        )
    query = query.order_by(nulls_last(Station.name)).options(selectinload(Station.reports))
    result = await session.execute(query)
    stations = result.scalars().all()

    user_w = 0
    if user_id:
        cnt = await get_user_report_count(session, user_id)
        user_w = compute_weight(cnt)

    out = []
    for s in stations:
        status, fuel_details = await compute_station_status(session, s.reports)
        out.append(StationResponse(
            id=s.id,
            osm_id=s.osm_id,
            brand=s.brand,
            name=s.name,
            operator=s.operator,
            address=s.address,
            lat=s.lat,
            lng=s.lng,
            status=status,
            fuel_details=fuel_details if any(v != "unknown" for v in fuel_details.values()) else None,
            report_count=len(s.reports),
            user_weight=user_w,
            created_at=s.created_at,
        ))
    return out


@app.get("/api/stations/{station_id}", response_model=StationDetailResponse)
async def get_station(
    station_id: int,
    user_id: str = Query(default=""),
    session=Depends(get_session),
):
    query = (
        select(Station)
        .where(Station.id == station_id)
        .options(selectinload(Station.reports))
    )
    result = await session.execute(query)
    s = result.scalar_one_or_none()
    if not s:
        raise HTTPException(404, "Station not found")

    status, fuel_details = await compute_station_status(session, s.reports)

    user_w = 0
    if user_id:
        cnt = await get_user_report_count(session, user_id)
        user_w = compute_weight(cnt)

    return StationDetailResponse(
        id=s.id,
        osm_id=s.osm_id,
        brand=s.brand,
        name=s.name,
        operator=s.operator,
        address=s.address,
        lat=s.lat,
        lng=s.lng,
        status=status,
        fuel_details=fuel_details if any(v != "unknown" for v in fuel_details.values()) else None,
        report_count=len(s.reports),
        user_weight=user_w,
        created_at=s.created_at,
        reports=[ReportResponse.model_validate(r) for r in sorted(s.reports, key=lambda x: x.created_at, reverse=True)],
    )


@app.post("/api/stations/{station_id}/report", response_model=ReportResponse)
async def create_report(station_id: int, report: FuelReport, session=Depends(get_session)):
    station = await session.get(Station, station_id)
    if not station:
        raise HTTPException(404, "Station not found")

    if not report.user_id or len(report.user_id) < 8:
        raise HTTPException(400, "Invalid user_id")

    ten_min_ago = datetime.utcnow() - timedelta(minutes=10)
    recent = await session.execute(
        select(Report).where(
            Report.station_id == station_id,
            Report.user_id == report.user_id,
            Report.created_at > ten_min_ago,
        )
    )
    if recent.scalar_one_or_none():
        raise HTTPException(429, "Можно отмечать раз в 10 минут")

    db_report = Report(
        station_id=station_id,
        user_id=report.user_id,
        fuels=report.model_dump(exclude={"user_id"}),
    )
    session.add(db_report)
    await session.commit()
    await session.refresh(db_report)

    return ReportResponse.model_validate(db_report)


@app.get("/api/stats", response_model=StatsResponse)
async def get_stats(session=Depends(get_session)):
    total = await session.scalar(select(func.count(Station.id)))
    reported = await session.scalar(
        select(func.count(func.distinct(Report.station_id)))
    )

    all_stations = await session.execute(
        select(Station).options(selectinload(Station.reports))
    )
    available = partial = none = 0
    for s in all_stations.scalars():
        status, _ = await compute_station_status(session, s.reports)
        if status == "available":
            available += 1
        elif status == "partial":
            partial += 1
        elif status == "none":
            none += 1

    total_users = await session.scalar(
        select(func.count(func.distinct(Report.user_id)))
    )

    return StatsResponse(
        total_stations=total or 0,
        reported_stations=reported or 0,
        fuel_available=available,
        fuel_partial=partial,
        fuel_none=none,
        total_users=total_users or 0,
    )


@app.get("/api/user/stats", response_model=UserStatsResponse)
async def get_user_stats(user_id: str = Query(...), session=Depends(get_session)):
    cnt = await session.scalar(
        select(func.count(Report.id)).where(Report.user_id == user_id)
    )
    return UserStatsResponse(
        user_id=user_id,
        reports_count=cnt or 0,
        weight=compute_weight(cnt or 0),
    )
