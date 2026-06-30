from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class FuelReport(BaseModel):
    fuel_92: str = "unknown"
    fuel_95: str = "unknown"
    fuel_98: str = "unknown"
    fuel_diesel: str = "unknown"
    user_id: str


class ReportResponse(BaseModel):
    id: int
    station_id: int
    user_id: str
    fuels: dict
    created_at: datetime

    class Config:
        from_attributes = True


class StationResponse(BaseModel):
    id: int
    osm_id: str
    brand: Optional[str]
    name: Optional[str]
    operator: Optional[str]
    address: Optional[str]
    lat: float
    lng: float
    status: Optional[str] = None
    fuel_details: Optional[dict] = None
    report_count: int = 0
    user_weight: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class StationDetailResponse(StationResponse):
    reports: list[ReportResponse] = []


class StatsResponse(BaseModel):
    total_stations: int
    reported_stations: int
    fuel_available: int
    fuel_partial: int
    fuel_none: int
    total_users: int


class UserStatsResponse(BaseModel):
    user_id: str
    reports_count: int
    weight: int
