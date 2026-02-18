// User Info Edit Toggle
const toggle = document.getElementById('editToggle');
const formInputs = document.querySelectorAll('#formInputs input, #formInputs select, #formInputs button');
const submitBtn = document.getElementById('submitBtn');
const cancelBtn = document.getElementById("cancelBtn");

toggle.addEventListener('change', () => {
    const enabled = toggle.checked;
    formInputs.forEach(input => {
        if (input.id !== 'file-name-display') {
            input.disabled = !enabled;
        }
    });
    submitBtn.disabled = !enabled;
    cancelBtn.disabled = !enabled;
});

cancelBtn.addEventListener("click", () => {
    toggle.checked = false;

    formInputs.forEach(input => {
        input.disabled = true;
    });
    
    submitBtn.disabled = !enabled;
    cancelBtn.disabled = !enabled;
});

// Account Deletion
const deleteButton = document.getElementById('deleteButton');
const deletionCard = document.getElementById('deletionCard');
const cancelDeleteButton = document.getElementById('cancelDeleteButton');

deleteButton.addEventListener('click', (e) => {
    e.preventDefault();
    deletionCard.classList.add('active');
});

cancelDeleteButton.addEventListener('click', () => {
    deletionCard.classList.remove('active');
});

deletionCard.addEventListener('click', () => {
    deletionCard.classList.remove('active');
});

document.querySelector('.delete-card').addEventListener('click', (e) => {
    e.stopPropagation();
});

const usernameInput = document.getElementById('deleteusername');
const deleteFeedback = document.getElementById('deleteFeedback');
let timeout;

usernameInput.addEventListener("input", () => {
    clearTimeout(timeout);
    timeout = setTimeout(async () => {
        const username = usernameInput.value.trim();

        if (!username) {
            deleteButton.disabled = true;
            deleteFeedback.textContent = "";
            return;
        }

        try {
            const res = await fetch(`/api/check?shoulddelete=${encodeURIComponent(username)}`);
            const data = await res.json();

            deleteFeedback.textContent = data.message;
            deleteFeedback.classList.toggle("text-light", data.valid);
            deleteFeedback.classList.toggle("text-danger", !data.valid);

            deleteButton.disabled = !data.valid;
        } catch (err) {
            deleteFeedback.textContent = "Error checking validity";
            deleteFeedback.style.color = "yellow";
        }
    }, 300);
});