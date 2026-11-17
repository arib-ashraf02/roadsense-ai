# RoadSense AI — Intelligent Road Defect & Municipal Ticket Platform

RoadSense AI is an end-to-end intelligent road infrastructure auditing and municipal grievance management system. The platform combines Next.js (JavaScript, App Router) with a Python FastAPI microservice to process road footage, run YOLO pothole detection, perform PostGIS spatial deduplication, and track municipal repair lifecycles.

---

## System Architecture

* **Frontend**: Next.js 15 (App Router, JavaScript only, Tailwind CSS, shadcn/ui, Framer Motion, Lucide React, Recharts)
* **Backend**: Python 3.12, FastAPI, Uvicorn, Pydantic v2
* **Computer Vision**: OpenCV, Ultralytics YOLO, PyTorch
* **Spatial & Database**: PostgreSQL with PostGIS extension (`ST_DWithin` spatial deduplication)
* **ORM**: Prisma ORM (JavaScript)

---

## Project Structure

```
RoadSense Ai/
├── .gitignore                    # Root Git ignore rules
├── README.md                     # Project documentation
├── frontend/                     # Next.js Application
│   ├── .env.example              # Frontend environment template
│   ├── .env.local                # Local frontend environment
│   ├── components.json           # shadcn/ui configuration (JavaScript)
│   ├── jsconfig.json             # Path aliases (@/* -> ./src/*)
│   ├── next.config.mjs           # Next.js configuration
│   ├── package.json              # Frontend npm dependencies
│   ├── postcss.config.mjs        # PostCSS configuration
│   ├── tailwind.config.js        # Tailwind CSS theme & shadcn variables
│   └── src/
│       ├── app/
│       │   ├── globals.css       # Global styles & Tailwind layers
│       │   ├── layout.jsx        # Root HTML layout
│       │   └── page.jsx          # Interactive test page & live diagnostics
│       ├── components/
│       │   └── ui/               # Reusable shadcn/ui components (JS)
│       │       ├── badge.jsx
│       │       ├── button.jsx
│       │       └── card.jsx
│       └── lib/
│           └── utils.js          # Tailwind cn() utility function
└── backend/                      # Python FastAPI Application
    ├── .env                      # Local backend environment
    ├── .env.example              # Backend environment template
    ├── main.py                   # FastAPI application entry point
    ├── requirements.txt          # Python dependencies
    ├── venv/                     # Python virtual environment
    └── app/
        ├── api/
        │   └── v1/
        │       ├── health.py     # System health-check endpoint
        │       └── __init__.py   # API v1 router
        ├── core/
        │   ├── config.py         # Pydantic Settings & CORS configuration
        │   └── __init__.py
        ├── models/
        │   └── __init__.py       # Pydantic schemas placeholder
        └── services/
            └── __init__.py       # AI & vision processing services placeholder
```

---

## Getting Started

### 1. Prerequisites

* **Node.js**: v18.0.0 or higher (v24.x tested)
* **npm**: v9.0.0 or higher
* **Python**: v3.10 to v3.12

---

### 2. Backend Setup (FastAPI)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Activate the virtual environment:
   * **Windows (PowerShell)**:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   * **Windows (Command Prompt)**:
     ```cmd
     .\venv\Scripts\activate.bat
     ```
   * **Linux / macOS**:
     ```bash
     source venv/bin/activate
     ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the FastAPI development server:
   ```bash
   uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```
   * **API Root**: `http://127.0.0.1:8000`
   * **Health Check**: `http://127.0.0.1:8000/api/v1/health`
   * **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`

---

### 3. Frontend Setup (Next.js)

1. Open a separate terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```
   * **Web Portal**: `http://localhost:3000`

---

## Security & CORS

The backend is configured with strict Cross-Origin Resource Sharing (CORS) using FastAPI's `CORSMiddleware`. By default, only trusted origins (`http://localhost:3000`, `http://127.0.0.1:3000`) are authorized to make cross-origin requests. Configure `BACKEND_CORS_ORIGINS` in `backend/.env` for production deployments.
