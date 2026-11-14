/**
 * app.js - Main Application Controller for HishabNikash
 * Handles tab navigation, dashboard metrics, theme toggling, toasts, and data backup.
 */

class AppController {
  constructor() {
    this.currentTab = 'dashboard';
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    this.setupTheme();
    this.setupNavigation();
    this.setupDashboardPeriodSelector();
    this.setupDataBackupHandlers();
    this.setupKeyboardShortcuts();
    this.setupBackdropClickHandlers();

    // Subscribe to store updates with isolated error handling
    window.appStore.subscribe(() => {
      try { this.updateDashboardMetrics(); } catch (e) { console.error('Dashboard metrics error:', e); }
      try { this.updateWalletWidgets(); } catch (e) { console.error('Wallet widgets error:', e); }
      try { this.updateUpcomingDueAlerts(); } catch (e) { console.error('Due alerts error:', e); }
      try { if (window.chartManager) window.chartManager.updateCharts(); } catch (e) { console.error('Chart update error:', e); }
      try { if (window.loanManager) window.loanManager.render(); } catch (e) { console.error('Loan render error:', e); }
      try { if (window.transactionManager) window.transactionManager.render(); } catch (e) { console.error('Transaction render error:', e); }
    });

    // Initial calculations & renders
    try { this.updateDashboardMetrics(); } catch (e) {}
    try { this.updateWalletWidgets(); } catch (e) {}
    try { this.updateUpcomingDueAlerts(); } catch (e) {}

    // Initialize submodules
    if (window.chartManager) window.chartManager.initCharts();
    if (window.loanManager) window.loanManager.init();
    if (window.transactionManager) window.transactionManager.init();

    this.switchTab('dashboard');
  }

