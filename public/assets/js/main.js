document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.form-check label, .form-radio label').forEach(label => {
    const icon = document.createElement('i');
    icon.className = 'input-helper';
    label.appendChild(icon);
  });
});

document.getElementById("year").textContent = new Date().getFullYear();

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
toggleBtn.addEventListener('click', function(e) {
  e.preventDefault();
  openFullSidebar();
});

// Close full sidebar
miniClose.addEventListener('click', function(e) {
  e.preventDefault();
  closeFullSidebar();
});