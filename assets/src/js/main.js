document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.form-check label, .form-radio label').forEach(label => {
        const icon = document.createElement('i');
        icon.className = 'input-helper';
        label.appendChild(icon);
    });
});

const yearElement = document.getElementById("year");
if (yearElement) {  
    yearElement.textContent = new Date().getFullYear();  
}

const toggleBtn = document.getElementById('toggleSidebar');
const sidebar = document.getElementById('sidebar');
const miniSidebar = document.getElementById('sidebarMini');
const miniClose = document.getElementById('miniCloseSidebar');

function openFullSidebar() {
    sidebar.classList.add('active');
    miniSidebar.style.display = 'none';
    miniClose.style.display = 'flex';
}

function closeFullSidebar() {
    sidebar.classList.remove('active');
    miniSidebar.style.display = 'flex';
    miniClose.style.display = 'none';
}

// Open full sidebar
if (toggleBtn) {
    toggleBtn.addEventListener('click', function(e) {
        e.preventDefault();
        openFullSidebar();
    });
}

// Close full sidebar
if (miniClose) {
    miniClose.addEventListener('click', function(e) {
        e.preventDefault();
        closeFullSidebar();
    });
}

// Tooltips
if (typeof bootstrap !== 'undefined') {
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    });
}

// Copy button
document.querySelectorAll('.copy-button').forEach(btn => {
    btn.addEventListener('click', async (e) => {
        const text = e.currentTarget.dataset.copy;

        try {
            await navigator.clipboard.writeText(text);

            btn.classList.add('copied');
            btn.classList.replace('mdi-content-copy', 'mdi-check');

            setTimeout(() => {
                btn.classList.replace('mdi-check', 'mdi-content-copy');
                btn.classList.remove('copied');
            }, 1800);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    });
});