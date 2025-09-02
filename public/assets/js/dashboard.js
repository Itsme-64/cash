(function($) {
  'use strict';
  $.fn.andSelf = function() {
    return this.addBack.apply(this, arguments);
  }
  $(function() {

    //check all boxes in order status 
    $("#check-all").click(function () {
      $(".form-check-input").prop('checked', $(this).prop('checked'));
    });

    if ($("#transaction-history").length) { 
      const doughnutChartCanvas = document.getElementById('transaction-history');
      new Chart(doughnutChartCanvas, {
        type: 'doughnut',
        data: {
          labels: ["Paypal", "Stripe","Cash"],
          datasets: [{
              data: [55, 25, 20],
              backgroundColor: [
                 "#111111","#00d25b","#ffab00",
              ],
              borderColor: "#191c24"
          }]
        },
        options: {
          cutout: 70,
          animationEasing: "easeOutBounce",
          animateRotate: true,
          animateScale: false,
          responsive: true,
          maintainAspectRatio: true,
          showScale: false,
          legend: false,
          plugins: {
            legend: {
                display: false,
            },
          },
        },
      });
    }
    if ($("#currentBalanceCircle").length) { 
      var bar = new ProgressBar.Circle(currentBalanceCircle, {
        color: '#ccc',
        // This has to be the same size as the maximum width to
        // prevent clipping
        strokeWidth: 12,
        trailWidth: 12,
        trailColor: '#0d0d0d',
        easing: 'easeInOut',
        duration: 1400,
        text: {
          autoStyleContainer: false,
        },
        from: { color: '#d53f3a', width: 12 },
        to: { color: '#d53f3a', width: 12 },
        // Set default step function for all animate calls
        step: function(state, circle) {
          circle.path.setAttribute('stroke', state.color);
          circle.path.setAttribute('stroke-width', state.width);
      
          var value = Math.round(circle.value() * 100);
          circle.setText('');
      
        }
      });

      bar.text.style.fontSize = '1.5rem';

      bar.animate(0.4);  // Number from 0.0 to 1.0
    }
  });
})(jQuery);
