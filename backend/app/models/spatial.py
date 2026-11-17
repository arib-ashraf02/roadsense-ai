import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime
from app.core.database import Base


class SpatialCluster(Base):
    __tablename__ = "spatial_clusters"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    radius_meters = Column(Float, default=10.0, nullable=False)
    detection_count = Column(Integer, default=1, nullable=False)
    ward_identifier = Column(String(64), nullable=True)
    first_seen_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    last_seen_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class RoadSegment(Base):
    __tablename__ = "road_segments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    road_name = Column(String(255), nullable=False)
    ward_identifier = Column(String(64), nullable=True, index=True)
    start_lat = Column(Float, nullable=False)
    start_lon = Column(Float, nullable=False)
    end_lat = Column(Float, nullable=False)
    end_lon = Column(Float, nullable=False)
    condition_score = Column(Float, default=100.0) # 0 to 100
    pothole_count = Column(Integer, default=0)
    last_surveyed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
