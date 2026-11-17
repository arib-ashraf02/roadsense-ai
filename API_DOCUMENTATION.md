# RoadSense AI — REST API Documentation

Base URL: `http://127.0.0.1:8000/api/v1`

---

## 1. Authentication (`/auth`)
* `POST /auth/register` — Register citizen or maintenance user account.
* `POST /auth/login` — Authenticate credentials, returns `{ access_token, refresh_token, token_type }`.
* `POST /auth/refresh` — Refresh expired access token.
* `GET /auth/me` — Retrieve active user session profile.

## 2. AI Vision & Detection (`/detection`)
* `POST /detection/image` — Upload road image, executes YOLO inference, returns bounding boxes, area ratios, and severity grade.
* `POST /detection/video` — Upload road video, runs background frame decimation (1 frame per 1.5s).
* `GET /detection/job/{job_id}` — Poll status and progress of asynchronous video inference jobs.
* `GET /detection/history` — Paginated detection history for current user.
* `GET /detection/{detection_id}` — Detailed telemetry for single detection.

## 3. Uploads & Media (`/uploads`)
* `POST /uploads/` — Upload raw media file, extracts EXIF GPS, and triggers AI inference.
* `GET /uploads/` — List user uploads.
* `GET /uploads/{upload_id}` — Single upload metadata.

## 4. Citizen Complaints (`/complaints`)
* `POST /complaints/` — Submit road grievance with coordinates and media URLs. Performs spatial duplicate check.
* `GET /complaints/` — List complaints (filtered by status, citizen ownership, ward).
* `GET /complaints/{complaint_id}` — Retrieve single complaint record.
* `PATCH /complaints/{complaint_id}` — Triage complaint, update status, link to work order ticket.

## 5. Maintenance Tickets (`/tickets`)
* `POST /tickets/` — Officer creates official maintenance work order.
* `GET /tickets/` — List work orders (filtered by status, priority, assigned team lead, ward).
* `GET /tickets/{ticket_id}` — Single ticket work order details.
* `PATCH /tickets/{ticket_id}` — Update priority, status (`IN_REPAIR`, `CLOSED`), team lead, or SLA deadline.

## 6. Repair Verification (`/repairs`)
* `POST /repairs/` — Maintenance crew submits after-repair photo evidence. Runs AI advisory analysis.
* `PATCH /repairs/{repair_id}/verify` — Officer conducts final sign-off: approves or rejects repair.

## 7. Spatial & GIS (`/spatial`)
* `GET /spatial/potholes` — Retrieve geotagged detections for map rendering (supports bounding box queries).
* `GET /spatial/clusters` — Retrieve spatial cluster centroids for heatmaps.
* `POST /spatial/check-duplicate` — Check if coordinates fall within 12m of existing defect.

## 8. Analytics & Telemetry (`/analytics`)
* `GET /analytics/overview` — Platform summary (total potholes, complaint resolution rate, open tickets).
* `GET /analytics/severity` — Distribution by physical severity (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
* `GET /analytics/trends` — 7-day time-series of detections vs complaints vs resolved tickets.
* `GET /analytics/wards` — Ward-wise risk scoring and defect backlog distribution.

## 9. Notifications (`/notifications`)
* `GET /notifications/` — User notifications list (unread first).
* `GET /notifications/unread-count` — Count of unread alerts.
* `PATCH /notifications/{notification_id}/read` — Mark single notification read.
* `POST /notifications/read-all` — Mark all read.

## 10. AI Municipal Assistant (`/assistant`)
* `POST /assistant/chat` — Natural language query interface backed by live database aggregates.

## 11. User Management (`/users`)
* `GET /users/` — Admin list of accounts.
* `GET /users/{user_id}` — Account profile.
* `PATCH /users/{user_id}/role` — Admin role assignment (`CITIZEN`, `MAINTENANCE`, `OFFICER`, `ADMIN`).
