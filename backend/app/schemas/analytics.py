from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class StatusCount(BaseModel):
    status: str
    count: int


class SeverityDistribution(BaseModel):
    severity: str
    count: int


class MonthlyTrend(BaseModel):
    month: str  # e.g. "2024-01"
    complaints: int
    detections: int


class WardStat(BaseModel):
    ward_identifier: str
    total_complaints: int
    open_tickets: int
    resolved_tickets: int


class TeamPerformance(BaseModel):
    team_lead_id: str
    team_lead_name: Optional[str]
    total_repairs: int
    approved_repairs: int
    avg_resolution_days: Optional[float]


class AnalyticsOverview(BaseModel):
    total_complaints: int
    complaints_by_status: List[StatusCount]
    total_tickets: int
    tickets_by_status: List[StatusCount]
    total_repairs: int
    approved_repairs: int
    total_potholes_detected: int
