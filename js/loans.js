/**
 * loans.js - Dedicated Loan & Debt Ledger Module (ধার দেনার হিসাব)
 * Manages people list, net balances, settlement modal, and counterparty histories.
 */

class LoanLedgerManager {
  constructor() {
    this.currentFilter = 'all';
    this.searchQuery = '';
    this.activePersonHistory = null;
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) {
      this.render();
      return;
    }
    this.setupEventListeners();
    this.render();
    this.isInitialized = true;
  }

  setupEventListeners() {
    // Filter buttons
    const filterBtns = document.querySelectorAll('[data-loan-filter]');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        filterBtns.forEach(b => {
          b.classList.remove('bg-blue-600', 'text-white', 'dark:bg-blue-600');
          b.classList.add('bg-slate-100', 'text-slate-600', 'dark:bg-slate-800', 'dark:text-slate-300');
        });
        btn.classList.add('bg-blue-600', 'text-white', 'dark:bg-blue-600');
        btn.classList.remove('bg-slate-100', 'text-slate-600', 'dark:bg-slate-800', 'dark:text-slate-300');
        
        this.currentFilter = btn.getAttribute('data-loan-filter');
        this.render();
      });
    });

    // Search input
    const searchInput = document.getElementById('loanSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.render();
      });
    }

    // Settlement Form Submit
    const settleForm = document.getElementById('settleDebtForm');
    if (settleForm) {
      settleForm.addEventListener('submit', (e) => this.handleSettlementSubmit(e));
    }

    // Modal backdrop click to close
    const settleModal = document.getElementById('settleDebtModal');
    if (settleModal) {
      settleModal.addEventListener('click', (e) => {
        if (e.target === settleModal) {
          this.closeSettleModal();
        }
      });
    }

    const historyModal = document.getElementById('personHistoryModal');
    if (historyModal) {
      historyModal.addEventListener('click', (e) => {
        if (e.target === historyModal) {
          this.closePersonHistoryModal();
        }
      });
    }
  }

  render() {
    const container = document.getElementById('loanLedgerGrid');
    if (!container) return;

    let ledger = window.appStore.getPeopleLedger();

    // Summary banner values
    const metrics = window.appStore.getOverviewMetrics('all_time');
    const toCollectEl = document.getElementById('loanSummaryToCollect');
    const toRepayEl = document.getElementById('loanSummaryToRepay');
    const netPositionEl = document.getElementById('loanSummaryNetPosition');
    const activeCountEl = document.getElementById('loanActiveCountBadge');

    if (toCollectEl) toCollectEl.textContent = '৳ ' + metrics.totalToCollect.toLocaleString('en-IN');
    if (toRepayEl) toRepayEl.textContent = '৳ ' + metrics.totalToRepay.toLocaleString('en-IN');
    
    if (netPositionEl) {
      const net = metrics.totalToCollect - metrics.totalToRepay;
      if (net > 0) {
        netPositionEl.innerHTML = `<span class="text-emerald-600 dark:text-emerald-400 font-semibold"><i class="fa-solid fa-arrow-down-left mr-1"></i> Net Receivable: ৳ ${net.toLocaleString('en-IN')} (আপনি পাবেন)</span>`;
      } else if (net < 0) {
        netPositionEl.innerHTML = `<span class="text-rose-600 dark:text-rose-400 font-semibold"><i class="fa-solid fa-arrow-up-right mr-1"></i> Net Payable: ৳ ${Math.abs(net).toLocaleString('en-IN')} (আপনাকে দিতে হবে)</span>`;
      } else {
        netPositionEl.innerHTML = `<span class="text-slate-500 font-medium"><i class="fa-solid fa-check-double mr-1"></i> All debts settled! (কোনো ধার-দেনা বাকি নেই)</span>`;
      }
    }

    const activeCount = ledger.filter(p => p.status !== 'settled').length;
    if (activeCountEl) {
      activeCountEl.textContent = activeCount;
      activeCountEl.style.display = activeCount > 0 ? 'inline-flex' : 'none';
    }

    if (this.currentFilter !== 'all') {
      ledger = ledger.filter(p => p.status === this.currentFilter);
    }

    if (this.searchQuery) {
      ledger = ledger.filter(p => p.name.toLowerCase().includes(this.searchQuery));
    }

    if (ledger.length === 0) {
      container.innerHTML = `
        <div class="col-span-full py-12 text-center bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-8">
          <div class="w-14 h-14 mx-auto mb-3 bg-slate-100 dark:bg-slate-750 text-slate-500 rounded-full flex items-center justify-center text-xl">
            <i class="fa-solid fa-user-slash"></i>
          </div>
          <h4 class="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1">No Persons or Loans Found</h4>
          <p class="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
            ${this.searchQuery ? `No match found for "${this.searchQuery}". Try different keywords.` : `You don't have any loan or debt records matching this filter.`}
          </p>
          <button 
            type="button" 
            onclick="window.transactionManager.openAddModal({ type: 'lent' })"
            class="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition"
          >
            + Add Loan or Debt
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = ledger.map(person => this.renderPersonCard(person)).join('');
  }

  renderPersonCard(person) {
    const solidColors = [
      'bg-slate-700 text-white',
      'bg-blue-600 text-white',
      'bg-emerald-600 text-white',
      'bg-indigo-600 text-white',
      'bg-amber-600 text-white',
      'bg-purple-600 text-white',
    ];
    let hash = 0;
    for (let i = 0; i < person.name.length; i++) hash += person.name.charCodeAt(i);
    const avatarColor = solidColors[hash % solidColors.length];
    const initial = person.name.trim().charAt(0).toUpperCase();

    let statusBadge = '';
    let canSettle = false;
    let settleType = '';

    if (person.status === 'owes_you') {
      canSettle = true;
      settleType = 'receive';
      statusBadge = `
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <i class="fa-solid fa-arrow-down-left"></i> Owes You ৳ ${person.netBalance.toLocaleString('en-IN')} (পাওনা)
        </span>
      `;
    } else if (person.status === 'you_owe') {
      canSettle = true;
      settleType = 'pay';
      statusBadge = `
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          <i class="fa-solid fa-arrow-up-right"></i> You Owe ৳ ${person.netBalance.toLocaleString('en-IN')} (দেনা)
        </span>
      `;
    } else {
      statusBadge = `
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          <i class="fa-solid fa-check-circle text-slate-400"></i> Settled Up (হিসাব শেষ)
        </span>
      `;
    }

    let dueHtml = '';
    if (person.latestDueDate && person.status !== 'settled') {
      const dueDate = new Date(person.latestDueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isPast = dueDate < today;
      const daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

      if (isPast) {
        dueHtml = `
          <div class="mt-2.5 flex items-center text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-lg border border-rose-200 dark:border-rose-900">
            <i class="fa-solid fa-triangle-exclamation mr-1.5 text-xs"></i>
            <span>Overdue by ${Math.abs(daysDiff)} days (${person.latestDueDate})</span>
          </div>
        `;
      } else {
        dueHtml = `
          <div class="mt-2.5 flex items-center text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg">
            <i class="fa-regular fa-clock mr-1.5 text-blue-500"></i>
            <span>Due: <strong class="text-slate-800 dark:text-slate-200">${person.latestDueDate}</strong> (in ${daysDiff} days)</span>
          </div>
        `;
      }
    }

    return `
      <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between overflow-hidden">
        <div class="p-5">
          <!-- Header with Avatar and Status -->
          <div class="flex items-start justify-between gap-3 mb-4">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-xl ${avatarColor} flex items-center justify-center font-bold text-base shadow-sm">
                ${initial}
              </div>
              <div>
                <h3 class="font-bold text-slate-900 dark:text-white text-base leading-tight">${person.name}</h3>
                <span class="text-xs text-slate-500 dark:text-slate-400">${person.transactions.length} transaction${person.transactions.length > 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>

          <!-- Current Balance Badge -->
          <div class="mb-4">
            ${statusBadge}
          </div>

          <!-- Breakdown Grid -->
          <div class="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60">
            <div>
              <span class="text-slate-500 dark:text-slate-400 block mb-0.5">Lent (ধার দেওয়া)</span>
              <span class="font-semibold text-slate-800 dark:text-slate-200">৳ ${person.lent.toLocaleString('en-IN')}</span>
              <span class="text-[11px] text-emerald-600 dark:text-emerald-400 block mt-0.5">Repaid: ৳ ${person.lentRepaid.toLocaleString('en-IN')}</span>
            </div>
            <div class="border-l border-slate-200 dark:border-slate-700 pl-2">
              <span class="text-slate-500 dark:text-slate-400 block mb-0.5">Borrowed (নেওয়া)</span>
              <span class="font-semibold text-slate-800 dark:text-slate-200">৳ ${person.borrowed.toLocaleString('en-IN')}</span>
              <span class="text-[11px] text-blue-600 dark:text-blue-400 block mt-0.5">Repaid: ৳ ${person.borrowedRepaid.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <!-- Due Date alert -->
          ${dueHtml}
        </div>

        <!-- Action Footer -->
        <div class="bg-slate-50 dark:bg-slate-850/80 px-5 py-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
          <button 
            type="button" 
            onclick="window.loanManager.openPersonHistory('${encodeURIComponent(person.name)}')"
            class="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-750 transition"
          >
            <i class="fa-solid fa-list-check"></i> History
          </button>

          ${canSettle ? `
            <button 
              type="button" 
              onclick="window.loanManager.openSettleModal('${encodeURIComponent(person.name)}', ${person.netBalance}, '${settleType}')"
              class="text-xs font-semibold ${settleType === 'receive' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'} text-white py-1.5 px-3.5 rounded-lg shadow-sm transition flex items-center gap-1.5 active:scale-95"
            >
              <i class="fa-solid ${settleType === 'receive' ? 'fa-hand-holding-dollar' : 'fa-money-bill-transfer'}"></i>
              ${settleType === 'receive' ? 'Settle (আদায়)' : 'Settle (পরিশোধ)'}
            </button>
          ` : `
            <button 
              type="button" 
              onclick="window.loanManager.openNewLoanForPerson('${encodeURIComponent(person.name)}')"
              class="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 py-1.5 px-3 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 transition flex items-center gap-1"
            >
              <i class="fa-solid fa-plus"></i> New Loan
            </button>
          `}
        </div>
      </div>
    `;
  }

  // Open Settle Modal
  openSettleModal(encodedPerson, netBalance, type) {
    const person = decodeURIComponent(encodedPerson);
    const modal = document.getElementById('settleDebtModal');
    if (!modal) return;

    document.getElementById('settlePersonName').value = person;
    document.getElementById('settlePersonDisplay').textContent = person;
    document.getElementById('settleBalanceDisplay').textContent = '৳ ' + netBalance.toLocaleString('en-IN');
    document.getElementById('settleAmountInput').value = netBalance;
    document.getElementById('settleAmountInput').max = netBalance;
    document.getElementById('settleTypeInput').value = type;

    const titleEl = document.getElementById('settleModalTitle');
    const badgeEl = document.getElementById('settleTypeDescription');
    const noteEl = document.getElementById('settleNotesInput');

    if (type === 'receive') {
      titleEl.innerHTML = `<i class="fa-solid fa-hand-holding-dollar text-emerald-600 mr-2"></i> Record Repayment Received (ধার ফেরত গ্রহণ)`;
      badgeEl.className = 'text-xs px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-medium';
      badgeEl.textContent = `Money will be added to your selected wallet (+ balance)`;
      noteEl.value = `Repayment received from ${person}`;
    } else {
      titleEl.innerHTML = `<i class="fa-solid fa-money-bill-transfer text-amber-600 mr-2"></i> Record Debt Repayment Paid (ঋণ পরিশোধ)`;
      badgeEl.className = 'text-xs px-2.5 py-1 rounded bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-medium';
      badgeEl.textContent = `Money will be deducted from your selected wallet (- balance)`;
      noteEl.value = `Repayment paid to ${person}`;
    }

    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    document.getElementById('settleDateInput').value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;

    modal.style.display = 'flex';
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  closeSettleModal() {
    const modal = document.getElementById('settleDebtModal');
    if (modal) {
      modal.style.display = 'none';
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  }

  handleSettlementSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    const person = document.getElementById('settlePersonName').value;
    const amount = parseFloat(document.getElementById('settleAmountInput').value);
    const wallet = document.getElementById('settleWalletSelect').value;
    const type = document.getElementById('settleTypeInput').value;
    const date = document.getElementById('settleDateInput').value;
    const notes = document.getElementById('settleNotesInput').value;

    if (!amount || amount <= 0) {
      window.app.showToast('Please enter a valid settlement amount', 'error');
      return;
    }

    const isLentRepayment = (type === 'receive');

    window.appStore.recordSettlement({
      person,
      amount,
      wallet,
      isLentRepayment,
      notes,
      date,
    });

    this.closeSettleModal();

    if (typeof confetti === 'function') {
      confetti({
        particleCount: 60,
        spread: 50,
        origin: { y: 0.6 }
      });
    }

    window.app.showToast(
      isLentRepayment
        ? `Recorded ৳${amount.toLocaleString('en-IN')} received from ${person}. Wallet updated!`
        : `Recorded ৳${amount.toLocaleString('en-IN')} paid to ${person}. Wallet updated!`,
      'success'
    );
  }

  openPersonHistory(encodedPerson) {
    const personName = decodeURIComponent(encodedPerson);
    const ledger = window.appStore.getPeopleLedger();
    const personData = ledger.find(p => p.name === personName);
    if (!personData) return;

    this.activePersonHistory = personData;

    const modal = document.getElementById('personHistoryModal');
    const titleEl = document.getElementById('personHistoryName');
    const badgeEl = document.getElementById('personHistoryStatus');
    const listEl = document.getElementById('personHistoryList');

    if (titleEl) titleEl.textContent = personData.name;

    if (badgeEl) {
      if (personData.status === 'owes_you') {
        badgeEl.className = 'text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
        badgeEl.textContent = `Owes You ৳ ${personData.netBalance.toLocaleString('en-IN')}`;
      } else if (personData.status === 'you_owe') {
        badgeEl.className = 'text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
        badgeEl.textContent = `You Owe ৳ ${personData.netBalance.toLocaleString('en-IN')}`;
      } else {
        badgeEl.className = 'text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
        badgeEl.textContent = 'All Settled ✓';
      }
    }

    if (listEl) {
      const sortedTxns = [...personData.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

      if (sortedTxns.length === 0) {
        listEl.innerHTML = '<p class="text-sm text-slate-500 py-6 text-center">No transaction history found for this person.</p>';
      } else {
        listEl.innerHTML = sortedTxns.map(t => {
          const typeMeta = TRANSACTION_TYPES[t.type] || {};
          const walletObj = WALLETS.find(w => w.id === t.wallet) || { name: t.wallet };

          return `
            <div class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 transition flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl flex items-center justify-center text-xs ${typeMeta.badgeClass}">
                  <i class="fa-solid ${typeMeta.icon}"></i>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-slate-800 dark:text-slate-200">${typeMeta.bengali || typeMeta.label}</span>
                    <span class="text-[11px] text-slate-400">• ${walletObj.name}</span>
                  </div>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">${t.notes || t.sourceDest || 'No notes'}</p>
                  <span class="text-[10px] text-slate-400">${new Date(t.date).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
              </div>
              <div class="text-right">
                <span class="text-sm font-bold ${t.type === 'lent' || t.type === 'expense' || t.type === 'borrowed_repayment' ? 'text-slate-900 dark:text-white' : 'text-emerald-600 dark:text-emerald-400'}">
                  ৳ ${t.amount.toLocaleString('en-IN')}
                </span>
                ${t.dueDate ? `<span class="block text-[10px] text-blue-600 dark:text-blue-400">Due: ${t.dueDate}</span>` : ''}
              </div>
            </div>
          `;
        }).join('');
      }
    }

    if (modal) {
      modal.style.display = 'flex';
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
  }

  closePersonHistoryModal() {
    const modal = document.getElementById('personHistoryModal');
    if (modal) {
      modal.style.display = 'none';
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  }

  openNewLoanForPerson(encodedPerson) {
    const person = decodeURIComponent(encodedPerson);
    window.transactionManager.openAddModal({
      type: 'lent',
      person: person,
      category: 'debt_loan',
    });
  }
}

window.loanManager = new LoanLedgerManager();
