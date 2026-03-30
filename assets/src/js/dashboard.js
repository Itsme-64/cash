const chartElement = document.getElementById('periodChart')
const series = JSON.parse(chartElement.dataset.chart);

const total = (series.reduce((a,b) => a+b, 0)) / 1000000;
const finalSeries = (total === 0 ? [1] : series).map(x => Number((x / 10000).toFixed(4)));

let pendingLabel = '0';
let userIncomeLabel = '0';
let referralLabel = '0';

if (total !== 0) {
    pendingLabel = String((finalSeries[0] / total).toFixed(0));
    userIncomeLabel = String((finalSeries[1] / total).toFixed(0));
    referralLabel = String((finalSeries[2] / total).toFixed(0));
}

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
        },
        formatter: function(seriesName, opts) {
            let value = '';
            if (seriesName == 'Pending') value = pendingLabel;
            else if (seriesName == 'User Income') value = userIncomeLabel;
            else if (seriesName == 'Referral') value = referralLabel;
            
            return `${seriesName} (${value}%)`;
        }
    },
    dataLabels: {
        enabled: false
    }
};

const chart = new ApexCharts(chartElement, options);

chart.render();