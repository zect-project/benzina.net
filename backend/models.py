from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, ForeignKey, func
from sqlalchemy.orm import relationship

from .database import Base


class Station(Base):
    __tablename__ = "stations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    osm_id = Column(String, unique=True, nullable=False)
    brand = Column(String, nullable=True)
    name = Column(String, nullable=True)
    operator = Column(String, nullable=True)
    address = Column(String, nullable=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    fuels_raw = Column(JSON, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    reports = relationship("Report", back_populates="station", cascade="all, delete-orphan")


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, autoincrement=True)
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    user_id = Column(String, nullable=False, index=True)
    fuels = Column(JSON, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    station = relationship("Station", back_populates="reports")
