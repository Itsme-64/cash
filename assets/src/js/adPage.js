const redirectInstantly = document.body.dataset.redirectInstantly === "true";
const duration = Number(document.body.dataset.duration);
const example = document.body.dataset.urlShort === "example";

let seconds = duration / 1000;
let countDownElement;
let paused = false;

redirectInstantly ? countDownElement = document.getElementById('countdownText')
                  : countDownElement = document.getElementById("countdownButton");

const updateCountdown = setInterval(() => {
    if (!paused) {
        if (redirectInstantly) {
            countDownElement.textContent = seconds;
        } else {
            countDownElement.textContent = `Skip in ${seconds}`;
        }

        if (seconds <= 0) redirect();
        --seconds;

        if (example) handleExample(seconds);
    }
}, 1000);

function redirect() {
    clearInterval(updateCountdown);

    if (!example) {
        fetch(`/click/validate?clickid=${document.body.dataset.clickId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }).catch((err) => { console.error(err) });
    }

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


const durationTooltip = document.getElementById("tooltip-duration");
const redirectTooltip = document.getElementById("tooltip-redirect");
const registerTooltip = document.getElementById("tooltip-register");
const pauseOverlay = document.getElementById('pause-overlay');

const tooltips = [durationTooltip, redirectTooltip, registerTooltip].filter(Boolean);
const tooltipMap = new Map();

let pauseTimeout;

tooltips.forEach(el => {
    const tooltip = new bootstrap.Tooltip(el, {
        trigger: 'manual'
    });

    tooltipMap.set(el, tooltip);
});

pauseOverlay.addEventListener("click", () => {
    if (!paused) return;

    tooltipMap.forEach((tooltip, toolTip) => {
        if (tooltip._isShown()) {
            clearTimeout(pauseTimeout);
            resumeDefault(toolTip);
        }
    });
});


function handleExample(seconds) {
    switch (seconds) {
        case 7:
            pauseDefault(durationTooltip);
            break;
        case 4:
            pauseDefault(redirectTooltip);
            break;
        case 1:
            pauseDefault(registerTooltip);
            break;
        default:
            return;
    }
}

function resumeDefault(toolTip) {
    tooltipMap.get(toolTip).hide();
    pauseOverlay.classList.remove('active')
    paused = false;
}

function pauseDefault(toolTip) {
    paused = true;
    pauseOverlay.classList.add('active')
    tooltipMap.get(toolTip).show();

    pauseTimeout = setTimeout(() => {
        resumeDefault(toolTip);
    }, 4500)
}