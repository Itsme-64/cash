const usernameInput = document.getElementById("username");
const feedback = document.getElementById("usernameFeedback");

let timeout;

usernameInput.addEventListener("input", () => {
    clearTimeout(timeout);
    timeout = setTimeout(async () => {
    const username = usernameInput.value.trim();
    if (!username || username.length < 4) {
        feedback.textContent = "";
        return;
    }

    try {
        const res = await fetch(`/api/check?username=${encodeURIComponent(username)}`);
        const data = await res.json();

        feedback.textContent = data.message;
        feedback.classList.toggle("text-success", data.available);
        feedback.classList.toggle("text-danger", !data.available);
    } catch (err) {
        feedback.textContent = "Error checking username availability";
        feedback.style.color = "yellow";
    }
    }, 300);
});