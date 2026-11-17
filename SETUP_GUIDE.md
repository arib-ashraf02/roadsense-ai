# RoadSense AI — Setup & Execution Guide

---

## 1. Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher
* **Python**: v3.12+ (isolated virtual environment provided at `backend/venv`)

---

## 2. Quickstart

### Step 1: Start the FastAPI Backend
```powershell
# Open Terminal 1
cd "c:\Users\Acer\Desktop\RoadSense Ai\backend"

# Activate Python virtual environment
.\venv\Scripts\Activate.ps1

# Seed Demo Database (Creates users, tables, and credentials)
python seed_db.py

# Run FastAPI Development Server
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

* **Interactive Swagger UI**: `http://127.0.0.1:8000/docs`
* **Health Check**: `http://127.0.0.1:8000/api/v1/health`

---

### Step 2: Start the Next.js Frontend
```powershell
# Open Terminal 2
cd "c:\Users\Acer\Desktop\RoadSense Ai\frontend"

# Start Next.js Development Server
npm run dev
```

* **Web Portal**: `http://localhost:3000`

---

## 3. Seeded Demo Accounts

You can log in immediately with any of the four pre-configured roles:

| Role | Email | Password | Primary Workflow |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@roadsense.ai` | `Admin@12345` | Role Governance, System Telemetry, Audit Logs |
| **Municipal Officer** | `officer@roadsense.ai` | `Officer@12345` | Grievance Triage, Work Order Generation, Repair Sign-Off |
| **Citizen / Reporter** | `citizen@roadsense.ai` | `Citizen@12345` | Pothole Photo/Video Upload, GPS Extraction, Grievance Tracking |
| **Maintenance Team** | `maintenance@roadsense.ai` | `Team@12345` | Assigned Work Orders, GPS Navigation, After-Repair Proof |

---

## 4. Key End-to-End Workflow Verification

1. **Citizen Submission**:
   - Log in as `citizen@roadsense.ai`.
   - Go to **Report Pothole** (`/citizen/report`).
   - Drag and drop a road photo. Observe the client-side EXIF GPS extraction and live duplicate detection check.
   - Click **Submit Grievance**.

2. **Officer Triage**:
   - Log in as `officer@roadsense.ai`.
   - Open **Triage Complaints** (`/officer/complaints`).
   - Click **Approve & Ticket** to dispatch a municipal work order.

3. **Field Maintenance & Repair Verification**:
   - Log in as `maintenance@roadsense.ai`.
   - Open **Assigned Repairs** (`/maintenance/tasks`).
   - Click **Submit Repair Evidence** (`/maintenance/verify/[id]`).
   - Upload an after-repair photo. The AI verification engine checks for residual potholes and evaluates asphalt patch uniformity.

4. **Officer Sign-off & Analytics**:
   - Officer inspects the AI advisory recommendation and signs off.
   - Open **Analytics** (`/analytics`) to see real database-driven severity charts and 7-day trendlines update dynamically!
