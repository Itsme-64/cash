document.querySelectorAll('[data-group]').forEach(group => {
    const allCheckbox = group.querySelector('.group-all');
    const optionsDiv = group.querySelector('.group-options');
    const hiddenInput = group.querySelector('.group-hidden');
    const optionCheckboxes = optionsDiv.querySelectorAll('input[type="checkbox"]');

    allCheckbox.addEventListener('change', () => {
        if (allCheckbox.checked) {
            optionsDiv.classList.add('d-none');
            optionCheckboxes.forEach(cb => cb.checked = false);
            hiddenInput.value = 'all';
        } else {
            optionsDiv.classList.remove('d-none');
            hiddenInput.value = '';
        }
    });

    optionCheckboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            if (cb.checked) {
                allCheckbox.checked = false;
                optionsDiv.classList.remove('d-none');
                hiddenInput.value = '';
            }
        });
    });
});