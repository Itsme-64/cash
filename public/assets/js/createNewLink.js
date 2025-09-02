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

function toggleMonetizationOptions() {
    monetizationOptions.style.display = monetizationCheckbox.checked ? 'block' : 'none';
}

monetizationCheckbox.addEventListener('change', toggleMonetizationOptions);

// Initialize state on page load
toggleMonetizationOptions();