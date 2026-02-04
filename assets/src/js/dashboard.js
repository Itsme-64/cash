const chartElement = document.getElementById('periodChart')
const series = JSON.parse(chartElement.dataset.chart);

const total = series.reduce((a,b) => a+b, 0);
const finalSeries = total === 0 ? [1] : series;

const options = {
    chart: {
        height: '180%',
        width: '100%',
        type: 'donut',
        background: 'transparent',
        foreColor: '#e0e0e0'
    },
    series: finalSeries,
    labels: total === 0 ? ['No data available'] : ['Pending', 'User Income', 'Referral'],
    fill: {
        colors: total === 0 ? ['tomato'] : ['#6c757d', '#495057', '#343a40']
    },
    legend: { 
        position: 'bottom',
        horizontalAlign: 'center',
        onItemClick: {
            toggleDataSeries: false
        },
        itemMargin: {
            vertical: 5
        },
        markers: {
            strokeWidth: 0
        }
    },
    dataLabels: {
        enabled: false
    }
};

const chart = new ApexCharts(chartElement, options);

chart.render();