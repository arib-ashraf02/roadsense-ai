import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from app.models import Base, User, UserRole
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

        for u_data in demo_users:
            existing = session.query(User).filter(User.email == u_data["email"]).first()
            if not existing:
                u = User(**u_data)
                session.add(u)
                print(f"[SEED] Created user: {u_data['email']} ({u_data['role'].value})")
            else:
                print(f"[SKIP] User already exists: {u_data['email']}")

        session.commit()
    print("Database seeding completed successfully!")


if __name__ == "__main__":
    seed_database()
