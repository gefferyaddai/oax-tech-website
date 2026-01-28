// ===============================
// OAX Careers - Apply Modal + Apps Script Upload (Drive + Sheets)
// Fix 2: use text/plain to avoid CORS preflight
// Fix 3: lower MAX_MB to 3 to avoid Apps Script payload limits
// ===============================

// 1) Footer year
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// 2) Configure your Apps Script + IDs
// IMPORTANT: Paste your real values here
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzBtBN5AmqeyQsIaqoUYps_kBS9SLqq9DT8huEoL-MF2k_pRIhpmlvtvLzQ0QC3PrYA7w/exec";  // e.g. https://script.google.com/macros/s/XXXX/exec
const SHEET_ID = "1NRnB698XEt9krtLKN49CTn_0L_tP5GDUw5epWUEo4lY";            // from Google Sheet URL
const DRIVE_FOLDER_ID = "1tms9QqkauR-IqE_poksnQSzkBmvGh0Pb";     // from Drive folder URL

// 3) Modal elements
const modal = document.getElementById("applyModal");
const closeBtn = document.getElementById("closeModalBtn");
const form = document.getElementById("applyForm");
const statusEl = document.getElementById("formStatus");

const roleNameEl = document.getElementById("roleName");
const roleInput = document.getElementById("roleInput");

// 4) Helpers
function openModalForRole(role) {
  if (!modal) return;
  if (roleNameEl) roleNameEl.textContent = role;
  if (roleInput) roleInput.value = role;
  if (statusEl) statusEl.textContent = "";
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  if (!modal) return;
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
}

// Generic modal helpers (works for any modal id)
function openModal(modalId) {
  const m = document.getElementById(modalId);
  if (!m) return;
  m.classList.add("active");
  m.setAttribute("aria-hidden", "false");
}

function closeModalById(modalId) {
  const m = document.getElementById(modalId);
  if (!m) return;
  m.classList.remove("active");
  m.setAttribute("aria-hidden", "true");
}


// Convert file -> base64 (no metadata prefix)
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = String(reader.result).split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function setStatus(msg) {
  if (statusEl) statusEl.textContent = msg;
}

// 5) Wire Apply buttons
document.querySelectorAll(".apply-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const role = btn.getAttribute("data-role") || "General Application";
    openModalForRole(role);
  });
});

// 6) Close actions
if (closeBtn) closeBtn.addEventListener("click", closeModal);

if (modal) {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal && modal.classList.contains("active")) {
    closeModal();
  }
});

// 7) Submit application (Drive upload + Sheet row via Apps Script)
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Basic config check
    if (!SCRIPT_URL.includes("script.google.com")) {
      setStatus("Missing SCRIPT_URL. Paste your Apps Script /exec URL in index.js.");
      return;
    }
    if (!SHEET_ID || SHEET_ID.startsWith("PASTE_")) {
      setStatus("Missing SHEET_ID. Paste your Google Sheet ID in index.js.");
      return;
    }
    if (!DRIVE_FOLDER_ID || DRIVE_FOLDER_ID.startsWith("PASTE_")) {
      setStatus("Missing DRIVE_FOLDER_ID. Paste your Drive folder ID in index.js.");
      return;
    }

    const resumeFileInput = document.getElementById("resumeFile");
    const resumeFile = resumeFileInput?.files?.[0];

    if (!resumeFile) {
      setStatus("Please upload your resume (PDF or DOCX).");
      return;
    }

    // Client-side file validation
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    if (!allowedTypes.includes(resumeFile.type)) {
      setStatus("Resume must be a PDF or DOCX file.");
      return;
    }

    // Fix 3: lower size limit to avoid Apps Script payload limit (base64 expands size)
    const MAX_MB = 3;
    if (resumeFile.size > MAX_MB * 1024 * 1024) {
      setStatus(`Resume too large (max ${MAX_MB}MB).`);
      return;
    }

    const submitBtn = document.getElementById("submitBtn");
    if (submitBtn) submitBtn.disabled = true;
    setStatus("Uploading resume...");

    try {
      // Convert file -> base64
      const base64 = await fileToBase64(resumeFile);

      // Build payload
      const payload = {
        sheetId: SHEET_ID,
        driveFolderId: DRIVE_FOLDER_ID,

        role: roleInput?.value || "General Application",
        full_name: document.getElementById("fullName")?.value || "",
        email: document.getElementById("email")?.value || "",

        phone: document.getElementById("phone")?.value || "",
        location: document.getElementById("location")?.value || "",
        portfolio: document.getElementById("portfolio")?.value || "",
        linkedin: document.getElementById("linkedin")?.value || "",
        cover_letter: document.getElementById("coverLetter")?.value || "",

        fileName: resumeFile.name,
        fileMimeType: resumeFile.type,
        fileBase64: base64
      };

      // Required check
      if (!payload.full_name.trim() || !payload.email.trim()) {
        throw new Error("Please fill in your full name and email.");
      }

      // Fix 2: send as text/plain to avoid CORS preflight (OPTIONS)
      const res = await fetch(SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });

      // Read as text then parse JSON (more robust)
      const text = await res.text();
      let out = {};
      try { out = JSON.parse(text); } catch {}

      if (!out.success) {
        throw new Error(out.error || "Submission failed");
      }

      setStatus("Submitted ✅");
      form.reset();

      // Close modal after a beat
      setTimeout(closeModal, 900);

    } catch (err) {
      setStatus(err?.message || "Upload failed");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

// Live Roles Modal
const openLiveRoles = document.getElementById("openLiveRoles");
const closeLiveRolesBtn = document.getElementById("closeLiveRolesBtn");
const liveRolesModal = document.getElementById("liveRolesModal");

openLiveRoles?.addEventListener("click", (e) => {
  e.preventDefault();
  openModal("liveRolesModal");
});

closeLiveRolesBtn?.addEventListener("click", () => {
  closeModalById("liveRolesModal");
});

// close when clicking outside the panel
liveRolesModal?.addEventListener("click", (e) => {
  if (e.target === liveRolesModal) closeModalById("liveRolesModal");
});

// close with Esc when live roles is open
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && liveRolesModal?.classList.contains("active")) {
    closeModalById("liveRolesModal");
  }
});


