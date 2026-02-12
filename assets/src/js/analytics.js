const mainChartElement = document.getElementById('mainChart');

const revenueSeries = JSON.parse(mainChartElement.dataset.revenue);
const clickSeries = JSON.parse(mainChartElement.dataset.clicks);
const dateSeries = JSON.parse(mainChartElement.dataset.dates);

const formattedRevenue = revenueSeries
    .flat()
    .map(n => (n / 10000).toFixed(4));

const formattedClicks = clickSeries.flat();

const formattedDates = dateSeries
    .flat()
    .map(d => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }));
    

const options = {
    series: [{
        name: 'Earnings',
        type: 'area',
        data: formattedRevenue
    }, {
        name: 'Clicks',
        type: 'line',
        data: formattedClicks
    }],
    labels: formattedDates,
    chart: {
        type: 'line',
        height: '250%',
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
        opacity: [0.35, 1],
        colors: ['#00d25b', '#0090e7']
    },
    yaxis: [{
        min: 0,
        title: {
            text: 'Earnings'
        },
        labels: {
            formatter: (value) => {
                return '$' + value.toFixed(2);
            }
        }
    }, {
        min: 0,
        opposite: true,
        title: {
            text: 'Clicks'
        }
    }],
    tooltip: {
        shared: true,
        intersect: false,
        theme: 'dark',
        y: {
            formatter: function (value, { seriesIndex, w }) {
                if (value === undefined) return value;

                const seriesName = w.config.series[seriesIndex].name;

                if (seriesName === 'Earnings') {
                    return '≈ $' + value.toFixed(0);
                }

                if (seriesName === 'Clicks') {
                    return value.toFixed(0);
                }

                return value;
            }
        }
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

const chart = new ApexCharts(mainChartElement, options);

chart.render();