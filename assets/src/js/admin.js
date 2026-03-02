const weightsChartElement = document.getElementById("weightsChart");

const weightSeries = JSON.parse(weightsChartElement.dataset.weights).flat();
const datesLabels = JSON.parse(weightsChartElement.dataset.dates).flat();

console.log(weightSeries)
console.log(datesLabels)

const options = {
    series: [{
        name: 'Weights',
        type: 'line',
        data: weightSeries
    }],
    labels: datesLabels,
    chart: {
        type: 'line',
        height: '150%',
        width: '100%',
        background: 'transparent',
        foreColor: '#e0e0e0',
        toolbar: {
            show: false
        },
        zoom: {
            disabled: true,
            allowMouseWheelZoom: false
        }
    },
    stroke: {
        curve: 'smooth'
    },
    fill: {
        type:'solid',
        colors: ['#0090e7']
    },
    yaxis: [{
        min: 0,
        title: {
            text: 'value'
        }
    }],
    tooltip: {
        shared: true,
        intersect: false,
        theme: 'dark',
    },
    legend: {
        markers: {
            strokeWidth: 0
        },
        onItemClick: {
            toggleDataSeries: false
        },
        position: 'bottom'
    }
};

const chart = new ApexCharts(weightsChartElement, options);

chart.render();