# RoadSense AI — Database Schema Specification

RoadSense AI supports PostgreSQL with PostGIS extensions for production GIS, and SQLite (`roadsense.db`) for lightweight local development.

---

## Entity Relationship Overview

```
 [users] 1 -------- * [complaints] 1 -------- * [complaint_media]
    |                      |
    |                      *
    +----------------- * [tickets] 1 -------- * [repairs]
    |                      |
    |                      *
 [uploads] 1 --------- * [pothole_detections] * -------- 1 [spatial_clusters]
    |
 [notifications]
 [audit_logs]
 [road_segments]
```

---

## Table Definitions

### 1. `users`
* `id` (UUID / VARCHAR(36), PK)
* `email` (VARCHAR, Unique, Indexed)
* `passwordHash` (VARCHAR)
* `fullName` (VARCHAR)
* `phone` (VARCHAR, Nullable)
* `role` (ENUM: `ADMIN`, `OFFICER`, `CITIZEN`, `MAINTENANCE`)
* `wardId` (VARCHAR, Nullable)
* `isActive` (BOOLEAN, Default: true)
* `createdAt`, `updatedAt` (TIMESTAMP)

### 2. `complaints`
* `id` (UUID / VARCHAR(36), PK)
* `citizen_id` (FK -> `users.id`)
* `title` (VARCHAR(255))
* `description` (TEXT)
* `latitude`, `longitude` (FLOAT)
* `address_text` (VARCHAR(512))
* `status` (ENUM: `SUBMITTED`, `TRIAGED`, `IN_PROGRESS`, `RESOLVED`, `REJECTED`)
* `ticket_id` (VARCHAR(36), Nullable, Indexed)
* `created_at`, `updated_at` (TIMESTAMP)

### 3. `tickets`
* `id` (UUID / VARCHAR(36), PK)
* `ticket_number` (VARCHAR(64), Unique, Indexed)
* `title` (VARCHAR(255))
* `description` (TEXT)
* `priority` (ENUM: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)
* `status` (ENUM: `OPEN`, `ASSIGNED`, `IN_REPAIR`, `AWAITING_VERIFICATION`, `CLOSED`, `REJECTED`)
* `latitude`, `longitude` (FLOAT)
* `ward_identifier` (VARCHAR(64))
* `assigned_officer_id` (FK -> `users.id`)
* `assigned_team_lead_id` (FK -> `users.id`)
* `sla_deadline` (TIMESTAMP, Nullable)
* `resolved_at` (TIMESTAMP, Nullable)

### 4. `pothole_detections`
* `id` (UUID / VARCHAR(36), PK)
* `upload_id` (FK -> `uploads.id`, Nullable)
* `ticket_id` (VARCHAR(36), Nullable)
* `confidence` (FLOAT)
* `severity` (ENUM: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)
* `estimated_area_sqm` (FLOAT, Nullable)
* `bounding_boxes` (JSON)
* `annotated_image_url` (TEXT, Nullable)
* `raw_image_url` (TEXT, Nullable)
* `latitude`, `longitude` (FLOAT, Nullable)
* `is_duplicate` (BOOLEAN, Default: false)
* `cluster_id` (VARCHAR(36), Nullable)
* `detected_at` (TIMESTAMP)

### 5. `repairs`
* `id` (UUID / VARCHAR(36), PK)
* `ticket_id` (FK -> `tickets.id`)
* `submitted_by_id` (FK -> `users.id`)
* `before_media_url` (TEXT, Nullable)
* `after_media_url` (TEXT)
* `notes` (TEXT)
* `ai_verification_score` (FLOAT, Nullable)
* `ai_verdict` (ENUM: `PASSED`, `FAILED`, `MANUAL_REVIEW_REQUIRED`)
* `officer_approved` (BOOLEAN, Nullable)
* `officer_approved_by_id` (FK -> `users.id`)
* `officer_approved_at` (TIMESTAMP)

### 6. `spatial_clusters`
* `id` (UUID / VARCHAR(36), PK)
* `latitude`, `longitude` (FLOAT)
* `radius_meters` (FLOAT, Default: 10.0)
* `detection_count` (INTEGER, Default: 1)
* `ward_identifier` (VARCHAR(64), Nullable)
* `first_seen_at`, `last_seen_at` (TIMESTAMP)
