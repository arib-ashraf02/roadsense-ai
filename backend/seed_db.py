import sys
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from app.models import (
    Base,
    User,
    UserRole,
    PotholeDetection,
    SeverityEnum,
    SpatialCluster,
    Ticket,
    TicketPriority,
    TicketStatus,
    Complaint,
    ComplaintStatus
)
from app.core.security import hash_password

DB_PATH = backend_dir / "roadsense.db"
engine = create_engine(f"sqlite:///{DB_PATH}")


def seed_database():
    Base.metadata.create_all(bind=engine)
    with Session(engine) as session:
        # 1. Seed demo users
        demo_users = [
            {
                "id": str(uuid.uuid4()),
                "email": "admin@roadsense.ai",
                "passwordHash": hash_password("Admin@12345"),
                "fullName": "Chief Municipal Administrator",
                "phone": "+91 98765 00001",
                "role": UserRole.ADMIN,
                "wardId": "WARD-01",
                "isActive": True
            },
            {
                "id": str(uuid.uuid4()),
                "email": "officer@roadsense.ai",
                "passwordHash": hash_password("Officer@12345"),
                "fullName": "Ward 4 Infrastructure Officer",
                "phone": "+91 98765 00002",
                "role": UserRole.OFFICER,
                "wardId": "WARD-04",
                "isActive": True
            },
            {
                "id": str(uuid.uuid4()),
                "email": "citizen@roadsense.ai",
                "passwordHash": hash_password("Citizen@12345"),
                "fullName": "Aarav Sharma (Citizen)",
                "phone": "+91 98765 00003",
                "role": UserRole.CITIZEN,
                "wardId": "WARD-04",
                "isActive": True
            },
            {
                "id": str(uuid.uuid4()),
                "email": "maintenance@roadsense.ai",
                "passwordHash": hash_password("Team@12345"),
                "fullName": "Rapid Asphalt Repair Team Lead",
                "phone": "+91 98765 00004",
                "role": UserRole.MAINTENANCE,
                "wardId": "WARD-04",
                "isActive": True
            }
        ]

        user_map = {}
        for u_data in demo_users:
            existing = session.query(User).filter(User.email == u_data["email"]).first()
            if not existing:
                u = User(**u_data)
                session.add(u)
                user_map[u_data["role"].value] = u.id
                print(f"[SEED] Created user: {u_data['email']} ({u_data['role'].value})")
            else:
                user_map[u_data["role"].value] = existing.id
                print(f"[SKIP] User already exists: {u_data['email']}")

        session.commit()

        # 2. Seed Geotagged Demo Potholes if table is empty
        detection_count = session.query(PotholeDetection).count()
        if detection_count == 0:
            demo_potholes = [
                {
                    "id": str(uuid.uuid4()),
                    "confidence": 0.94,
                    "severity": SeverityEnum.CRITICAL,
                    "estimated_area_sqm": 0.85,
                    "bounding_boxes": [[120, 180, 480, 420]],
                    "latitude": 28.6139,
                    "longitude": 77.2090,
                    "is_duplicate": False,
                    "detected_at": datetime.now(timezone.utc) - timedelta(days=2)
                },
                {
                    "id": str(uuid.uuid4()),
                    "confidence": 0.88,
                    "severity": SeverityEnum.HIGH,
                    "estimated_area_sqm": 0.52,
                    "bounding_boxes": [[90, 150, 310, 340]],
                    "latitude": 28.6250,
                    "longitude": 77.2180,
                    "is_duplicate": False,
                    "detected_at": datetime.now(timezone.utc) - timedelta(days=3)
                },
                {
                    "id": str(uuid.uuid4()),
                    "confidence": 0.79,
                    "severity": SeverityEnum.MEDIUM,
                    "estimated_area_sqm": 0.31,
                    "bounding_boxes": [[140, 200, 290, 310]],
                    "latitude": 28.5920,
                    "longitude": 77.0460,
                    "is_duplicate": False,
                    "detected_at": datetime.now(timezone.utc) - timedelta(days=1)
                },
                {
                    "id": str(uuid.uuid4()),
                    "confidence": 0.65,
                    "severity": SeverityEnum.LOW,
                    "estimated_area_sqm": 0.14,
                    "bounding_boxes": [[200, 220, 270, 280]],
                    "latitude": 28.5355,
                    "longitude": 77.3910,
                    "is_duplicate": False,
                    "detected_at": datetime.now(timezone.utc) - timedelta(days=4)
                },
                {
                    "id": str(uuid.uuid4()),
                    "confidence": 0.91,
                    "severity": SeverityEnum.HIGH,
                    "estimated_area_sqm": 0.60,
                    "bounding_boxes": [[80, 110, 380, 390]],
                    "latitude": 28.6320,
                    "longitude": 77.2250,
                    "is_duplicate": False,
                    "detected_at": datetime.now(timezone.utc) - timedelta(days=5)
                },
                {
                    "id": str(uuid.uuid4()),
                    "confidence": 0.96,
                    "severity": SeverityEnum.CRITICAL,
                    "estimated_area_sqm": 0.95,
                    "bounding_boxes": [[110, 140, 520, 460]],
                    "latitude": 28.6010,
                    "longitude": 77.1950,
                    "is_duplicate": False,
                    "detected_at": datetime.now(timezone.utc) - timedelta(hours=8)
                }
            ]
            for p_data in demo_potholes:
                p = PotholeDetection(**p_data)
                session.add(p)
            print(f"[SEED] Created {len(demo_potholes)} geotagged demo pothole detections.")

            # Seed demo spatial clusters
            clusters = [
                {
                    "id": str(uuid.uuid4()),
                    "latitude": 28.6139,
                    "longitude": 77.2090,
                    "radius_meters": 12.0,
                    "detection_count": 3,
                    "ward_identifier": "WARD-04",
                    "last_seen_at": datetime.now(timezone.utc)
                },
                {
                    "id": str(uuid.uuid4()),
                    "latitude": 28.6250,
                    "longitude": 77.2180,
                    "radius_meters": 10.0,
                    "detection_count": 2,
                    "ward_identifier": "WARD-01",
                    "last_seen_at": datetime.now(timezone.utc)
                }
            ]
            for c_data in clusters:
                c = SpatialCluster(**c_data)
                session.add(c)
            print(f"[SEED] Created {len(clusters)} demo spatial clusters.")

            session.commit()
        else:
            print(f"[SKIP] Pothole detections already seeded ({detection_count} records).")

    print("Database seeding completed successfully!")


if __name__ == "__main__":
    seed_database()
