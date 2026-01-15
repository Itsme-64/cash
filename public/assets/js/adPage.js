const redirectInstantly = document.body.dataset.redirectInstantly === "true";
const duration = Number(document.body.dataset.duration);

let seconds = duration / 1000;
let countDownElement;

redirectInstantly ? countDownElement = document.getElementById('countdownText')
                    : countDownElement = document.getElementById("countdownButton");

const updateCountdown = setInterval(() => {
    if (redirectInstantly) {
        countDownElement.textContent = seconds;
    } else {
        countDownElement.textContent = `Skip in ${seconds}`;
    }

    if (seconds <= 0) redirect();

    --seconds;
}, 1000);

function redirect() {
    clearInterval(updateCountdown);

    if (redirectInstantly) {
        countDownElement.textContent = 0;
        window.location.href = document.body.dataset.urlFull;
    } else {
        countDownElement.textContent = "Skip";
        countDownElement.classList.remove("disabled");
    }
}


document.addEventListener("DOMContentLoaded", function() {
    const footerButton = document.getElementById("footerButton");
    const footer = document.getElementById("footer");
    const arrow = footerButton.querySelector("i");

    footerButton.onclick = function(e) {
        footer.classList.toggle("show");

        if (footer.classList.contains("show")) {
            arrow.style.transform = "rotate(180deg)";
        } else {
            arrow.style.transform = "rotate(0deg)";
        }
    };
});