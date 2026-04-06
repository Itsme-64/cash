const checkbox = document.getElementById('bulkToggle');
const singleInput = document.getElementById('singleLinkInput');
const bulkInput = document.getElementById('bulkLinkInput');

checkbox.addEventListener('change', () => {
    if (checkbox.checked) {
        singleInput.style.display = 'none';
        bulkInput.style.display = 'block';
    } else {
        singleInput.style.display = 'block';
        bulkInput.style.display = 'none';
    }
});


window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get('url');

    if (urlParam) {
    const input = document.getElementById('singleLink');
    if (input) {
        input.value = decodeURIComponent(urlParam);
    }
    }
});


const monetizationCheckbox = document.getElementById('monetization');
const monetizationOptions = document.getElementById('monetization-options');
const monetizationLabel = document.getElementById('monetization-label');
const count = Number(monetizationLabel.dataset.count);

function toggleMonetizationOptions() {
    monetizationOptions.style.display =
        monetizationCheckbox.checked ? 'block' : 'none';

    const remaining = 5 - count;

    if (monetizationCheckbox.checked) {
        monetizationLabel.innerHTML = 'Monetization enabled'
    } else {
        monetizationLabel.innerHTML =
            `Monetization disabled (max 5 per month, you have <span id="monetization-remaining">&nbsp;${remaining}&nbsp;</span> left)`;

        const remainingSpan = document.getElementById('monetization-remaining');

        if (remaining == 0) {
            remainingSpan.classList.add('text-danger');
        } else if (remaining <= 1) {
            remainingSpan.classList.add('text-warning');
        } else {
            remainingSpan.classList.add('text-success');
        }
    }
}

monetizationCheckbox.addEventListener('change', toggleMonetizationOptions);
toggleMonetizationOptions();

const warningTextElement = document.getElementById('monetization-warning');

const radioButtonOne = document.getElementById('option1');
const radioButtonTwo = document.getElementById('option2');
const radioButtonThree = document.getElementById('option3');
const redirectCheckbox = document.getElementById('redirectInstantly')

const monetizationElements = [monetizationCheckbox, radioButtonOne, redirectCheckbox, radioButtonTwo, radioButtonThree];
monetizationElements.forEach(element => {
    element.addEventListener('change', () => {
        if (!monetizationCheckbox.checked || redirectCheckbox.checked || !(radioButtonTwo.checked || radioButtonThree.checked)) {
            warningTextElement.textContent = "The current settings are not optimal for your income!";
        } else {
            warningTextElement.textContent = '';
        }
    });
});