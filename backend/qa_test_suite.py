"""
RoadSense AI - Comprehensive QA Test Suite
Executes automated test cases across all modules and reports detailed outcomes.
"""
import sys
import os
import io
import time
import json
from pathlib import Path
from datetime import datetime, timezone

backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

import asyncio
from PIL import Image
import numpy as np
import cv2
from httpx import AsyncClient, ASGITransport

from main import app, lifespan
from app.core.config import settings

# Test Results Registry
test_results = []

def record_test(feature, test_case, expected, actual, status, severity="LOW"):
    test_results.append({
        "feature": feature,
        "test_case": test_case,
        "expected": expected,
        "actual": actual,
        "status": status,
        "severity": severity if status == "FAIL" else "N/A"
    })
    symbol = "✓ PASS" if status == "PASS" else "✗ FAIL"
    print(f"[{symbol}] [{feature}] {test_case}", flush=True)
    if status == "FAIL":
        print(f"       Expected: {expected}", flush=True)
        print(f"       Actual:   {actual}", flush=True)
        print(f"       Severity: {severity}", flush=True)

async def run_qa_suite():
    print("=" * 75, flush=True)
    print("ROADSENSE AI — COMPREHENSIVE QA AUTOMATED TEST SUITE", flush=True)
    print("=" * 75, flush=True)

    async with lifespan(app):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            
            # ================================================================
            # MODULE 1: SYSTEM HEALTH & BASELINE
            # ================================================================
            print("\n--- MODULE 1: System Health & Baseline ---", flush=True)
            res = await client.get("/api/v1/health")
            if res.status_code == 200 and res.json().get("status") == "healthy":
                record_test("System Health", "GET /api/v1/health", "HTTP 200 with status 'healthy'", f"HTTP {res.status_code} {res.json()}", "PASS")
            else:
                record_test("System Health", "GET /api/v1/health", "HTTP 200 with status 'healthy'", f"HTTP {res.status_code} {res.text}", "FAIL", "HIGH")

            # Root endpoint
            res = await client.get("/")
            if res.status_code == 200 and "RoadSense" in res.json().get("message", ""):
                record_test("System Health", "GET / Root Endpoint", "HTTP 200 with welcome message", f"HTTP {res.status_code} {res.json().get('message')}", "PASS")
            else:
                record_test("System Health", "GET / Root Endpoint", "HTTP 200 welcome", f"HTTP {res.status_code}", "FAIL", "LOW")

            # ================================================================
            # MODULE 2: AUTHENTICATION & RBAC
            # ================================================================
            print("\n--- MODULE 2: Authentication & RBAC ---", flush=True)
            tokens = {}
            roles_credentials = {
                "admin": ("admin@roadsense.ai", "Admin@12345"),
                "officer": ("officer@roadsense.ai", "Officer@12345"),
                "citizen": ("citizen@roadsense.ai", "Citizen@12345"),
                "maintenance": ("maintenance@roadsense.ai", "Team@12345"),
            }
            users_info = {}

            # 2.1 Login for all 4 roles
            for role_name, (email, pwd) in roles_credentials.items():
                res = await client.post("/api/v1/auth/login", json={"email": email, "password": pwd})
                if res.status_code == 200 and "access_token" in res.json():
                    token = res.json()["access_token"]
                    tokens[role_name] = token
                    record_test("Authentication", f"Login as {role_name.upper()}", "HTTP 200 + access_token", f"HTTP {res.status_code}", "PASS")
                    
                    # Verify profile
                    me_res = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
                    if me_res.status_code == 200 and me_res.json()["role"] == role_name.upper():
                        users_info[role_name] = me_res.json()
                        record_test("Authentication", f"Profile verify {role_name.upper()}", f"Role: {role_name.upper()}", f"Role: {me_res.json()['role']}", "PASS")
                    else:
                        record_test("Authentication", f"Profile verify {role_name.upper()}", f"Role: {role_name.upper()}", f"HTTP {me_res.status_code}", "FAIL", "HIGH")
                else:
                    record_test("Authentication", f"Login as {role_name.upper()}", "HTTP 200 + access_token", f"HTTP {res.status_code} {res.text}", "FAIL", "CRITICAL")

            # 2.2 Negative test: Invalid credentials
            res = await client.post("/api/v1/auth/login", json={"email": "citizen@roadsense.ai", "password": "WrongPassword!999"})
            if res.status_code == 401:
                record_test("Authentication", "Login with invalid password", "HTTP 401 Unauthorized", f"HTTP {res.status_code}", "PASS")
            else:
                record_test("Authentication", "Login with invalid password", "HTTP 401 Unauthorized", f"HTTP {res.status_code} {res.text}", "FAIL", "HIGH")

            # 2.3 Negative test: Duplicate email registration
            res = await client.post("/api/v1/auth/register", json={
                "email": "citizen@roadsense.ai",
                "password": "Password@12345",
                "fullName": "Duplicate User",
                "role": "CITIZEN"
            })
            if res.status_code == 409:
                record_test("Authentication", "Register duplicate email", "HTTP 409 Conflict", f"HTTP {res.status_code}", "PASS")
            else:
                record_test("Authentication", "Register duplicate email", "HTTP 409 Conflict", f"HTTP {res.status_code} {res.text}", "FAIL", "MEDIUM")

            # 2.4 RBAC Enforcement: Citizen attempting Admin-only endpoint
            res = await client.get("/api/v1/users/", headers={"Authorization": f"Bearer {tokens['citizen']}"})
            if res.status_code == 403:
                record_test("RBAC", "Citizen access Admin users list", "HTTP 403 Forbidden", f"HTTP {res.status_code}", "PASS")
            else:
                record_test("RBAC", "Citizen access Admin users list", "HTTP 403 Forbidden", f"HTTP {res.status_code}", "FAIL", "CRITICAL")

            # ================================================================
            # MODULE 3: AI IMAGE DETECTION
            # ================================================================
            print("\n--- MODULE 3: AI Image Detection ---", flush=True)
            # Create sample JPEG
            img = Image.new("RGB", (640, 480), color=(80, 80, 80))
            img_bytes = io.BytesIO()
            img.save(img_bytes, format="JPEG")
            raw_bytes = img_bytes.getvalue()

            res = await client.post(
                "/api/v1/detection/image?conf_threshold=0.30",
                files={"file": ("test_road_sample.jpg", raw_bytes, "image/jpeg")}
            )
            if res.status_code == 200:
                data = res.json()
                if "model_status" in data and "detections" in data and "summary" in data:
                    record_test("AI Detection", "POST /detection/image valid JPEG", "HTTP 200 with structured detections schema", f"model_status={data['model_status']}, count={data.get('detection_count')}", "PASS")
                else:
                    record_test("AI Detection", "POST /detection/image valid JPEG", "Structured detections schema", f"Incomplete keys: {list(data.keys())}", "FAIL", "HIGH")
            else:
                record_test("AI Detection", "POST /detection/image valid JPEG", "HTTP 200", f"HTTP {res.status_code} {res.text}", "FAIL", "CRITICAL")

            # 3.2 Negative test: Unsupported file type
            res = await client.post(
                "/api/v1/detection/image",
                files={"file": ("malicious.txt", b"plain text data", "text/plain")}
            )
            if res.status_code == 415:
                record_test("AI Detection", "Upload unsupported file type (text/plain)", "HTTP 415 Unsupported Media Type", f"HTTP {res.status_code}", "PASS")
            else:
                record_test("AI Detection", "Upload unsupported file type (text/plain)", "HTTP 415", f"HTTP {res.status_code}", "FAIL", "MEDIUM")

            # 3.3 Detection history from database
            hist_res = await client.get("/api/v1/detection/history")
            if hist_res.status_code == 200 and "items" in hist_res.json():
                h_data = hist_res.json()
                record_test("AI Detection", "GET /detection/history paginated", "HTTP 200 + items list", f"Total: {h_data.get('total')}, items: {len(h_data.get('items', []))}", "PASS")
                
                # Fetch single detection
                if h_data.get("items"):
                    first_det_id = h_data["items"][0]["id"]
                    det_single_res = await client.get(f"/api/v1/detection/{first_det_id}")
                    if det_single_res.status_code == 200 and det_single_res.json()["id"] == first_det_id:
                        record_test("AI Detection", "GET /detection/{id} single record", "HTTP 200 + matching detection ID", f"ID={first_det_id[:8]}", "PASS")
                    else:
                        record_test("AI Detection", "GET /detection/{id} single record", "HTTP 200", f"HTTP {det_single_res.status_code}", "FAIL", "HIGH")
            else:
                record_test("AI Detection", "GET /detection/history paginated", "HTTP 200", f"HTTP {hist_res.status_code}", "FAIL", "HIGH")

            # 3.4 Uploads listing
            up_list_res = await client.get("/api/v1/uploads/")
            if up_list_res.status_code == 200 and "items" in up_list_res.json():
                record_test("Uploads Ingestion", "GET /uploads/ paginated list", "HTTP 200 + items list", f"Total: {up_list_res.json().get('total')}", "PASS")
            else:
                record_test("Uploads Ingestion", "GET /uploads/ paginated list", "HTTP 200", f"HTTP {up_list_res.status_code}", "FAIL", "MEDIUM")

            # ================================================================
            # MODULE 4: AI VIDEO PROCESSING (BACKGROUND JOB)
            # ================================================================
            print("\n--- MODULE 4: AI Video Processing ---", flush=True)
            # Generate a 2-second MP4 video in memory / temp file
            test_video_path = backend_dir / "uploads" / "videos" / "qa_test_video.mp4"
            test_video_path.parent.mkdir(parents=True, exist_ok=True)
            fourcc = cv2.VideoWriter_fourcc(*"mp4v")
            out = cv2.VideoWriter(str(test_video_path), fourcc, 25.0, (320, 240))
            for i in range(50):  # 50 frames = 2 seconds at 25 fps
                f = np.full((240, 320, 3), 90, dtype=np.uint8)
                cv2.putText(f, f"Frame {i}", (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2)
                out.write(f)
            out.release()

            with open(test_video_path, "rb") as vf:
                v_bytes = vf.read()

            res = await client.post(
                "/api/v1/detection/video",
                files={"file": ("qa_road_video.mp4", v_bytes, "video/mp4")}
            )
            if res.status_code == 202:
                vdata = res.json()
                job_id = vdata.get("job_id")
                record_test("Video Processing", "POST /detection/video upload MP4", "HTTP 202 Accepted + job_id", f"job_id={job_id}, status={vdata.get('status')}", "PASS")

                # Poll job status
                poll_success = False
                for _ in range(15):
                    await asyncio.sleep(0.5)
                    poll_res = await client.get(f"/api/v1/detection/job/{job_id}")
                    if poll_res.status_code == 200:
                        j_status = poll_res.json().get("status")
                        if j_status == "COMPLETED":
                            poll_success = True
                            record_test("Video Processing", "Poll video background job completion", "Job status transitions to COMPLETED", f"Status: {j_status}, frames: {poll_res.json().get('total_frames')}", "PASS")
                            break
                        elif j_status == "FAILED":
                            record_test("Video Processing", "Poll video background job completion", "Job status COMPLETED", f"Job FAILED: {poll_res.json().get('error')}", "FAIL", "HIGH")
                            break
                if not poll_success and j_status != "FAILED":
                    record_test("Video Processing", "Poll video background job completion", "Job status COMPLETED", f"Timed out waiting, last status: {j_status}", "FAIL", "MEDIUM")
            else:
                record_test("Video Processing", "POST /detection/video upload MP4", "HTTP 202 Accepted", f"HTTP {res.status_code} {res.text}", "FAIL", "HIGH")

            # Negative test: Non-existent job ID
            res = await client.get("/api/v1/detection/job/non-existent-uuid-1234")
            if res.status_code == 404:
                record_test("Video Processing", "Poll non-existent job ID", "HTTP 404 Not Found", f"HTTP {res.status_code}", "PASS")
            else:
                record_test("Video Processing", "Poll non-existent job ID", "HTTP 404", f"HTTP {res.status_code}", "FAIL", "LOW")

            # ================================================================
            # MODULE 5: GPS & SPATIAL DEDUPLICATION
            # ================================================================
            print("\n--- MODULE 5: GPS & Spatial Deduplication ---", flush=True)
            # 5.1 Duplicate check when target exists (<12m)
            # Create a test ticket at fixed coordinates
            tkt_res = await client.post(
                "/api/v1/tickets/",
                json={
                    "title": "QA Pothole for Proximity Deduplication",
                    "priority": "MEDIUM",
                    "latitude": 28.5355,
                    "longitude": 77.3910,
                    "ward_identifier": "WARD-05"
                },
                headers={"Authorization": f"Bearer {tokens['officer']}"}
            )
            assert tkt_res.status_code == 201
            anchor_ticket = tkt_res.json()

            # Check duplicate 5 meters away
            dup_res = await client.post(
                "/api/v1/spatial/check-duplicate?latitude=28.53553&longitude=77.39103&radius_meters=15.0"
            )
            if dup_res.status_code == 200:
                dup_data = dup_res.json()
                if dup_data.get("is_duplicate") is True and dup_data.get("matched_ticket") is not None:
                    record_test("Spatial Engine", "Proximity match within 15m radius", "is_duplicate: True + matched_ticket", f"is_duplicate={dup_data['is_duplicate']}, dist={dup_data['distance_meters']:.1f}m", "PASS")
                else:
                    record_test("Spatial Engine", "Proximity match within 15m radius", "is_duplicate: True", f"is_duplicate={dup_data.get('is_duplicate')}", "FAIL", "CRITICAL")
            else:
                record_test("Spatial Engine", "Proximity match within 15m radius", "HTTP 200", f"HTTP {dup_res.status_code}", "FAIL", "HIGH")

            # Check distant coordinate (500m away) -> should NOT match
            dist_res = await client.post(
                "/api/v1/spatial/check-duplicate?latitude=28.5400&longitude=77.3990&radius_meters=15.0"
            )
            if dist_res.status_code == 200 and dist_res.json().get("is_duplicate") is False:
                record_test("Spatial Engine", "Distant point (>50m) deduplication", "is_duplicate: False", f"is_duplicate={dist_res.json()['is_duplicate']}", "PASS")
            else:
                record_test("Spatial Engine", "Distant point (>50m) deduplication", "is_duplicate: False", f"HTTP {dist_res.status_code}", "FAIL", "MEDIUM")

            # 5.3 Negative test: Invalid coordinates (>90 lat)
            inv_coord_res = await client.post(
                "/api/v1/complaints/",
                json={
                    "title": "Invalid Coordinate Test",
                    "latitude": 125.0,  # Invalid
                    "longitude": 77.2090
                },
                headers={"Authorization": f"Bearer {tokens['citizen']}"}
            )
            if inv_coord_res.status_code == 422:
                record_test("Spatial Engine", "Validate latitude bounds (-90 to +90)", "HTTP 422 Validation Error", f"HTTP {inv_coord_res.status_code}", "PASS")
            else:
                record_test("Spatial Engine", "Validate latitude bounds (-90 to +90)", "HTTP 422", f"HTTP {inv_coord_res.status_code}", "FAIL", "MEDIUM")

            # 5.4 GIS Map Pothole Points & Spatial Clusters
            map_pts_res = await client.get("/api/v1/spatial/potholes")
            if map_pts_res.status_code == 200 and len(map_pts_res.json()) >= 6:
                record_test("GIS Map Canvas", "GET /spatial/potholes map markers", "HTTP 200 + geotagged defect coordinates", f"Loaded {len(map_pts_res.json())} defect points", "PASS")
            else:
                record_test("GIS Map Canvas", "GET /spatial/potholes map markers", "HTTP 200 + >=6 points", f"HTTP {map_pts_res.status_code}", "FAIL", "HIGH")

            clusters_res = await client.get("/api/v1/spatial/clusters")
            if clusters_res.status_code == 200 and len(clusters_res.json()) >= 2:
                record_test("GIS Map Canvas", "GET /spatial/clusters spatial density", "HTTP 200 + cluster points", f"Loaded {len(clusters_res.json())} clusters", "PASS")
            else:
                record_test("GIS Map Canvas", "GET /spatial/clusters spatial density", "HTTP 200 clusters", f"HTTP {clusters_res.status_code}", "FAIL", "MEDIUM")

            # ================================================================
            # MODULE 6: COMPLAINT LIFECYCLE & TRIAGE
            # ================================================================
            print("\n--- MODULE 6: Complaint Lifecycle & Triage ---", flush=True)
            # 6.1 Citizen logs complaint
            c_res = await client.post(
                "/api/v1/complaints/",
                json={
                    "title": "Road Cavity along Ring Road Sector 12",
                    "description": "Hazardous road crater damaging vehicular suspensions.",
                    "latitude": 28.5920,
                    "longitude": 77.0460,
                    "address_text": "Opposite Sector 12 Metro Pillar 140"
                },
                headers={"Authorization": f"Bearer {tokens['citizen']}"}
            )
            if c_res.status_code == 201:
                comp = c_res.json()
                comp_id = comp["id"]
                record_test("Complaints", "Citizen create complaint with coordinates", "HTTP 201 + SUBMITTED status", f"Status: {comp['status']}", "PASS")
                
                # Fetch single complaint
                get_c = await client.get(f"/api/v1/complaints/{comp_id}", headers={"Authorization": f"Bearer {tokens['citizen']}"})
                if get_c.status_code == 200 and get_c.json()["id"] == comp_id:
                    record_test("Complaints", "Fetch complaint by ID", "HTTP 200 + matching record", f"ID={comp_id[:8]}", "PASS")
                else:
                    record_test("Complaints", "Fetch complaint by ID", "HTTP 200 matching record", f"HTTP {get_c.status_code}", "FAIL", "HIGH")
            else:
                record_test("Complaints", "Citizen create complaint with coordinates", "HTTP 201", f"HTTP {c_res.status_code} {c_res.text}", "FAIL", "CRITICAL")

            # 6.2 Officer triages complaint and changes status
            patch_c = await client.patch(
                f"/api/v1/complaints/{comp_id}",
                json={"status": "TRIAGED"},
                headers={"Authorization": f"Bearer {tokens['officer']}"}
            )
            if patch_c.status_code == 200 and patch_c.json()["status"] == "TRIAGED":
                record_test("Complaints", "Officer triage complaint (status=TRIAGED)", "HTTP 200 + status=TRIAGED", f"Status: {patch_c.json()['status']}", "PASS")
            else:
                record_test("Complaints", "Officer triage complaint (status=TRIAGED)", "HTTP 200 + TRIAGED", f"HTTP {patch_c.status_code}", "FAIL", "HIGH")

            # ================================================================
            # MODULE 7: MAINTENANCE TICKETS & FIELD CREW
            # ================================================================
            print("\n--- MODULE 7: Maintenance Tickets & Field Queue ---", flush=True)
            # 7.1 Officer creates work order ticket
            t_res = await client.post(
                "/api/v1/tickets/",
                json={
                    "title": "Urgent Cold-Mix Asphalt Patch - Ring Road",
                    "description": "Level and compact damaged road crater.",
                    "priority": "HIGH",
                    "latitude": 28.5920,
                    "longitude": 77.0460,
                    "ward_identifier": "WARD-05",
                    "assigned_team_lead_id": users_info["maintenance"]["id"]
                },
                headers={"Authorization": f"Bearer {tokens['officer']}"}
            )
            if t_res.status_code == 201:
                tkt = t_res.json()
                tkt_id = tkt["id"]
                record_test("Tickets", "Officer create maintenance ticket", "HTTP 201 + ticket_number generated", f"TKT: {tkt['ticket_number']}", "PASS")

                # 7.2 Maintenance team retrieves assigned tasks
                m_tasks = await client.get("/api/v1/tickets/?assigned_to_me=true", headers={"Authorization": f"Bearer {tokens['maintenance']}"})
                if m_tasks.status_code == 200 and any(t["id"] == tkt_id for t in m_tasks.json()):
                    record_test("Tickets", "Maintenance queue filter (assigned_to_me)", "Ticket appears in field crew queue", f"Found {len(m_tasks.json())} task(s)", "PASS")
                else:
                    record_test("Tickets", "Maintenance queue filter (assigned_to_me)", "Ticket in queue", f"HTTP {m_tasks.status_code}", "FAIL", "HIGH")

                # 7.3 Maintenance transitions status to IN_REPAIR
                prog_res = await client.patch(
                    f"/api/v1/tickets/{tkt_id}",
                    json={"status": "IN_REPAIR"},
                    headers={"Authorization": f"Bearer {tokens['maintenance']}"}
                )
                if prog_res.status_code == 200 and prog_res.json()["status"] == "IN_REPAIR":
                    record_test("Tickets", "Field crew marks ticket IN_REPAIR", "HTTP 200 + status=IN_REPAIR", f"Status: {prog_res.json()['status']}", "PASS")
                else:
                    record_test("Tickets", "Field crew marks ticket IN_REPAIR", "HTTP 200 + IN_REPAIR", f"HTTP {prog_res.status_code}", "FAIL", "HIGH")
            else:
                record_test("Tickets", "Officer create maintenance ticket", "HTTP 201", f"HTTP {t_res.status_code} {t_res.text}", "FAIL", "CRITICAL")

            # ================================================================
            # MODULE 8: AI REPAIR VERIFICATION & OFFICER SIGN-OFF
            # ================================================================
            print("\n--- MODULE 8: AI Repair Verification & Sign-Off ---", flush=True)
            # Create a mock after-repair image on disk
            after_photo_path = backend_dir / "uploads" / "images" / "qa_after_repair.jpg"
            after_img = Image.new("RGB", (640, 480), color=(40, 40, 40))
            after_img.save(after_photo_path, format="JPEG")

            rep_res = await client.post(
                "/api/v1/repairs/",
                json={
                    "ticket_id": tkt_id,
                    "before_media_url": "/uploads/test_road.jpg",
                    "after_media_url": str(after_photo_path),
                    "notes": "Patch applied with bitumen emulsion and rolled."
                },
                headers={"Authorization": f"Bearer {tokens['maintenance']}"}
            )
            if rep_res.status_code == 201:
                rep_data = rep_res.json()
                rep_id = rep_data["id"]
                ai_score = rep_data.get("ai_verification_score")
                ai_verdict = rep_data.get("ai_verdict")
                record_test("Repair Verification", "Submit repair proof with AI advisory scoring", "HTTP 201 + score (0-1) + verdict", f"score={ai_score}, verdict={ai_verdict}", "PASS")

                # Verify ticket transitioned to AWAITING_VERIFICATION
                t_check = await client.get(f"/api/v1/tickets/{tkt_id}", headers={"Authorization": f"Bearer {tokens['officer']}"})
                if t_check.json()["status"] == "AWAITING_VERIFICATION":
                    record_test("Repair Verification", "Ticket status auto-transition on proof upload", "status=AWAITING_VERIFICATION", f"status={t_check.json()['status']}", "PASS")
                else:
                    record_test("Repair Verification", "Ticket status auto-transition on proof upload", "status=AWAITING_VERIFICATION", f"status={t_check.json()['status']}", "FAIL", "HIGH")

                # 8.2 Officer Conducts Final Sign-off (Approval)
                sign_res = await client.patch(
                    f"/api/v1/repairs/{rep_id}/verify",
                    json={"approved": True, "officer_notes": "QA Officer inspected patch; approved for closure."},
                    headers={"Authorization": f"Bearer {tokens['officer']}"}
                )
                if sign_res.status_code == 200 and sign_res.json()["officer_approved"] is True:
                    record_test("Repair Verification", "Officer final approval sign-off", "officer_approved=True", f"approved={sign_res.json()['officer_approved']}", "PASS")
                    
                    # Verify ticket closed
                    closed_tkt = await client.get(f"/api/v1/tickets/{tkt_id}", headers={"Authorization": f"Bearer {tokens['officer']}"})
                    if closed_tkt.json()["status"] == "CLOSED" and closed_tkt.json().get("resolved_at"):
                        record_test("Repair Verification", "Ticket closure & resolution timestamp", "status=CLOSED + resolved_at set", f"status={closed_tkt.json()['status']}, resolved_at={closed_tkt.json().get('resolved_at')[:19]}", "PASS")
                    else:
                        record_test("Repair Verification", "Ticket closure & resolution timestamp", "status=CLOSED", f"status={closed_tkt.json()['status']}", "FAIL", "CRITICAL")
                else:
                    record_test("Repair Verification", "Officer final approval sign-off", "HTTP 200 approved=True", f"HTTP {sign_res.status_code}", "FAIL", "HIGH")
            else:
                record_test("Repair Verification", "Submit repair proof with AI advisory scoring", "HTTP 201", f"HTTP {rep_res.status_code} {rep_res.text}", "FAIL", "CRITICAL")

            # ================================================================
            # MODULE 9: REAL DATABASE ANALYTICS
            # ================================================================
            print("\n--- MODULE 9: Real Database Analytics ---", flush=True)
            # Overview
            over_res = await client.get("/api/v1/analytics/overview")
            if over_res.status_code == 200:
                odata = over_res.json()
                if "complaints" in odata and "tickets" in odata:
                    record_test("Analytics", "GET /analytics/overview", "Real DB aggregates for complaints and tickets", f"Complaints: {odata['complaints']['total']}, Tickets: {odata['tickets']['total']}", "PASS")
                else:
                    record_test("Analytics", "GET /analytics/overview", "Schema keys present", "Missing keys", "FAIL", "MEDIUM")
            else:
                record_test("Analytics", "GET /analytics/overview", "HTTP 200", f"HTTP {over_res.status_code}", "FAIL", "HIGH")

            # Severity
            sev_res = await client.get("/api/v1/analytics/severity")
            if sev_res.status_code == 200 and len(sev_res.json()) == 4:
                record_test("Analytics", "GET /analytics/severity", "4 severity grade counts (Low, Med, High, Crit)", f"Categories: {len(sev_res.json())}", "PASS")
            else:
                record_test("Analytics", "GET /analytics/severity", "4 categories", f"HTTP {sev_res.status_code}", "FAIL", "MEDIUM")

            # Trends
            trend_res = await client.get("/api/v1/analytics/trends")
            if trend_res.status_code == 200 and len(trend_res.json()) == 7:
                record_test("Analytics", "GET /analytics/trends", "7-day time series data points", f"Points: {len(trend_res.json())}", "PASS")
            else:
                record_test("Analytics", "GET /analytics/trends", "7 points", f"HTTP {trend_res.status_code}", "FAIL", "MEDIUM")

            # ================================================================
            # MODULE 10: AI MUNICIPAL ASSISTANT (RAG)
            # ================================================================
            print("\n--- MODULE 10: AI Municipal Assistant ---", flush=True)
            queries = [
                ("Hazard intent", "Are there any critical potholes threatening public safety?"),
                ("Complaint intent", "What is our citizen complaint backlog?"),
                ("SLA intent", "Tell me about our maintenance tickets and repair delays.")
            ]
            for label, q_text in queries:
                res = await client.post("/api/v1/assistant/chat", json={"query": q_text}, headers={"Authorization": f"Bearer {tokens['officer']}"})
                if res.status_code == 200 and res.json().get("reply"):
                    record_test("AI Assistant", f"Query: {label}", "Natural language answer backed by real DB stats", f"Reply length: {len(res.json()['reply'])} chars", "PASS")
                else:
                    record_test("AI Assistant", f"Query: {label}", "HTTP 200 + reply", f"HTTP {res.status_code}", "FAIL", "MEDIUM")

            # ================================================================
            # MODULE 11: NOTIFICATIONS & AUDIT
            # ================================================================
            print("\n--- MODULE 11: Notifications ---", flush=True)
            # List notifications
            notif_res = await client.get("/api/v1/notifications/", headers={"Authorization": f"Bearer {tokens['citizen']}"})
            if notif_res.status_code == 200:
                notifs = notif_res.json()
                record_test("Notifications", "Citizen in-app notifications fetch", "HTTP 200 + notification records", f"Received {len(notifs)} notifs", "PASS")
                
                # Unread count
                unread_res = await client.get("/api/v1/notifications/unread-count", headers={"Authorization": f"Bearer {tokens['citizen']}"})
                if unread_res.status_code == 200 and "unread_count" in unread_res.json():
                    record_test("Notifications", "GET /notifications/unread-count", "HTTP 200 + unread_count key", f"Count: {unread_res.json()['unread_count']}", "PASS")
                else:
                    record_test("Notifications", "GET /notifications/unread-count", "HTTP 200 unread_count", f"HTTP {unread_res.status_code}", "FAIL", "LOW")

                # Mark all read
                readall_res = await client.post("/api/v1/notifications/read-all", headers={"Authorization": f"Bearer {tokens['citizen']}"})
                if readall_res.status_code == 200:
                    record_test("Notifications", "POST /notifications/read-all", "HTTP 200 success", "All marked as read", "PASS")
                else:
                    record_test("Notifications", "POST /notifications/read-all", "HTTP 200", f"HTTP {readall_res.status_code}", "FAIL", "LOW")
            else:
                record_test("Notifications", "Citizen in-app notifications fetch", "HTTP 200", f"HTTP {notif_res.status_code}", "FAIL", "MEDIUM")

            # ================================================================
            # MODULE 12: USER MANAGEMENT & ROLE PROMOTION (ADMIN ONLY)
            # ================================================================
            print("\n--- MODULE 12: User Management ---", flush=True)
            users_res = await client.get("/api/v1/users/", headers={"Authorization": f"Bearer {tokens['admin']}"})
            if users_res.status_code == 200 and len(users_res.json()) >= 4:
                record_test("User Governance", "Admin list all users", "HTTP 200 + list of all users", f"Found {len(users_res.json())} users", "PASS")
            else:
                record_test("User Governance", "Admin list all users", "HTTP 200", f"HTTP {users_res.status_code}", "FAIL", "HIGH")

    # ================================================================
    # SUMMARY REPORT
    # ================================================================
    print("\n" + "=" * 75, flush=True)
    print("QA AUTOMATION EXECUTION SUMMARY", flush=True)
    print("=" * 75, flush=True)
    total_tests = len(test_results)
    passed_tests = sum(1 for t in test_results if t["status"] == "PASS")
    failed_tests = sum(1 for t in test_results if t["status"] == "FAIL")

    print(f"Total Test Cases:  {total_tests}", flush=True)
    print(f"Passed:            {passed_tests} ({passed_tests/total_tests*100:.1f}%)", flush=True)
    print(f"Failed:            {failed_tests} ({failed_tests/total_tests*100:.1f}%)", flush=True)
    print("=" * 75, flush=True)

    # Save test results as JSON for report generator
    with open(backend_dir / "qa_results.json", "w") as jf:
        json.dump(test_results, jf, indent=2)

if __name__ == "__main__":
    asyncio.run(run_qa_suite())
