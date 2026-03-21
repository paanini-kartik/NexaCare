import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import firebase
from firebase import db

# Seeding test user with fake data

USER_ID = "ix98lkU2rgQwzeTdNdnpknEb5fn2"

appointments = [
    {
        "userId": USER_ID,
        "type": "Annual Dental Checkup",
        "clinicName": "Downtown Dental",
        "date": "2026-04-05",
        "duration": 60,
        "status": "upcoming"
    },
    {
        "userId": USER_ID,
        "type": "Eye Exam",
        "clinicName": "ClearVision Optometry",
        "date": "2026-04-12",
        "duration": 45,
        "status": "upcoming"
    },
    {
        "userId": USER_ID,
        "type": "Physiotherapy Session",
        "clinicName": "ActiveCare Physio",
        "date": "2026-04-20",
        "duration": 30,
        "status": "upcoming"
    },
    {
        "userId": USER_ID,
        "type": "Dental Cleaning",
        "clinicName": "Downtown Dental",
        "date": "2025-12-01",
        "duration": 45,
        "status": "past"
    },
    {
        "userId": USER_ID,
        "type": "General Checkup",
        "clinicName": "City Health Clinic",
        "date": "2025-10-15",
        "duration": 30,
        "status": "past"
    }
]

for appointment in appointments:
    db.collection("appointments").add(appointment)
    print(f"Added: {appointment['type']}")

print("Seeding complete")