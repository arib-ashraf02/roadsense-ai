# RoadSense AI — System Architecture Specification

## 1. High-Level Architecture Overview

```
                      +------------------------------------------+
                      |         Web Client / Smartphone         |
                      |    Next.js 15 App Router (JavaScript)    |
                      +------------------------------------------+
                                           |
                                  REST API / Multipart
                                           v
+-----------------------------------------------------------------------------------+
|                            FastAPI Microservice (Python 3.12)                     |
|                                                                                   |
|  +--------------------+   +-----------------------+   +------------------------+  |
|  | Authentication     |   | AI Vision Pipeline    |   | Spatial Deduplication  |  |
|  | - JWT (HS256)      |   | - YOLO (PyTorch/CV)   |   | - 12m Haversine Radius |  |
|  | - Role-Based Guard |   | - Severity Heuristics |   | - PostGIS ST_DWithin   |  |
|  | - Passlib / Bcrypt |   | - Video Decimation    |   | - Cluster Centroid Sync|  |
|  +--------------------+   +-----------------------+   +------------------------+  |
|                                                                                   |
|  +--------------------+   +-----------------------+   +------------------------+  |
|  | Maintenance Engine |   | Repair Verification   |   | Municipal Assistant    |  |
|  | - Triage Workflow  |   | - AI Advisory Scorer  |   | - Natural Language RAG |  |
|  | - SLA Deadline     |   | - Officer Sign-Off    |   | - Telemetry Aggregator |  |
|  +--------------------+   +-----------------------+   +------------------------+  |
+-----------------------------------------------------------------------------------+
                                           |
                        SQLAlchemy 2.0 (Asyncpg / SQLite)
                                           v
+-----------------------------------------------------------------------------------+
|                       Database Layer: PostgreSQL + PostGIS                        |
|                                                                                   |
|  [users]              [complaints]        [tickets]           [spatial_clusters]  |
|  [complaint_media]    [repairs]           [notifications]     [road_segments]     |
|  [uploads]            [pothole_detections][audit_logs]                            |
+-----------------------------------------------------------------------------------+
```

---

## 2. Service Interactions & Protocols

### A. Media Ingestion & Defect Detection
1. Citizen or inspector captures photograph/video.
2. Client-side EXIF parser (`exif-js`) extracts hardware GPS coordinates (with HTML5 geolocation fallback).
3. Payload uploaded to `POST /api/v1/detection/image`.
4. YOLO runs inference, returns bounding boxes, area ratio, and severity classification (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
5. Annotated image overlay generated and stored under `/uploads/annotated/`.

### B. Spatial Deduplication Flow
1. Defect coordinate matched against active maintenance tickets using `find_duplicate_ticket()`.
2. If an active ticket is within **12 meters**, the new report is merged as corroborating citizen evidence and priority is boosted.
3. If no active defect exists within 12m, a new ticket or candidate grievance is initialized.

### C. Maintenance & Repair Verification Flow
1. Municipal Officer reviews grievance in `/officer/complaints` and approves into work order ticket.
2. Maintenance Team lead receives push notification and navigates via GPS.
3. Field worker performs hot-mix asphalt patching and submits "After-Repair" photograph via `/maintenance/verify/[id]`.
4. AI verification engine inspects after-photo:
   - Validates zero potholes detected.
   - Computes asphalt texture uniformity and edge density.
   - Yields advisory verdict: `PASSED`, `FAILED`, or `MANUAL_REVIEW_REQUIRED`.
5. Municipal Officer reviews side-by-side comparison and provides one-click final approval to close the ticket.
