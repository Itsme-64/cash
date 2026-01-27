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
        const res = await fetch(`/checkUsername?username=${encodeURIComponent(username)}`);
        const data = await res.json();

        feedback.textContent = data.message;
        feedback.classList.add(data.available ? "text-success" : "text-danger");
    } catch (err) {
        feedback.textContent = "Error checking username";
        feedback.style.color = "red";
    }
    }, 300);
});