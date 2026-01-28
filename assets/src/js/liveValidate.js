const inputs = document.querySelectorAll('input.countedInput');
const counters = document.querySelectorAll('small.counter');

inputs.forEach((input, i) => {
    const counter = counters[i];
    const minLength = input.minLength;

    input.addEventListener('input', () => {
        const length = input.value.length;
        counter.textContent = length - minLength;

        if (length < minLength) {
            counter.classList.remove('text-success');
            counter.classList.add('text-danger');
        } else {
            counter.classList.remove('text-danger');
            counter.classList.add('text-success');
        }
    });
});