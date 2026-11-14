/**
 * transactions.js - Transaction CRUD, Table Rendering, Filter & Sorting, Form Modal
 * Manages the main transaction ledger table, entry modal, and deletion confirmation.
 */

class TransactionManager {
  constructor() {
    this.searchQuery = '';
    this.typeFilter = 'all';
    this.categoryFilter = 'all';
    this.walletFilter = 'all';
    this.dateFilter = 'all_time';
    this.customDateStart = '';
    this.customDateEnd = '';
    this.sortBy = 'date_desc';
    this.currentPage = 1;
    this.pageSize = 15;
    this.editingTxnId = null;
    this.deletingTxnId = null;
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) {
      this.populateSelectDropdowns();
      this.render();
      return;
    }
    this.setupEventListeners();
    this.populateSelectDropdowns();
    this.render();
    this.isInitialized = true;
  }

  setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('txnTableSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.currentPage = 1;
        this.render();
      });
    }

    // Filter selects
    const typeSelect = document.getElementById('txnFilterType');
    if (typeSelect) {
      typeSelect.addEventListener('change', (e) => {
        this.typeFilter = e.target.value;
        this.currentPage = 1;
        this.render();
      });
    }

    const catSelect = document.getElementById('txnFilterCategory');
    if (catSelect) {
      catSelect.addEventListener('change', (e) => {
        this.categoryFilter = e.target.value;
        this.currentPage = 1;
        this.render();
      });
    }

    const walletSelect = document.getElementById('txnFilterWallet');
    if (walletSelect) {
      walletSelect.addEventListener('change', (e) => {
        this.walletFilter = e.target.value;
        this.currentPage = 1;
        this.render();
      });
    }

    const dateSelect = document.getElementById('txnFilterDateRange');
    const customDateContainer = document.getElementById('customDateRangeContainer');
    if (dateSelect) {
      dateSelect.addEventListener('change', (e) => {
        this.dateFilter = e.target.value;
        if (this.dateFilter === 'custom') {
          if (customDateContainer) customDateContainer.classList.remove('hidden');
        } else {
          if (customDateContainer) customDateContainer.classList.add('hidden');
        }
        this.currentPage = 1;
        this.render();
      });
    }

    const customStart = document.getElementById('customDateStart');
    const customEnd = document.getElementById('customDateEnd');
    if (customStart && customEnd) {
      const handleCustomDateChange = () => {
        this.customDateStart = customStart.value;
        this.customDateEnd = customEnd.value;
        this.currentPage = 1;
        this.render();
      };
      customStart.addEventListener('change', handleCustomDateChange);
      customEnd.addEventListener('change', handleCustomDateChange);
    }

    const sortSelect = document.getElementById('txnSortBy');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.sortBy = e.target.value;
        this.currentPage = 1;
        this.render();
      });
    }

    // Modal Form Type Toggle buttons
    const typeButtons = document.querySelectorAll('.txn-type-btn');
    typeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const selectedType = btn.getAttribute('data-type');
        this.setModalType(selectedType);
      });
    });

    // Form submission
    const form = document.getElementById('transactionForm');
    if (form) {
      form.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }

    // Quick amount buttons
    const quickAmountBtns = document.querySelectorAll('.quick-amount-btn');
    quickAmountBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const addVal = parseFloat(btn.getAttribute('data-amount')) || 0;
        const amountInput = document.getElementById('txnAmount');
        if (amountInput) {
          const currentVal = parseFloat(amountInput.value) || 0;
          amountInput.value = currentVal + addVal;
        }
      });
    });

    // Set to current date & time button
    const setNowBtn = document.getElementById('setNowDateTimeBtn');
    if (setNowBtn) {
      setNowBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.setDefaultDateTime();
      });
    }

    // Modal backdrop click to close
    const txnModal = document.getElementById('transactionModal');
    if (txnModal) {
      txnModal.addEventListener('click', (e) => {
        if (e.target === txnModal) {
          this.closeModal();
        }
      });
    }

    const delModal = document.getElementById('deleteConfirmModal');
    if (delModal) {
      delModal.addEventListener('click', (e) => {
        if (e.target === delModal) {
          this.closeDeleteModal();
        }
      });
    }
  }

  // Populate Categories & Wallets dropdowns dynamically
  populateSelectDropdowns() {
    // Filter Category Select
    const filterCat = document.getElementById('txnFilterCategory');
    if (filterCat) {
      filterCat.innerHTML = '<option value="all">All Categories (সব ক্যাটাগরি)</option>' +
        CATEGORIES.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }

    // Form Category Select
    const formCat = document.getElementById('txnCategory');
    if (formCat) {
      formCat.innerHTML = CATEGORIES.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }

    // Form Wallet Select
    const formWallet = document.getElementById('txnWallet');
    if (formWallet) {
      formWallet.innerHTML = WALLETS.map(w => `<option value="${w.id}">${w.name}</option>`).join('');
    }

    // Settle Wallet Select
    const settleWallet = document.getElementById('settleWalletSelect');
    if (settleWallet) {
      settleWallet.innerHTML = WALLETS.map(w => `<option value="${w.id}">${w.name}</option>`).join('');
    }

    this.refreshPeopleDatalist();
  }

  refreshPeopleDatalist() {
    const datalist = document.getElementById('knownPeopleList');
    if (datalist) {
      const people = window.appStore.getKnownPeople();
      datalist.innerHTML = people.map(p => `<option value="${p}"></option>`).join('');
    }
  }

  // Set the selected transaction type in modal
  setModalType(type) {
    const typeInput = document.getElementById('txnType');
    if (typeInput) typeInput.value = type;

    const typeButtons = document.querySelectorAll('.txn-type-btn');
    typeButtons.forEach(btn => {
      const bType = btn.getAttribute('data-type');
      if (bType === type) {
        if (bType === 'income') {
          btn.className = 'txn-type-btn py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all bg-emerald-600 text-white shadow-sm';
        } else if (bType === 'expense') {
          btn.className = 'txn-type-btn py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all bg-rose-600 text-white shadow-sm';
        } else if (bType === 'lent') {
          btn.className = 'txn-type-btn py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all bg-blue-600 text-white shadow-sm';
        } else if (bType === 'borrowed') {
          btn.className = 'txn-type-btn py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all bg-amber-600 text-white shadow-sm';
        }
      } else {
        btn.className = 'txn-type-btn py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all';
      }
    });

    // Form field adaptations based on type
    const personInput = document.getElementById('txnPerson');
    const personLabel = document.getElementById('txnPersonLabel');
    const personRequiredStar = document.getElementById('txnPersonRequiredStar');
    const dueDateContainer = document.getElementById('txnDueDateContainer');
    const sourceDestLabel = document.getElementById('txnSourceDestLabel');
    const categorySelect = document.getElementById('txnCategory');

    if (type === 'lent' || type === 'borrowed') {
      if (personRequiredStar) personRequiredStar.classList.remove('hidden');
      if (personInput) personInput.required = true;
      if (dueDateContainer) dueDateContainer.classList.remove('hidden');

      if (type === 'lent') {
        if (personLabel) personLabel.textContent = "Borrower's Name / কাকে ধার দিচ্ছেন?";
        if (sourceDestLabel) sourceDestLabel.textContent = "Purpose / Details";
        if (categorySelect) categorySelect.value = 'debt_loan';
      } else {
        if (personLabel) personLabel.textContent = "Lender's Name / কার থেকে ঋণ নিচ্ছেন?";
        if (sourceDestLabel) sourceDestLabel.textContent = "Purpose / Details";
        if (categorySelect) categorySelect.value = 'debt_loan';
      }
    } else {
      if (personRequiredStar) personRequiredStar.classList.add('hidden');
      if (personInput) personInput.required = false;
      if (dueDateContainer) dueDateContainer.classList.add('hidden');

      if (type === 'income') {
        if (personLabel) personLabel.textContent = "Payer / Client Name (Optional)";
        if (sourceDestLabel) sourceDestLabel.textContent = "Source / Income From (e.g. Salary, Client)";
        if (categorySelect && (categorySelect.value === 'debt_loan' || categorySelect.value === 'food')) {
          categorySelect.value = 'salary';
        }
      } else {
        if (personLabel) personLabel.textContent = "Payee / Person (Optional)";
        if (sourceDestLabel) sourceDestLabel.textContent = "Destination / Paid to (e.g. Shop, Restaurant)";
        if (categorySelect && (categorySelect.value === 'debt_loan' || categorySelect.value === 'salary')) {
          categorySelect.value = 'food';
        }
      }
    }
  }

  // Open Modal for Add
  openAddModal(defaults = {}) {
    this.editingTxnId = null;
    this.refreshPeopleDatalist();

    const modal = document.getElementById('transactionModal');
    const form = document.getElementById('transactionForm');
    const title = document.getElementById('transactionModalTitle');

    if (title) {
      title.innerHTML = '<i class="fa-solid fa-plus-circle text-blue-600 mr-2"></i> Add New Transaction (নতুন লেনদেন)';
    }

    if (form) {
      form.reset();
    }

    const selectedType = defaults.type || 'expense';
    this.setModalType(selectedType);

    const personInput = document.getElementById('txnPerson');
    const catInput = document.getElementById('txnCategory');
    const walletInput = document.getElementById('txnWallet');
    const amountInput = document.getElementById('txnAmount');
    const notesInput = document.getElementById('txnNotes');
    const sourceDestInput = document.getElementById('txnSourceDest');
    const dueDateInput = document.getElementById('txnDueDate');

    if (personInput) personInput.value = defaults.person || '';
    if (catInput && defaults.category) catInput.value = defaults.category;
    if (walletInput && defaults.wallet) walletInput.value = defaults.wallet;
    if (amountInput) amountInput.value = defaults.amount || '';
    if (notesInput) notesInput.value = '';
    if (sourceDestInput) sourceDestInput.value = '';
    if (dueDateInput) dueDateInput.value = '';

    this.setDefaultDateTime();

    if (modal) {
      modal.style.display = 'flex';
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }

    setTimeout(() => {
      const amt = document.getElementById('txnAmount');
      if (amt) amt.focus();
    }, 100);
  }

  // Open Modal for Edit
  openEditModal(id) {
    const txn = window.appStore.transactions.find(t => t.id === id);
    if (!txn) return;

    this.editingTxnId = id;
    this.refreshPeopleDatalist();

    const modal = document.getElementById('transactionModal');
    const title = document.getElementById('transactionModalTitle');

    if (title) {
      title.innerHTML = '<i class="fa-solid fa-pen-to-square text-blue-600 mr-2"></i> Edit Transaction (সম্পাদনা)';
    }

    this.setModalType(txn.type);
    document.getElementById('txnAmount').value = txn.amount;
    document.getElementById('txnPerson').value = txn.person || '';
    document.getElementById('txnSourceDest').value = txn.sourceDest || '';
    document.getElementById('txnCategory').value = txn.category || 'other_expense';
    document.getElementById('txnWallet').value = txn.wallet || 'cash';
    document.getElementById('txnDate').value = txn.date;
    document.getElementById('txnDueDate').value = txn.dueDate || '';
    document.getElementById('txnNotes').value = txn.notes || '';

    if (modal) {
      modal.style.display = 'flex';
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
  }

  closeModal() {
    const modal = document.getElementById('transactionModal');
    if (modal) {
      modal.style.display = 'none';
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
    this.editingTxnId = null;
  }

  setDefaultDateTime() {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const localIso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const dateInput = document.getElementById('txnDate');
    if (dateInput) dateInput.value = localIso;
  }

  // Handle Form Submit
  handleFormSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();

    const type = document.getElementById('txnType')?.value || 'expense';
    const amountVal = document.getElementById('txnAmount')?.value;
    const amount = parseFloat(amountVal);
    const person = (document.getElementById('txnPerson')?.value || '').trim();
    const sourceDest = (document.getElementById('txnSourceDest')?.value || '').trim();
    const category = document.getElementById('txnCategory')?.value || 'other_expense';
    const wallet = document.getElementById('txnWallet')?.value || 'cash';
    const date = document.getElementById('txnDate')?.value || new Date().toISOString().slice(0, 16);
    const dueDate = document.getElementById('txnDueDate')?.value || '';
    const notes = (document.getElementById('txnNotes')?.value || '').trim();

    if (isNaN(amount) || amount <= 0) {
      window.app.showToast('Please enter a valid amount greater than 0', 'error');
      return;
    }

    if ((type === 'lent' || type === 'borrowed') && !person) {
      window.app.showToast('Person / Counterparty name is required for loans and borrowings', 'error');
      return;
    }

    const txnData = {
      type,
      amount,
      person,
      sourceDest,
      category,
      wallet,
      date,
      dueDate,
      notes,
    };

    if (this.editingTxnId) {
      window.appStore.updateTransaction(this.editingTxnId, txnData);
      window.app.showToast('Transaction updated successfully', 'success');
    } else {
      window.appStore.addTransaction(txnData);
      window.app.showToast('Transaction added successfully', 'success');
    }

    this.closeModal();
  }

  // Delete transaction flow
  promptDelete(id) {
    const txn = window.appStore.transactions.find(t => t.id === id);
    if (!txn) return;

    this.deletingTxnId = id;
    const modal = document.getElementById('deleteConfirmModal');
    const desc = document.getElementById('deleteConfirmDescription');
    
    if (desc) {
      const typeMeta = TRANSACTION_TYPES[txn.type] || {};
      desc.innerHTML = `Are you sure you want to delete this <strong>${typeMeta.label}</strong> of <strong>৳ ${txn.amount.toLocaleString('en-IN')}</strong> (${txn.notes || txn.sourceDest || txn.person || 'No details'})?`;
    }

    if (modal) {
      modal.style.display = 'flex';
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
  }

  confirmDelete() {
    if (this.deletingTxnId) {
      window.appStore.deleteTransaction(this.deletingTxnId);
      window.app.showToast('Transaction deleted', 'info');
      this.closeDeleteModal();
    }
  }

  closeDeleteModal() {
    const modal = document.getElementById('deleteConfirmModal');
    if (modal) {
      modal.style.display = 'none';
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
    this.deletingTxnId = null;
  }

  // Filter and sort transactions
  getFilteredTransactions() {
    let txns = [...window.appStore.transactions];

    if (this.searchQuery) {
      const q = this.searchQuery;
      txns = txns.filter(t => {
        return (
          (t.person && t.person.toLowerCase().includes(q)) ||
          (t.sourceDest && t.sourceDest.toLowerCase().includes(q)) ||
          (t.notes && t.notes.toLowerCase().includes(q)) ||
          (t.category && t.category.toLowerCase().includes(q)) ||
          (t.wallet && t.wallet.toLowerCase().includes(q)) ||
          (String(t.amount).includes(q))
        );
      });
    }

    if (this.typeFilter !== 'all') {
      if (this.typeFilter === 'loans_all') {
        txns = txns.filter(t => t.type === 'lent' || t.type === 'borrowed' || t.type === 'lent_repayment' || t.type === 'borrowed_repayment');
      } else {
        txns = txns.filter(t => t.type === this.typeFilter);
      }
    }

    if (this.categoryFilter !== 'all') {
      txns = txns.filter(t => t.category === this.categoryFilter);
    }

    if (this.walletFilter !== 'all') {
      txns = txns.filter(t => t.wallet === this.walletFilter);
    }

    const now = new Date();
    if (this.dateFilter === 'today') {
      const todayStr = now.toISOString().slice(0, 10);
      txns = txns.filter(t => t.date && t.date.slice(0, 10) === todayStr);
    } else if (this.dateFilter === 'this_week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      txns = txns.filter(t => new Date(t.date) >= startOfWeek);
    } else if (this.dateFilter === 'this_month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      txns = txns.filter(t => new Date(t.date) >= startOfMonth);
    } else if (this.dateFilter === 'last_month') {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      txns = txns.filter(t => {
        const d = new Date(t.date);
        return d >= startOfLastMonth && d <= endOfLastMonth;
      });
    } else if (this.dateFilter === 'custom') {
      if (this.customDateStart) {
        const s = new Date(this.customDateStart);
        txns = txns.filter(t => new Date(t.date) >= s);
      }
      if (this.customDateEnd) {
        const e = new Date(this.customDateEnd);
        e.setHours(23, 59, 59, 999);
        txns = txns.filter(t => new Date(t.date) <= e);
      }
    }

    txns.sort((a, b) => {
      if (this.sortBy === 'date_desc') return new Date(b.date) - new Date(a.date);
      if (this.sortBy === 'date_asc') return new Date(a.date) - new Date(b.date);
      if (this.sortBy === 'amount_desc') return b.amount - a.amount;
      if (this.sortBy === 'amount_asc') return a.amount - b.amount;
      return 0;
    });

    return txns;
  }

  render() {
    const tableBody = document.getElementById('transactionTableBody');
    const mobileCardsContainer = document.getElementById('transactionMobileCards');
    const countBadge = document.getElementById('filteredTxnCount');
    const statsContainer = document.getElementById('filteredStatsBanner');

    const filtered = this.getFilteredTransactions();

    let totalIn = 0;
    let totalOut = 0;
    filtered.forEach(t => {
      if (t.type === 'income' || t.type === 'borrowed' || t.type === 'lent_repayment') {
        totalIn += t.amount;
      } else {
        totalOut += t.amount;
      }
    });

    if (countBadge) countBadge.textContent = `${filtered.length} of ${window.appStore.transactions.length} records`;

    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="flex items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-300 overflow-x-auto py-1">
          <span class="inline-flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-emerald-500"></span> Total In: <strong class="text-emerald-600 dark:text-emerald-400">৳ ${totalIn.toLocaleString('en-IN')}</strong></span>
          <span class="inline-flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-rose-500"></span> Total Out: <strong class="text-rose-600 dark:text-rose-400">৳ ${totalOut.toLocaleString('en-IN')}</strong></span>
          <span class="inline-flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-blue-500"></span> Net: <strong class="${totalIn - totalOut >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}">৳ ${(totalIn - totalOut).toLocaleString('en-IN')}</strong></span>
        </div>
      `;
    }

    const totalPages = Math.ceil(filtered.length / this.pageSize) || 1;
    if (this.currentPage > totalPages) this.currentPage = totalPages;
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const pageItems = filtered.slice(startIndex, startIndex + this.pageSize);

    this.renderPagination(totalPages, filtered.length);

    if (filtered.length === 0) {
      const emptyHtml = `
        <div class="py-12 text-center text-slate-500 dark:text-slate-400">
          <i class="fa-solid fa-receipt text-3xl mb-2 text-slate-300 dark:text-slate-600"></i>
          <p class="font-medium text-sm">No transactions match your search or filters.</p>
          <div class="mt-3 flex items-center justify-center gap-3">
            <button onclick="window.transactionManager.resetFilters()" class="text-xs text-blue-600 dark:text-blue-400 hover:underline">Reset Filters</button>
            <span>•</span>
            <button onclick="window.transactionManager.openAddModal()" class="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">+ Add Transaction</button>
          </div>
        </div>
      `;
      if (tableBody) tableBody.innerHTML = `<tr><td colspan="7">${emptyHtml}</td></tr>`;
      if (mobileCardsContainer) mobileCardsContainer.innerHTML = emptyHtml;
      return;
    }

    if (tableBody) {
      tableBody.innerHTML = pageItems.map(t => this.renderTableRow(t)).join('');
    }

    if (mobileCardsContainer) {
      mobileCardsContainer.innerHTML = pageItems.map(t => this.renderMobileCard(t)).join('');
    }
  }

  renderTableRow(t) {
    const typeMeta = TRANSACTION_TYPES[t.type] || { label: t.type, bengali: t.type, badgeClass: 'bg-slate-100 text-slate-800', icon: 'fa-circle' };
    const cat = CATEGORIES.find(c => c.id === t.category) || { name: t.category, icon: 'fa-tag' };
    const wallet = WALLETS.find(w => w.id === t.wallet) || { name: t.wallet, icon: 'fa-wallet' };

    const isPositive = (t.type === 'income' || t.type === 'borrowed' || t.type === 'lent_repayment');
    const amountColor = isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100';
    const amountPrefix = isPositive ? '+' : '-';

    let dueDatePill = '';
    if (t.dueDate) {
      const isPast = new Date(t.dueDate) < new Date().setHours(0, 0, 0, 0);
      dueDatePill = `
        <span class="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ${isPast ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-semibold' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}">
          <i class="fa-regular fa-calendar-check text-[10px]"></i> ${t.dueDate}
        </span>
      `;
    }

    return `
      <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition border-b border-slate-100 dark:border-slate-800/80">
        <!-- Date -->
        <td class="py-3 px-4 text-xs whitespace-nowrap">
          <div class="font-medium text-slate-800 dark:text-slate-200">
            ${new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
          <div class="text-[11px] text-slate-400">
            ${new Date(t.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
          </div>
        </td>

        <!-- Type -->
        <td class="py-3 px-4 whitespace-nowrap">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${typeMeta.badgeClass}">
            <i class="fa-solid ${typeMeta.icon}"></i>
            <span>${typeMeta.bengali}</span>
          </span>
        </td>

        <!-- Person & Destination / Notes -->
        <td class="py-3 px-4">
          <div class="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            ${t.person ? `<i class="fa-solid fa-user text-blue-500 text-[10px]"></i> ${t.person}` : ''}
            ${t.person && t.sourceDest ? '<span class="text-slate-300 dark:text-slate-600">•</span>' : ''}
            <span>${t.sourceDest || (t.person ? '' : 'General')}</span>
          </div>
          ${t.notes ? `<p class="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs mt-0.5">${t.notes}</p>` : ''}
        </td>

        <!-- Category -->
        <td class="py-3 px-4 whitespace-nowrap text-xs text-slate-700 dark:text-slate-300">
          <span class="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
            <i class="fa-solid ${cat.icon} text-slate-500"></i>
            <span>${cat.name.split(' (')[0]}</span>
          </span>
        </td>

        <!-- Wallet -->
        <td class="py-3 px-4 whitespace-nowrap text-xs">
          <span class="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <span class="w-2 h-2 rounded-full ${wallet.color || 'bg-slate-400'}"></span>
            <span>${wallet.name.split(' (')[0]}</span>
          </span>
        </td>

        <!-- Amount & Due Date -->
        <td class="py-3 px-4 whitespace-nowrap text-right">
          <div class="text-sm font-bold ${amountColor}">
            ${amountPrefix}৳ ${t.amount.toLocaleString('en-IN')}
          </div>
          ${dueDatePill ? `<div class="mt-1">${dueDatePill}</div>` : ''}
        </td>

        <!-- Actions -->
        <td class="py-3 px-4 whitespace-nowrap text-right text-xs">
          <div class="inline-flex items-center gap-1">
            <button 
              type="button" 
              onclick="window.transactionManager.openEditModal('${t.id}')"
              class="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 transition"
              title="Edit Transaction"
            >
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button 
              type="button" 
              onclick="window.transactionManager.promptDelete('${t.id}')"
              class="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 transition"
              title="Delete Transaction"
            >
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  renderMobileCard(t) {
    const typeMeta = TRANSACTION_TYPES[t.type] || { label: t.type, bengali: t.type, badgeClass: 'bg-slate-100 text-slate-800', icon: 'fa-circle' };
    const cat = CATEGORIES.find(c => c.id === t.category) || { name: t.category, icon: 'fa-tag' };
    const wallet = WALLETS.find(w => w.id === t.wallet) || { name: t.wallet, icon: 'fa-wallet' };

    const isPositive = (t.type === 'income' || t.type === 'borrowed' || t.type === 'lent_repayment');
    const amountColor = isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100';
    const amountPrefix = isPositive ? '+' : '-';

    return `
      <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${typeMeta.badgeClass}">
            <i class="fa-solid ${typeMeta.icon}"></i>
            <span>${typeMeta.bengali}</span>
          </span>
          <span class="text-base font-bold ${amountColor}">
            ${amountPrefix}৳ ${t.amount.toLocaleString('en-IN')}
          </span>
        </div>

        <div class="text-xs">
          <div class="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1">
            ${t.person ? `<span class="text-blue-600 dark:text-blue-400 font-bold">${t.person}</span>` : ''}
            ${t.person && t.sourceDest ? ' - ' : ''}
            <span>${t.sourceDest || (t.person ? '' : 'General')}</span>
          </div>
          ${t.notes ? `<p class="text-slate-500 dark:text-slate-400 mt-0.5">${t.notes}</p>` : ''}
        </div>

        <div class="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400">
          <div class="flex items-center gap-2">
            <span><i class="fa-solid ${cat.icon} mr-1"></i>${cat.name.split(' (')[0]}</span>
            <span>•</span>
            <span>${wallet.name.split(' (')[0]}</span>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="window.transactionManager.openEditModal('${t.id}')" class="text-blue-600 hover:text-blue-700 p-1">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button onclick="window.transactionManager.promptDelete('${t.id}')" class="text-rose-600 hover:text-rose-700 p-1">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderPagination(totalPages, totalCount) {
    const container = document.getElementById('txnPaginationContainer');
    if (!container) return;

    if (totalCount <= this.pageSize) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = `
      <div class="flex items-center justify-between w-full text-xs text-slate-500 dark:text-slate-400">
        <div>Page ${this.currentPage} of ${totalPages}</div>
        <div class="flex items-center gap-1.5">
          <button 
            ${this.currentPage === 1 ? 'disabled class="opacity-40 cursor-not-allowed"' : 'onclick="window.transactionManager.setPage(' + (this.currentPage - 1) + ')"'}
            class="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <i class="fa-solid fa-chevron-left"></i> Previous
          </button>
          <button 
            ${this.currentPage === totalPages ? 'disabled class="opacity-40 cursor-not-allowed"' : 'onclick="window.transactionManager.setPage(' + (this.currentPage + 1) + ')"'}
            class="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Next <i class="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      </div>
    `;
  }

  setPage(page) {
    this.currentPage = page;
    this.render();
  }

  resetFilters() {
    this.searchQuery = '';
    this.typeFilter = 'all';
    this.categoryFilter = 'all';
    this.walletFilter = 'all';
    this.dateFilter = 'all_time';
    this.customDateStart = '';
    this.customDateEnd = '';
    this.currentPage = 1;

    const s = document.getElementById('txnTableSearch');
    if (s) s.value = '';
    const t = document.getElementById('txnFilterType');
    if (t) t.value = 'all';
    const c = document.getElementById('txnFilterCategory');
    if (c) c.value = 'all';
    const w = document.getElementById('txnFilterWallet');
    if (w) w.value = 'all';
    const d = document.getElementById('txnFilterDateRange');
    if (d) d.value = 'all_time';

    this.render();
  }
}

// Global instance & shortcut
window.transactionManager = new TransactionManager();
window.openAddModal = (defaults) => window.transactionManager.openAddModal(defaults);
window.closeAddModal = () => window.transactionManager.closeModal();
