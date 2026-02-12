const chartElement = document.getElementById('chart');

const dateSeries = JSON.parse(chartElement.dataset.dates);
const valueSeries = JSON.parse(chartElement.dataset.values);

const options = {
    title: {
        text: 'Average cost per 1000 impressions'
    },
    series: [{
        data: valueSeries.flat(),
        name: 'CPM'
    }],
    xaxis: {
        categories: dateSeries.flat()
    },
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
    colors: ['#0090e7'],
    stroke: {
        curve: 'smooth'
    },
    grid: {
        borderColor: '#2a2f38',
        strokeDashArray: 3
    },
    yaxis: {
        min: 0,
        title: {
            text: 'Average CPM'
        },
        labels: {
            formatter: (value) => {
                return '$' + value.toFixed(2);
            }
        }
    },
    tooltip: {
        theme: 'dark',
        y: {
            formatter: function (value) {
                if (value === undefined) return value;

                return '≈ $' + value.toFixed(2);
            }
        }
    },
    legend: {
        markers: {
            strokeWidth: 0
        }
    }
};

const chart = new ApexCharts(chartElement, options);

chart.render();