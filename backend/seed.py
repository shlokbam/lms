"""
Run once to seed the database with default users and modules.
Usage: python seed.py
"""
from database import engine, SessionLocal
from models import Base, User, Module, Chapter, Enrollment, Notification
from auth import hash_password
from datetime import datetime, timedelta

DEFAULT_MODULES = [
    ("Security Fundamentals & Post Orders","Core principles of security operations, post orders, standing instructions and site-specific responsibilities.","Security Operations","#3B5BDB"),
    ("Fire Safety & Emergency Response","Fire prevention, evacuation procedures, use of fire extinguishers, and emergency contact protocols.","Safety & Compliance","#F04438"),
    ("Access Control & Visitor Management","Managing entry/exit points, visitor registration, badge systems, and unauthorized access procedures.","Security Operations","#0BA5EC"),
    ("CCTV Operations & Surveillance","Operating CCTV systems, monitoring feeds, recording procedures, and incident documentation.","Technology","#7C3AED"),
    ("Patrolling Techniques & QRT Procedures","Effective patrolling methods, Quick Response Team deployment, and incident escalation procedures.","Field Operations","#F79009"),
    ("Housekeeping Standards & Hygiene Protocols","Professional cleaning standards, hygiene compliance, waste management, and workplace sanitation.","Facility Management","#12B76A"),
    ("Legal Aspects of Security","PSARA Act, rights and limitations of security personnel, FIR procedures, and legal documentation.","Legal & Compliance","#6D28D9"),
    ("Soft Skills & Client Interaction","Professional communication, conflict de-escalation, customer service mindset, and grooming standards.","Professional Development","#0891B2"),
    ("Crowd & Event Management","Managing large gatherings, crowd control techniques, VIP protection, and event security protocols.","Field Operations","#D97706"),
    ("First Aid & Basic Medical Response","CPR techniques, wound care, handling medical emergencies, and coordination with medical services.","Safety & Compliance","#059669"),
]

DEFAULT_CHAPTERS = [
    ["Introduction & Overview","Core Concepts & Principles","Practical Applications","Assessment & Review"],
    ["Fire Hazard Identification","Evacuation Drill Procedures","Extinguisher Types & Usage","Post-Incident Reporting"],
    ["Access Control Systems","Visitor Registration Flow","Suspicious Persons Protocol","Documentation Requirements"],
    ["Camera System Overview","Monitoring Best Practices","Evidence Preservation","Incident Log Maintenance"],
    ["Patrol Route Planning","Night Patrol Protocols","QRT Activation Procedure","Coordination with Police"],
    ["Daily Cleaning Schedule","Chemicals & Safety Handling","Waste Segregation Standards","Reporting & Quality Check"],
    ["PSARA Act Overview","Rights of Security Personnel","Use of Force Guidelines","FIR & Legal Documentation"],
    ["Professional Communication","Conflict Resolution Skills","Client Handling Techniques","Grooming & Uniform Standards"],
    ["Crowd Psychology Basics","Barrier & Zone Management","VIP & Dignitary Protection","Incident Response Drill"],
    ["Basic Life Support","CPR Step-by-Step Guide","Common Emergency Scenarios","Medical Escalation Protocols"],
]


def seed():
    # Create all tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Users
        trainer_id = None
        if not db.query(User).filter_by(email="trainer@eagle.com").first():
            t = User(name="Rajesh Kumar", email="trainer@eagle.com",
                     password=hash_password("trainer123"), role="trainer",
                     department="Training & Development", phone="+91 98765 43210")
            db.add(t); db.flush(); trainer_id = t.id

            for name, email, dept, phone in [
                ("Arjun Sharma",   "trainee@eagle.com", "Security Operations",  "+91 91234 56789"),
                ("Priya Mehta",    "priya@eagle.com",   "Facility Management",  "+91 90987 65432"),
                ("Mohammed Iqbal", "iqbal@eagle.com",   "QRT Division",         "+91 88765 43210"),
            ]:
                db.add(User(name=name, email=email, password=hash_password("trainee123"),
                            role="trainee", department=dept, phone=phone))
            db.commit()
        else:
            trainer_id = db.query(User).filter_by(email="trainer@eagle.com").first().id

        # Modules
        if db.query(Module).filter_by(is_default=True).count() == 0 and trainer_id:
            now = datetime.now()
            mod_ids = []
            for i, (title, desc, cat, color) in enumerate(DEFAULT_MODULES):
                start = now + timedelta(days=i * 4 + 1)
                end   = start + timedelta(hours=8)
                m = Module(title=title, description=desc, category=cat,
                           trainer_id=trainer_id,
                           start_datetime=start, end_datetime=end,
                           status="published", is_default=True, color=color)
                db.add(m); db.flush(); mod_ids.append(m.id)
                for j, ch_title in enumerate(DEFAULT_CHAPTERS[i]):
                    db.add(Chapter(module_id=m.id, title=ch_title, order_num=j))
            db.commit()

            trainees = db.query(User).filter_by(role="trainee").all()
            for t in trainees:
                for mid in mod_ids:
                    if not db.query(Enrollment).filter_by(module_id=mid, trainee_id=t.id).first():
                        db.add(Enrollment(module_id=mid, trainee_id=t.id))
                db.add(Notification(user_id=t.id, title="🎉 Welcome to Eagle LMS!",
                                    body="You have been enrolled in 10 professional training modules. Start your journey today!",
                                    type="welcome", link="/trainee/dashboard"))
            db.commit()
            print(f"✅ Seeded {len(mod_ids)} modules and {len(trainees)} trainees.")
        else:
            print("ℹ️  Data already seeded — skipping.")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