  // Dark Mode Setup
  setupTheme() {
    const isDark = window.appStore.settings.darkMode || 
      (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const themeToggleBtns = document.querySelectorAll('.theme-toggle-btn');
    themeToggleBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const currentlyDark = document.documentElement.classList.contains('dark');
        const nextDark = !currentlyDark;
        if (nextDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        window.appStore.settings.darkMode = nextDark;
        window.appStore.save();
        if (window.chartManager) window.chartManager.updateCharts();
      });
    });
  }

  // Navigation (Tabs)
  setupNavigation() {
    const navButtons = document.querySelectorAll('[data-nav-target]');
    navButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const target = btn.getAttribute('data-nav-target');
        this.switchTab(target);
      });
    });
  }

  switchTab(tabId) {
    this.currentTab = tabId;

    const views = document.querySelectorAll('.tab-view');
    views.forEach(v => {
      if (v.id === `tab-${tabId}`) {
        v.classList.remove('hidden');
      } else {
        v.classList.add('hidden');
      }
    });

    const navButtons = document.querySelectorAll('[data-nav-target]');
    navButtons.forEach(btn => {
      const target = btn.getAttribute('data-nav-target');
      const isDesktop = btn.classList.contains('desktop-nav-link');
      const isMobile = btn.classList.contains('mobile-nav-link');

      if (target === tabId) {
        if (isDesktop) {
          btn.className = 'desktop-nav-link px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 transition-all flex items-center gap-2 shadow-sm';
        }
        if (isMobile) {
          btn.className = 'mobile-nav-link flex flex-col items-center justify-center text-blue-600 dark:text-blue-400 font-semibold';
        }
      } else {
        if (isDesktop) {
          btn.className = 'desktop-nav-link px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-2';
        }
        if (isMobile) {
          btn.className = 'mobile-nav-link flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 font-medium';
        }
      }
    });

    if (tabId === 'dashboard' && window.chartManager) {
      setTimeout(() => window.chartManager.updateCharts(), 60);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Dashboard Period Selector (Syncs across desktop and mobile selectors)
  setupDashboardPeriodSelector() {
    const handlePeriodChange = (val) => {
      window.appStore.settings.selectedPeriod = val;
      window.appStore.save();
      this.updateDashboardMetrics();
      if (window.chartManager) window.chartManager.updateCharts();

      // Sync both dropdowns if present
      const selDesktop = document.getElementById('dashboardPeriodSelect');
      const selMobile = document.getElementById('dashboardPeriodSelectMobile');
      if (selDesktop && selDesktop.value !== val) selDesktop.value = val;
      if (selMobile && selMobile.value !== val) selMobile.value = val;
    };

    const periodSelect = document.getElementById('dashboardPeriodSelect');
    if (periodSelect) {
      periodSelect.value = window.appStore.settings.selectedPeriod || 'this_month';
      periodSelect.addEventListener('change', (e) => handlePeriodChange(e.target.value));
    }

    const periodSelectMobile = document.getElementById('dashboardPeriodSelectMobile');
    if (periodSelectMobile) {
      periodSelectMobile.value = window.appStore.settings.selectedPeriod || 'this_month';
      periodSelectMobile.addEventListener('change', (e) => handlePeriodChange(e.target.value));
    }
  }

  // Update Top 5 Summary Cards
  updateDashboardMetrics() {
    const period = window.appStore.settings.selectedPeriod || 'this_month';
    const metrics = window.appStore.getOverviewMetrics(period);

    const incomeEl = document.getElementById('statTotalIncome');
    if (incomeEl) incomeEl.textContent = '৳ ' + metrics.periodIncome.toLocaleString('en-IN');

    const expenseEl = document.getElementById('statTotalExpense');
    if (expenseEl) expenseEl.textContent = '৳ ' + metrics.periodExpense.toLocaleString('en-IN');

    const balanceEl = document.getElementById('statNetWalletBalance');
    if (balanceEl) {
      balanceEl.textContent = (metrics.totalWalletBalance < 0 ? '-' : '') + '৳ ' + Math.abs(metrics.totalWalletBalance).toLocaleString('en-IN');
      if (metrics.totalWalletBalance < 0) {
        balanceEl.classList.add('text-rose-600', 'dark:text-rose-400');
        balanceEl.classList.remove('text-slate-900', 'dark:text-white');
      } else {
        balanceEl.classList.remove('text-rose-600', 'dark:text-rose-400');
        balanceEl.classList.add('text-slate-900', 'dark:text-white');
      }
    }

    const collectEl = document.getElementById('statTotalToCollect');
    if (collectEl) collectEl.textContent = '৳ ' + metrics.totalToCollect.toLocaleString('en-IN');

    const repayEl = document.getElementById('statTotalToRepay');
    if (repayEl) repayEl.textContent = '৳ ' + metrics.totalToRepay.toLocaleString('en-IN');

    const savingsEl = document.getElementById('statNetPeriodSavings');
    if (savingsEl) {
      const net = metrics.periodIncome - metrics.periodExpense;
      savingsEl.textContent = (net >= 0 ? '+' : '-') + '৳ ' + Math.abs(net).toLocaleString('en-IN');
      savingsEl.className = `font-bold text-xs sm:text-sm ${net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`;
    }

    const periodLabels = {
      this_month: 'This Month (চলতি মাস)',
      last_30_days: 'Last 30 Days (গত ৩০ দিন)',
      this_year: 'This Year (চলতি বছর)',
      all_time: 'All Time (সব সময়)',
    };
    const activePeriodName = periodLabels[period] || 'This Month';
    document.querySelectorAll('.active-period-label').forEach(el => {
      el.textContent = activePeriodName;
    });

    this.updateDashboardRecentTxns();
  }

  // Update Individual Wallet Widgets
  updateWalletWidgets() {
    const metrics = window.appStore.getOverviewMetrics();
    const dashboardContainer = document.getElementById('dashboardWalletBreakdown');
    
    if (dashboardContainer) {
      dashboardContainer.innerHTML = WALLETS.map(w => {
        const bal = metrics.walletBalances[w.id] || 0;
        return `
          <div class="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg ${w.color} text-white flex items-center justify-center text-xs shadow-sm">
                <i class="fa-solid ${w.icon}"></i>
              </div>
              <div>
                <h4 class="text-xs font-semibold text-slate-800 dark:text-slate-200">${w.name.split(' (')[0]}</h4>
                <span class="text-[10px] text-slate-400">${w.name.includes('(') ? w.name.split('(')[1].replace(')', '') : ''}</span>
              </div>
            </div>
            <div class="text-right">
              <span class="text-xs sm:text-sm font-bold ${bal < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}">
                ৳ ${bal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        `;
      }).join('');
    }

    // Update Tab 4: Detailed Wallets View
    const detailedContainer = document.getElementById('detailedWalletsGrid');
    const totalBalanceEl = document.getElementById('walletsTabTotalBalance');
    if (totalBalanceEl) {
      totalBalanceEl.textContent = '৳ ' + metrics.totalWalletBalance.toLocaleString('en-IN');
      if (metrics.totalWalletBalance < 0) {
        totalBalanceEl.classList.add('text-rose-600', 'dark:text-rose-400');
        totalBalanceEl.classList.remove('text-slate-900', 'dark:text-white');
      } else {
        totalBalanceEl.classList.remove('text-rose-600', 'dark:text-rose-400');
        totalBalanceEl.classList.add('text-slate-900', 'dark:text-white');
      }
    }

    if (detailedContainer) {
      detailedContainer.innerHTML = WALLETS.map(w => {
        const bal = metrics.walletBalances[w.id] || 0;
        let totalIn = 0;
        let totalOut = 0;
        let count = 0;

        window.appStore.transactions.forEach(t => {
          if (t.wallet === w.id) {
            count++;
            const amt = t.amount || 0;
            if (t.type === 'income' || t.type === 'borrowed' || t.type === 'lent_repayment') {
              totalIn += amt;
            } else {
              totalOut += amt;
            }
          }
        });

        return `
          <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
            <div>
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl ${w.color} text-white flex items-center justify-center text-base shadow-sm">
                    <i class="fa-solid ${w.icon}"></i>
                  </div>
                  <div>
                    <h3 class="font-bold text-slate-900 dark:text-white text-base">${w.name.split(' (')[0]}</h3>
                    <span class="text-xs text-slate-400">${w.name.includes('(') ? w.name.split('(')[1].replace(')', '') : ''} • ${count} transaction${count !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>

              <!-- Balance Display -->
              <div class="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-700/60">
                <span class="text-xs text-slate-500 dark:text-slate-400 block mb-0.5">Current Available Balance:</span>
                <span class="text-xl sm:text-2xl font-black ${bal < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}">
                  ${bal < 0 ? '-' : ''}৳ ${Math.abs(bal).toLocaleString('en-IN')}
                </span>
              </div>

              <!-- Flow In & Out -->
              <div class="grid grid-cols-2 gap-2 mt-3 text-xs">
                <div class="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
                  <span class="text-[10px] text-emerald-600 dark:text-emerald-400 block font-semibold">Total In (জমা)</span>
                  <span class="font-bold">+৳ ${totalIn.toLocaleString('en-IN')}</span>
                </div>
                <div class="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300">
                  <span class="text-[10px] text-rose-600 dark:text-rose-400 block font-semibold">Total Out (খরচ)</span>
                  <span class="font-bold">-৳ ${totalOut.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <!-- Footer Actions -->
            <div class="mt-5 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
              <button 
                type="button" 
                onclick="window.app.filterByWalletAndGoToTransactions('${w.id}')"
                class="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-1.5"
              >
                <i class="fa-solid fa-receipt"></i> View Transactions
              </button>
              <button 
                type="button" 
                onclick="window.transactionManager.openAddModal({ wallet: '${w.id}' })"
                class="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <i class="fa-solid fa-plus"></i> Add New
              </button>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  filterByWalletAndGoToTransactions(walletId) {
    if (window.transactionManager) {
      window.transactionManager.walletFilter = walletId;
      const sel = document.getElementById('txnFilterWallet');
      if (sel) sel.value = walletId;
      window.transactionManager.currentPage = 1;
      window.transactionManager.render();
    }
    this.switchTab('transactions');
  }

  // Update Dashboard Recent Transactions
  updateDashboardRecentTxns() {
    const container = document.getElementById('dashboardRecentTxnList');
    if (!container) return;

    const recent = window.appStore.transactions.slice(0, 5);

    if (recent.length === 0) {
      container.innerHTML = `
        <div class="py-8 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
          <p>No transactions yet.</p>
          <button 
            type="button" 
            onclick="window.transactionManager.openAddModal()" 
            class="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition"
          >
            + Add First Transaction
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = recent.map(t => {
      const typeMeta = TRANSACTION_TYPES[t.type] || { label: t.type, badgeClass: 'bg-slate-100 text-slate-800', icon: 'fa-circle' };
      const isPositive = (t.type === 'income' || t.type === 'borrowed' || t.type === 'lent_repayment');
      const amountColor = isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white';
      const amountPrefix = isPositive ? '+' : '-';
      const walletObj = WALLETS.find(w => w.id === t.wallet) || { name: t.wallet };

      return `
        <div class="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center text-xs ${typeMeta.badgeClass}">
              <i class="fa-solid ${typeMeta.icon}"></i>
            </div>
            <div>
              <p class="text-xs font-bold text-slate-800 dark:text-slate-200">
                ${t.person || t.sourceDest || typeMeta.label}
              </p>
              <div class="flex items-center gap-2 text-[11px] text-slate-400">
                <span>${new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                <span>•</span>
                <span>${walletObj.name.split(' (')[0]}</span>
              </div>
            </div>
          </div>
          <div class="text-right">
            <span class="text-xs font-bold ${amountColor}">
              ${amountPrefix}৳ ${t.amount.toLocaleString('en-IN')}
            </span>
            <span class="block text-[10px] text-slate-400 font-medium">${typeMeta.bengali}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  // Update Upcoming / Overdue Loan alerts
  updateUpcomingDueAlerts() {
    const container = document.getElementById('dashboardDueAlertsList');
    if (!container) return;

    const people = window.appStore.getPeopleLedger().filter(p => p.status !== 'settled' && p.latestDueDate);

    if (people.length === 0) {
      container.innerHTML = `
        <div class="py-6 text-center text-slate-400 text-xs flex flex-col items-center">
          <i class="fa-solid fa-circle-check text-2xl text-emerald-500 mb-2"></i>
          <span>No upcoming or overdue settlements. All settled!</span>
        </div>
      `;
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    container.innerHTML = people.map(p => {
      const dueDate = new Date(p.latestDueDate);
      const isOverdue = dueDate < today;
      const daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

      return `
        <div class="p-3 rounded-xl border ${isOverdue ? 'border-rose-200 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-950/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'} flex items-center justify-between gap-2">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg ${isOverdue ? 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-750 dark:text-slate-300'} flex items-center justify-center text-xs">
              <i class="fa-solid ${isOverdue ? 'fa-triangle-exclamation' : 'fa-calendar'}"></i>
            </div>
            <div>
              <p class="text-xs font-bold text-slate-800 dark:text-slate-100">${p.name}</p>
              <span class="text-[11px] ${isOverdue ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-slate-500 dark:text-slate-400'}">
                ${isOverdue ? `Overdue by ${Math.abs(daysDiff)}d (${p.latestDueDate})` : `Due: ${p.latestDueDate} (${daysDiff}d left)`}
              </span>
            </div>
          </div>
          <div class="text-right">
            <span class="text-xs font-bold ${p.status === 'owes_you' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}">
              ৳ ${p.netBalance.toLocaleString('en-IN')}
            </span>
            <button 
              onclick="window.loanManager.openSettleModal('${encodeURIComponent(p.name)}', ${p.netBalance}, '${p.status === 'owes_you' ? 'receive' : 'pay'}')"
              class="block text-[10px] text-blue-600 dark:text-blue-400 hover:underline mt-0.5"
            >
              Settle
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Backup, CSV Export & Demo handlers
  setupDataBackupHandlers() {
    const importFileInput = document.getElementById('importBackupFileInput');
    if (importFileInput) {
      importFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          const result = window.appStore.importJSONBackup(event.target.result);
          if (result.success) {
            this.showToast(`Restored ${result.count} transactions!`, 'success');
            this.closeBackupModal();
          } else {
            this.showToast('Failed to import backup: ' + result.error, 'error');
          }
        };
        reader.readAsText(file);
      });
    }

    const resetDemoBtn = document.getElementById('resetDemoDataBtn');
    if (resetDemoBtn) {
      resetDemoBtn.addEventListener('click', () => {
        if (confirm('Reload realistic sample demo data? Your current data will be replaced.')) {
          window.appStore.resetToDemo();
          this.showToast('Sample data loaded!', 'success');
          this.closeBackupModal();
        }
      });
    }

    const clearAllBtn = document.getElementById('clearAllDataBtn');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        if (confirm('CAUTION: Are you sure you want to permanently clear all data?')) {
          window.appStore.clearAll();
          this.showToast('All transaction and loan records cleared', 'info');
          this.closeBackupModal();
        }
      });
    }
  }

  openBackupModal() {
    const modal = document.getElementById('dataBackupModal');
    if (modal) {
      modal.style.display = 'flex';
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
  }

  closeBackupModal() {
    const modal = document.getElementById('dataBackupModal');
    if (modal) {
      modal.style.display = 'none';
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  }

  setupBackdropClickHandlers() {
    const backupModal = document.getElementById('dataBackupModal');
    if (backupModal) {
      backupModal.addEventListener('click', (e) => {
        if (e.target === backupModal) {
          this.closeBackupModal();
        }
      });
    }
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        window.transactionManager.closeModal();
        window.transactionManager.closeDeleteModal();
        window.loanManager.closeSettleModal();
        window.loanManager.closePersonHistoryModal();
        this.closeBackupModal();
      }
      if (e.key === 'n' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        window.transactionManager.openAddModal();
      }
    });
  }

  // Toast Notification System (Placed safely at bottom-right)
  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    const bgColors = {
      success: 'bg-slate-900 dark:bg-slate-800 text-white border-l-4 border-emerald-500',
      error: 'bg-slate-900 dark:bg-slate-800 text-white border-l-4 border-rose-500',
      info: 'bg-slate-900 dark:bg-slate-800 text-white border-l-4 border-blue-500',
    };
    const icons = {
      success: 'fa-circle-check text-emerald-400',
      error: 'fa-circle-exclamation text-rose-400',
      info: 'fa-circle-info text-blue-400',
    };

    toast.className = `flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-xs font-semibold ${bgColors[type] || bgColors.info} transform transition-all duration-200 translate-y-2 opacity-0 pointer-events-auto border border-slate-700`;
    toast.innerHTML = `
      <i class="fa-solid ${icons[type] || icons.info} text-sm"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    });

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 250);
    }, 3000);
  }
}

window.app = new AppController();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.app.init());
} else {
  window.app.init();
}
