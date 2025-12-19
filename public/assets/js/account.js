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

const payoutSelect = document.getElementById('payoutMethod');
const paypalGroup = document.getElementById('paypalFormGroup');
const btcGroup = document.getElementById('btcFormGroup');

function updatePaymentInputs() {
  const value = payoutSelect.value;
  paypalGroup.style.display = value === 'PayPal' ? 'block' : 'none';
  btcGroup.style.display = value === 'Bitcoin' ? 'block' : 'none';
}

payoutSelect.addEventListener('change', updatePaymentInputs);

updatePaymentInputs();