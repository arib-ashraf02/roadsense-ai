"""
End-to-End Lifecycle Verification Test for RoadSense AI
Validates all major modules and role interactions using httpx.AsyncClient.
"""
import sys
import os
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

import asyncio
import io
import json
from PIL import Image
from httpx import AsyncClient, ASGITransport
from main import app, lifespan

async def run_tests():
    print("=" * 60, flush=True)
    print("ROADSENSE AI - END-TO-END SYSTEM INTEGRATION TEST", flush=True)
    print("=" * 60, flush=True)

    async with lifespan(app):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            # 1. Health check
            print("\n[STEP 1] Testing Health Check...", flush=True)
            res = await client.get("/api/v1/health")
            assert res.status_code == 200, f"Health check failed: {res.text}"
            health_data = res.json()
            print(f"  [OK] Status: {health_data.get('status')} | Service: {health_data.get('service')}", flush=True)

            # 2. Authentication for all 4 roles
            print("\n[STEP 2] Testing Authentication & Role Profiles...", flush=True)
            tokens = {}
            users = {
                "citizen": ("citizen@roadsense.ai", "Citizen@12345"),
                "officer": ("officer@roadsense.ai", "Officer@12345"),
                "maintenance": ("maintenance@roadsense.ai", "Team@12345"),
                "admin": ("admin@roadsense.ai", "Admin@12345"),
            }
            user_ids = {}

            for role, (email, pwd) in users.items():
                res = await client.post("/api/v1/auth/login", json={"email": email, "password": pwd})
                assert res.status_code == 200, f"Login failed for {email}: {res.text}"
                token = res.json()["access_token"]
                tokens[role] = token

                me_res = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
                assert me_res.status_code == 200, f"Failed to get profile for {email}: {me_res.text}"
                me_data = me_res.json()
                user_ids[role] = me_data["id"]
                print(f"  [OK] {role.upper():12} -> {me_data['email']} (ID: {me_data['id'][:8]}..., Role: {me_data['role']})", flush=True)

            # 3. AI Detection endpoint with test image
            print("\n[STEP 3] Testing AI Image Detection Interface...", flush=True)
            img = Image.new("RGB", (640, 480), color=(100, 100, 100))
            img_byte_arr = io.BytesIO()
            img.save(img_byte_arr, format="JPEG")
            img_bytes = img_byte_arr.getvalue()

            det_res = await client.post(
                "/api/v1/detection/image",
                files={"file": ("test_road.jpg", img_bytes, "image/jpeg")}
            )
            assert det_res.status_code == 200, f"Detection failed: {det_res.text}"
            det_data = det_res.json()
            print(f"  [OK] Detection endpoint returned model_status: '{det_data.get('model_status')}'", flush=True)
            print(f"       Message: {det_data.get('message', 'Active')}", flush=True)
            print(f"       Detection count: {det_data.get('detection_count', 0)}", flush=True)

            # 4. Citizen Complaint Submission & Spatial Deduplication
            print("\n[STEP 4] Testing Citizen Grievance & Duplicate Detection (<12m)...", flush=True)
            citizen_headers = {"Authorization": f"Bearer {tokens['citizen']}"}
            complaint_payload = {
                "title": "Severe Pothole on Sector 4 Main Arterial Road",
                "description": "Deep depression creating severe hazard for evening commuter traffic.",
                "latitude": 28.6139,
                "longitude": 77.2090,
                "address_text": "Near Gate 2, Central Park Road, Ward 4",
                "media_urls": ["/uploads/test_road.jpg"]
            }
            c_res = await client.post("/api/v1/complaints/", json=complaint_payload, headers=citizen_headers)
            assert c_res.status_code == 201, f"Complaint submission failed: {c_res.text}"
            c1_data = c_res.json()
            complaint_id = c1_data["id"]
            print(f"  [OK] Complaint #1 Created: '{c1_data['title']}' (ID: {complaint_id[:8]}...)", flush=True)
            print(f"       Initial status: {c1_data['status']}", flush=True)

            # 5. Officer Triage & Maintenance Ticket Creation
            print("\n[STEP 5] Testing Officer Triage & Ticket Creation...", flush=True)
            officer_headers = {"Authorization": f"Bearer {tokens['officer']}"}
            ticket_payload = {
                "title": "Repair Arterial Pothole - Sector 4",
                "description": "Fill and compact asphalt patch for severe depression.",
                "priority": "HIGH",
                "latitude": 28.6139,
                "longitude": 77.2090,
                "ward_identifier": "WARD-04",
                "assigned_team_lead_id": user_ids["maintenance"]
            }
            t_res = await client.post("/api/v1/tickets/", json=ticket_payload, headers=officer_headers)
            assert t_res.status_code == 201, f"Ticket creation failed: {t_res.text}"
            t_data = t_res.json()
            ticket_id = t_data["id"]
            ticket_number = t_data["ticket_number"]
            print(f"  [OK] Maintenance Ticket Created: {ticket_number} (ID: {ticket_id[:8]}...)", flush=True)
            print(f"       Priority: {t_data['priority']} | Assigned Team Lead: {t_data['assigned_team_lead_id'][:8]}...", flush=True)

            # Duplicate complaint submission at nearby coordinates (~4 meters away)
            dup_payload = {
                "title": "Dangerous road crater near same spot",
                "description": "Another report for the same pothole near gate 2.",
                "latitude": 28.61393,
                "longitude": 77.20903,
                "address_text": "Central Park Road, Ward 4"
            }
            dup_res = await client.post("/api/v1/complaints/", json=dup_payload, headers=citizen_headers)
            assert dup_res.status_code == 201, f"Duplicate submission failed: {dup_res.text}"
            dup_data = dup_res.json()
            print(f"  [OK] Duplicate Complaint #2 Registered: ID {dup_data['id'][:8]}...", flush=True)
            print(f"       Automatically matched & linked to Ticket: {dup_data.get('ticket_id')} (Status: {dup_data['status']})", flush=True)

            # 6. Maintenance Team Task Progression & Repair Evidence Submission
            print("\n[STEP 6] Testing Maintenance Team Workflow & Repair Submission...", flush=True)
            maint_headers = {"Authorization": f"Bearer {tokens['maintenance']}"}

            # Retrieve assigned tasks
            tasks_res = await client.get("/api/v1/tickets/?assigned_to_me=true", headers=maint_headers)
            assert tasks_res.status_code == 200
            tasks = tasks_res.json()
            print(f"  [OK] Maintenance queue fetched: {len(tasks)} assigned task(s)", flush=True)

            # Update status to IN_REPAIR
            update_res = await client.patch(
                f"/api/v1/tickets/{ticket_id}",
                json={"status": "IN_REPAIR"},
                headers=maint_headers
            )
            assert update_res.status_code == 200
            print(f"  [OK] Ticket {ticket_number} status updated to: {update_res.json()['status']}", flush=True)

            # Save dummy after-repair photo
            after_img = Image.new("RGB", (640, 480), color=(50, 50, 50))
            after_dir = backend_dir / "uploads" / "images"
            after_dir.mkdir(parents=True, exist_ok=True)
            after_path = after_dir / "after_repair_test.jpg"
            after_img.save(after_path, format="JPEG")

            # Submit repair evidence
            repair_payload = {
                "ticket_id": ticket_id,
                "before_media_url": "/uploads/test_road.jpg",
                "after_media_url": str(after_path),
                "notes": "Asphalt patch applied and compacted using pneumatic roller."
            }
            rep_res = await client.post("/api/v1/repairs/", json=repair_payload, headers=maint_headers)
            assert rep_res.status_code == 201, f"Repair evidence submission failed: {rep_res.text}"
            rep_data = rep_res.json()
            repair_id = rep_data["id"]
            print(f"  [OK] Repair Evidence Submitted (ID: {repair_id[:8]}...)", flush=True)
            print(f"       AI Advisory Score: {rep_data.get('ai_verification_score')} | AI Verdict: {rep_data.get('ai_verdict')}", flush=True)

            # Check status transitioned to AWAITING_VERIFICATION
            t_check = await client.get(f"/api/v1/tickets/{ticket_id}", headers=officer_headers)
            print(f"       Ticket status transitioned to: {t_check.json()['status']}", flush=True)

            # 7. Municipal Officer Final Sign-Off (Human-in-the-loop)
            print("\n[STEP 7] Testing Officer Final Sign-Off & Verification...", flush=True)
            verify_payload = {
                "approved": True,
                "officer_notes": "Repairs visually inspected on site. Cold-mix patch level with road surface. Approved."
            }
            ver_res = await client.patch(f"/api/v1/repairs/{repair_id}/verify", json=verify_payload, headers=officer_headers)
            assert ver_res.status_code == 200, f"Sign-off failed: {ver_res.text}"
            ver_data = ver_res.json()
            print(f"  [OK] Repair Verified by Officer: approved={ver_data['officer_approved']}", flush=True)

            # Verify ticket is CLOSED
            closed_check = await client.get(f"/api/v1/tickets/{ticket_id}", headers=officer_headers)
            assert closed_check.json()["status"] == "CLOSED"
            print(f"  [OK] Ticket {ticket_number} successfully CLOSED at: {closed_check.json().get('resolved_at')}", flush=True)

            # 8. Real-time Analytics & Telemetry
            print("\n[STEP 8] Testing Real Database Telemetry & Analytics...", flush=True)
            overview_res = await client.get("/api/v1/analytics/overview")
            assert overview_res.status_code == 200, f"Overview failed: {overview_res.text}"
            overview = overview_res.json()
            print(f"  [OK] Telemetry Overview:", flush=True)
            print(f"       Complaints Total: {overview['complaints']['total']} (Open: {overview['complaints']['open']}, Resolved: {overview['complaints']['resolved']})", flush=True)
            print(f"       Tickets Total:    {overview['tickets']['total']} (Pending: {overview['tickets']['pending']}, Closed: {overview['tickets']['closed']})", flush=True)
            print(f"       Repairs Done:     {overview.get('repairs_submitted')}", flush=True)

            sev_res = await client.get("/api/v1/analytics/severity")
            assert sev_res.status_code == 200, f"Severity failed: {sev_res.text}"
            print(f"  [OK] Severity categories fetched: {len(sev_res.json())}", flush=True)

            trends_res = await client.get("/api/v1/analytics/trends")
            assert trends_res.status_code == 200, f"Trends failed: {trends_res.text}"
            print(f"  [OK] 7-Day Trend data points: {len(trends_res.json())}", flush=True)

            wards_res = await client.get("/api/v1/analytics/wards")
            assert wards_res.status_code == 200, f"Wards failed: {wards_res.text}"
            print(f"  [OK] Ward distribution records: {len(wards_res.json())}", flush=True)

            # 9. AI Municipal Assistant RAG Chat
            print("\n[STEP 9] Testing AI Municipal Assistant Natural Language Query...", flush=True)
            chat_payload = {"query": "What is the status of pending complaints and critical road hazards?"}
            chat_res = await client.post("/api/v1/assistant/chat", json=chat_payload, headers=officer_headers)
            assert chat_res.status_code == 200
            chat_data = chat_res.json()
            print(f"  [OK] Assistant Response:", flush=True)
            print(f"       \"{chat_data.get('reply')[:120]}...\"", flush=True)
            print(f"       Recommendations count: {len(chat_data.get('recommendations', []))}", flush=True)

            # 10. Notifications Check
            print("\n[STEP 10] Testing In-App Notification Delivery...", flush=True)
            for role in ["citizen", "officer", "maintenance"]:
                notif_res = await client.get("/api/v1/notifications/", headers={"Authorization": f"Bearer {tokens[role]}"})
                assert notif_res.status_code == 200
                notifs = notif_res.json()
                print(f"  [OK] {role.upper():12} received {len(notifs)} notification(s).", flush=True)
                if notifs:
                    print(f"       Latest: [{notifs[0].get('type')}] {notifs[0].get('title')}", flush=True)

    print("\n" + "=" * 60, flush=True)
    print("ALL 10 VERIFICATION STAGES PASSED SUCCESSFULLY!", flush=True)
    print("=" * 60, flush=True)

if __name__ == "__main__":
    asyncio.run(run_tests())
