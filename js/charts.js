/**
 * charts.js - Chart.js Visualizations for HishabNikash
 * Renders Expense by Category (Doughnut/Pie) and Cash Flow & Loan Distribution (Bar Chart).
 * Clean, matte, professional fintech palette without neon glows.
 */

class ChartManager {
  constructor() {
    this.expenseChart = null;
    this.cashflowChart = null;
  }

  getThemeColors() {
    const isDark = document.documentElement.classList.contains('dark');
    return {
      textColor: isDark ? '#94A3B8' : '#475569',
      gridColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
      tooltipBg: isDark ? '#0F172A' : '#1E293B',
      tooltipText: '#F8FAFC',
      borderColor: isDark ? '#1E293B' : '#FFFFFF',
    };
  }

  formatCurrency(value) {
    return '৳ ' + Number(value || 0).toLocaleString('en-IN');
  }

  initCharts() {
    try {
      this.renderExpenseChart();
      this.renderCashflowChart();
    } catch (err) {
      console.warn('Charts init error:', err);
    }
  }

  updateCharts() {
    try {
      this.renderExpenseChart();
      this.renderCashflowChart();
    } catch (err) {
      console.warn('Charts update error:', err);
    }
  }

  renderExpenseChart() {
    const canvas = document.getElementById('expenseCategoryChart');
    if (!canvas) return;

    // Check if element is in DOM
    const breakdown = window.appStore.getCategoryExpenseBreakdown();
    const theme = this.getThemeColors();

    if (this.expenseChart) {
      try {
        this.expenseChart.destroy();
      } catch (e) {
        // Ignore destroy error
      }
      this.expenseChart = null;
    }

    const hasData = breakdown.data.length > 0 && breakdown.data.some(v => v > 0);

    const emptyData = {
      labels: ['No Expenses Recorded'],
      datasets: [{
        data: [1],
        backgroundColor: [document.documentElement.classList.contains('dark') ? '#334155' : '#E2E8F0'],
        borderWidth: 0,
      }]
    };

    const actualData = {
      labels: breakdown.labels,
      datasets: [{
        data: breakdown.data,
        backgroundColor: breakdown.colors,
        borderWidth: 2,
        borderColor: theme.borderColor,
        hoverOffset: 4,
      }]
    };

    const config = {
      type: 'doughnut',
      data: hasData ? actualData : emptyData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 10,
              padding: 10,
              color: theme.textColor,
              font: {
                family: 'Inter, Hind Siliguri, sans-serif',
                size: 11,
              }
            }
          },
          tooltip: {
            enabled: hasData,
            backgroundColor: theme.tooltipBg,
            titleColor: theme.tooltipText,
            bodyColor: theme.tooltipText,
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const val = context.raw || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                return ` ${label}: ${this.formatCurrency(val)} (${pct}%)`;
              }
            }
          }
        },
        cutout: '70%',
      }
    };

    this.expenseChart = new Chart(canvas, config);

    const centerEl = document.getElementById('expenseChartCenterTotal');
    if (centerEl) {
      const totalExp = breakdown.data.reduce((a, b) => a + b, 0);
      centerEl.textContent = this.formatCurrency(totalExp);
    }
  }

  renderCashflowChart() {
    const canvas = document.getElementById('cashflowBarChart');
    if (!canvas) return;

    const cashflow = window.appStore.getCashFlowDistribution();
    const theme = this.getThemeColors();

    if (this.cashflowChart) {
      try {
        this.cashflowChart.destroy();
      } catch (e) {
        // Ignore destroy error
      }
      this.cashflowChart = null;
    }

    const config = {
      type: 'bar',
      data: {
        labels: cashflow.labels,
        datasets: [{
          label: 'Amount (BDT ৳)',
          data: cashflow.data,
          backgroundColor: ['#10B981', '#EF4444', '#2563EB', '#D97706'], // matte clean colors
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 40,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: theme.tooltipBg,
            titleColor: theme.tooltipText,
            bodyColor: theme.tooltipText,
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (context) => ` ${this.formatCurrency(context.raw)}`
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: theme.textColor,
              font: {
                family: 'Inter, Hind Siliguri, sans-serif',
                size: 11,
              }
            }
          },
          y: {
            grid: {
              color: theme.gridColor,
            },
            ticks: {
              color: theme.textColor,
              font: {
                family: 'Inter, sans-serif',
                size: 10,
              },
              callback: (value) => '৳' + (value >= 1000 ? (value / 1000) + 'k' : value)
            }
          }
        }
      }
    };

    this.cashflowChart = new Chart(canvas, config);
  }
}

window.chartManager = new ChartManager();
