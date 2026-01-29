import { isArray } from "chart.js/helpers";

const datePicker = document.querySelector('.calendar');
const rangeInput = document.getElementById('dateSelection');
const calendarContainer = datePicker.querySelector('.calendar');
const leftCalendar = datePicker.querySelector('.left-side');
const middleCalendar = datePicker.querySelector('.middle-side');
const rightCalendar = datePicker.querySelector('.right-side');

const prevButton = document.getElementById('prevButton');
const nextButton = document.getElementById('nextButton');
const selectionElement = document.getElementById('dateSelection');

const doneDates = document.body.dataset.doneDates;

let start = null;
let end = null;

let rightDate = new Date();
let middleDate = new Date(rightDate);
let leftDate = new Date(rightDate);

middleDate.setMonth(rightDate.getMonth() - 1);
leftDate.setMonth(rightDate.getMonth() - 2);

const formatDate = (date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');

    return `${y}-${m}-${d}`;
}

const createDateEl = (date, isDisabled, isToday) => {
    const span = document.createElement('span');
    span.textContent = date.getDate();
    span.classList.toggle('disabled', isDisabled);

    if (!isDisabled) {
        span.classList.toggle('today', isToday);
        span.setAttribute('data-date', formatDate(date))
    } else if (date.getDate() > 2 && date.getDate() < 30) {
        span.textContent = "";
    }

    span.addEventListener('click', handleDateClick);
    span.addEventListener('mouseover', handleDateMouseover);

    return span;
}

const displaySelection = () => {
    if (start && end) {
        const startDate = start.toLocaleDateString('uk');
        const endDate = end.toLocaleDateString('uk');

        selectionElement.value = `${startDate} - ${endDate}`;
    }
}

const applyHighlighting = () => {
    const dateElements = datePicker.querySelectorAll('span[data-date]');

    for (const dateElement of dateElements) {
        dateElement.classList.remove('range-start', 'range-end', 'in-range');
    }

    if (start) {
        const startDate = formatDate(start);
        const startElement = datePicker.querySelector(`span[data-date="${startDate}"]`);

        if (startElement) {
            startElement.classList.add('range-start');
            if (!end) startElement.classList.add('range-end');
        }
    }

    if (end) {
        const endDate = formatDate(end);
        const endElement = datePicker.querySelector(`span[data-date="${endDate}"]`);

        if (endElement) endElement.classList.add('range-end');
    }

    if (start && end) {
        for (const dateElement of dateElements) {
            const date = new Date(dateElement.dataset.date);
            if (date > start && date < end) {
                dateElement.classList.add('in-range');
            }
        }
    }

    if (isArray(doneDates) && doneDates.length > 0) {
        for (const dateElement of dateElements) {
            const date = new Date(dateElement.dataset.date);
            date.setHours(0, 0, 0, 0);

            if (doneDates.includes(date)) dateElement.classList.add('done');
        }
    }
}

const handleDateMouseover = (event) => {
    const hoverElement = event.target;

    if (start && !end) {
        applyHighlighting();
        const hoverDate = new Date(hoverElement.dataset.date);

        datePicker.querySelectorAll('span[data-date').forEach((dateElement) => {
            const date = new Date(dateElement.dataset.date);
            if (date > start && date < hoverDate && start < hoverDate) {
                dateElement.classList.add('in-range');
            }
        });
    }
}

const handleDateClick = (event) => {
    const dateElement = event.target;
    const selectedDate = new Date(dateElement.dataset.date);

    if (!start || (start && end)) {
        start = selectedDate;
        end = null;
    } else if (selectedDate < start) {
        start = selectedDate;
    } else {
        end = selectedDate;
    }

    applyHighlighting();
    displaySelection();
}

const renderCalendar = (calendar, year, month) => {
    const label = calendar.querySelector('.label');
    label.textContent = new Date(year, month).toLocaleString('en', { year: 'numeric', month: 'short' });

    const datesContainer = calendar.querySelector('.dates');
    datesContainer.innerHTML = '';

    const startDate = new Date(year, month, 1);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 42);

    const fragment = document.createDocumentFragment();

    while (startDate < endDate) {
        const isDisabled = startDate.getMonth() !== month;
        const isToday = formatDate(startDate) === formatDate(new Date());
        const dateElement = createDateEl(startDate, isDisabled, isToday);

        fragment.appendChild(dateElement);
        startDate.setDate(startDate.getDate() + 1);
    }

    datesContainer.appendChild(fragment);

    applyHighlighting();
}

const updateCalendars = () => {
    renderCalendar(rightCalendar, rightDate.getFullYear(), rightDate.getMonth());
    renderCalendar(middleCalendar, middleDate.getFullYear(), middleDate.getMonth());
    renderCalendar(leftCalendar, leftDate.getFullYear(), leftDate.getMonth());
}

prevButton.addEventListener('click', (e) => {
    leftDate.setMonth(leftDate.getMonth() - 1);
    middleDate.setMonth(middleDate.getMonth() - 1);
    rightDate.setMonth(rightDate.getMonth() - 1);

    updateCalendars();
})

nextButton.addEventListener('click', (e) => {
    leftDate.setMonth(leftDate.getMonth() + 1);
    middleDate.setMonth(middleDate.getMonth() + 1);
    rightDate.setMonth(rightDate.getMonth() + 1);

    updateCalendars();
})

updateCalendars();