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
const form = document.getElementById("consultForm");
const toast = document.getElementById("toast");

form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = form.name.value.trim();
    const contact = form.contact.value.trim();
    const pkg = form.package.value.trim();
    const details = form.details.value.trim();

    if (!name || !contact || !pkg || !details) return;

    toast.classList.add("show");
    form.reset();
    toast.scrollIntoView({behavior:"smooth", block:"nearest"});
});

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
