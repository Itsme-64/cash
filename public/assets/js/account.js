const toggle = document.getElementById('editToggle');
const formInputs = document.querySelectorAll('#formInputs input, #formInputs select, #formInputs button');
const submitBtn = document.getElementById('submitBtn');

toggle.addEventListener('change', () => {
  const enabled = toggle.checked;
  formInputs.forEach(input => {
    if (input.id !== 'file-name-display') {
      input.disabled = !enabled;
    }
  });
  submitBtn.disabled = !enabled;
});