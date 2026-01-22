document.getElementById("year").textContent = new Date().getFullYear();

// smooth scroll (basic)
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (!id || id === "#") return;
        const el = document.querySelector(id);
        if (!el) return;
        e.preventDefault();
        el.scrollIntoView({behavior:"smooth", block:"start"});
    });
});

// preselect package from buttons
document.querySelectorAll("[data-pick]").forEach(btn => {
    btn.addEventListener("click", () => {
        const pick = btn.getAttribute("data-pick");
        const pkg = document.getElementById("package");
        if (pkg) pkg.value = pick;
    });
});

// form submit (front-end only demo)

document.querySelectorAll('.work-card').forEach(card => {
    card.addEventListener('click', () => {
        const url = card.dataset.url;
        if (url) {
            window.open(url, '_blank');
        }
    });
});

// Prevent button click from triggering card click
document.querySelectorAll('.work-cta').forEach(btn => {
    btn.addEventListener('click', e => {
        e.stopPropagation();
    });
});

// google sheets implementation
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwu460vS5PMkR0YaSa0cmyAnrkY0qepWrguqea_96Bx8HjvgCdUj25S6B41jAmf-t1d/exec";

const form = document.getElementById("consultForm");
const toast = document.getElementById("toast");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Validate using actual form values (NOT payload.name)
    const name = form.name.value.trim();
    const company = form.company.value.trim();
    const contact = form.contact.value.trim();
    const pkg = form.package.value.trim();
    const details = form.details.value.trim();

    if (!name || !contact || !pkg || !details) {
        console.log("Missing fields");
        return;
    }

    const btn = form.querySelector('button[type="submit"]');

    try {
        btn.disabled = true;
        btn.textContent = "Submitting...";

        const payload = new FormData();
        payload.append("name", name);
        payload.append("company", company);
        payload.append("contact", contact);
        payload.append("package", pkg);
        payload.append("details", details);

        await fetch(SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            body: payload
        });

        // no-cors hides response, so assume success if fetch didn't throw
        toast.classList.add("show");
        form.reset();

    } catch (err) {
        console.error("Submit error:", err);
        alert("Submit failed — check console.");
    } finally {
        btn.disabled = false;
        btn.textContent = "Submit request";
    }
});
