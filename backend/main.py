import os
import io
from datetime import datetime

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

import gspread
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload

load_dotenv()

app = FastAPI(title="OAX Careers – Google Sheet + Drive Upload")

# ---- CORS ----
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5500,http://127.0.0.1:5500"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in ALLOWED_ORIGINS if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Google config ----
SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
]

SHEET_ID = os.getenv("GOOGLE_SHEET_ID")
WORKSHEET_NAME = os.getenv("GOOGLE_WORKSHEET_NAME", "Applications")

# Optional: upload into a specific folder (recommended)
DRIVE_FOLDER_ID = os.getenv("DRIVE_FOLDER_ID", "").strip() or None

def get_creds():
    return Credentials.from_service_account_file(
        "service_account.json",
        scopes=SCOPES
    )

def get_sheet():
    if not SHEET_ID:
        raise RuntimeError("GOOGLE_SHEET_ID missing in .env")
    client = gspread.authorize(get_creds())
    return client.open_by_key(SHEET_ID).worksheet(WORKSHEET_NAME)

def upload_to_drive(file: UploadFile, role: str, full_name: str):
    drive = build("drive", "v3", credentials=get_creds())

    # Read file bytes once
    content = file.file.read()
    if not content:
        raise RuntimeError("Empty file uploaded")

    # Safer filename
    safe_name = full_name.strip().replace(" ", "_")
    safe_role = role.strip().replace(" ", "_").replace("/", "-")
    timestamp = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    final_name = f"{safe_name}-{safe_role}-{timestamp}-{file.filename}"

    media = MediaIoBaseUpload(
        io.BytesIO(content),
        mimetype=file.content_type,
        resumable=False
    )

    body = {"name": final_name}
    if DRIVE_FOLDER_ID:
        body["parents"] = [DRIVE_FOLDER_ID]

    uploaded = drive.files().create(
        body=body,
        media_body=media,
        fields="id"
    ).execute()

    file_id = uploaded["id"]

    # Make file viewable (anyone with link can view)
    drive.permissions().create(
        fileId=file_id,
        body={"type": "anyone", "role": "reader"}
    ).execute()

    return f"https://drive.google.com/file/d/{file_id}/view"

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/api/applications")
async def submit_application(
    role: str = Form(...),
    full_name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(""),
    location: str = Form(""),
    portfolio: str = Form(""),
    linkedin: str = Form(""),
    cover_letter: str = Form(""),
    resume: UploadFile = File(...)
):
    # Only allow pdf/docx
    allowed = {
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    }
    if resume.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Resume must be PDF or DOCX")

    # Optional size limit (5MB)
    # Note: this reads file into memory already (fine for small limits)
    resume.file.seek(0, os.SEEK_END)
    size = resume.file.tell()
    resume.file.seek(0)
    if size > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Resume too large (max 5MB)")

    try:
        resume_link = upload_to_drive(resume, role=role, full_name=full_name)
        sheet = get_sheet()

        sheet.append_row([
            datetime.utcnow().isoformat(),
            role,
            full_name,
            email,
            phone,
            location,
            portfolio,
            linkedin,
            resume_link,
            cover_letter
        ])

        return {"success": True, "resume_link": resume_link}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {e}")
