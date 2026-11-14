/**
 * state.js - Central State Management & Storage for HishabNikash
 * Handles LocalStorage persistence, financial calculations, balances, and data exports.
 */

const STORAGE_KEY = 'hishabnikash_transactions_v1';
const SETTINGS_KEY = 'hishabnikash_settings_v1';

// Supported payment methods/wallets
const WALLETS = [
  { id: 'cash', name: 'Cash (নগদ)', icon: 'fa-money-bill-wave', color: 'bg-emerald-500' },
  { id: 'bkash', name: 'bKash (বিকাশ)', icon: 'fa-mobile-screen', color: 'bg-pink-600' },
  { id: 'nagad', name: 'Nagad (নগদ)', icon: 'fa-wallet', color: 'bg-orange-500' },
  { id: 'bank', name: 'Bank Account (ব্যাংক)', icon: 'fa-building-columns', color: 'bg-blue-600' },
  { id: 'credit_card', name: 'Credit Card (কার্ড)', icon: 'fa-credit-card', color: 'bg-purple-600' },
];

// Transaction Categories
const CATEGORIES = [
  // Income categories
  { id: 'salary', name: 'Salary (বেতন)', icon: 'fa-briefcase', type: 'income', color: '#10B981' },
  { id: 'freelance', name: 'Freelance / Business (ব্যবসা/ফ্রিল্যান্সিং)', icon: 'fa-laptop-code', type: 'income', color: '#059669' },
  { id: 'gift_income', name: 'Gift / Bonus (বোনাস/উপহার)', icon: 'fa-gift', type: 'income', color: '#34D399' },
  { id: 'investment_return', name: 'Investment / Profit (মুনাফা)', icon: 'fa-arrow-trend-up', type: 'income', color: '#6EE7B7' },
  { id: 'other_income', name: 'Other Income (অন্যান্য আয়)', icon: 'fa-coins', type: 'income', color: '#A7F3D0' },

  // Expense categories
  { id: 'food', name: 'Food & Dining (খাবার ও রেস্তোরাঁ)', icon: 'fa-utensils', type: 'expense', color: '#EF4444' },
  { id: 'transport', name: 'Transport & Commute (যাতায়াত/ভাড়া)', icon: 'fa-bus', type: 'expense', color: '#F97316' },
  { id: 'rent', name: 'House Rent (বাসা ভাড়া)', icon: 'fa-house', type: 'expense', color: '#DC2626' },
  { id: 'utility', name: 'Utility & Bills (বিদ্যুৎ/গ্যাস/পানি)', icon: 'fa-bolt', type: 'expense', color: '#EAB308' },
  { id: 'recharge', name: 'Mobile & Internet (মোবাইল/নেট)', icon: 'fa-wifi', type: 'expense', color: '#06B6D4' },
  { id: 'shopping', name: 'Shopping & Groceries (বাজার/শপিং)', icon: 'fa-cart-shopping', type: 'expense', color: '#EC4899' },
  { id: 'medical', name: 'Medical & Healthcare (চিকিৎসা/ঔষধ)', icon: 'fa-heart-pulse', type: 'expense', color: '#E11D48' },
  { id: 'education', name: 'Education (শিক্ষা ও বই)', icon: 'fa-graduation-cap', type: 'expense', color: '#8B5CF6' },
  { id: 'entertainment', name: 'Entertainment (বিনোদন ও আড্ডা)', icon: 'fa-film', type: 'expense', color: '#A855F7' },
  { id: 'other_expense', name: 'Other Expense (অন্যান্য খরচ)', icon: 'fa-tags', type: 'expense', color: '#64748B' },

  // Loan categories
  { id: 'debt_loan', name: 'Loan & Debt (ধার ও ঋণ লেনদেন)', icon: 'fa-handshake', type: 'loan', color: '#3B82F6' },
];

// Transaction Types Metadata
const TRANSACTION_TYPES = {
  income: {
    label: 'Income (আয়)',
    bengali: 'আয় / জমা',
    color: 'emerald',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
    icon: 'fa-arrow-down-left',
    flow: 'in', // Money added to wallet
  },
  expense: {
    label: 'Expense (খরচ)',
    bengali: 'ব্যয় / খরচ',
    color: 'rose',
    badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-300 dark:border-rose-700',
    icon: 'fa-arrow-up-right',
    flow: 'out', // Money deducted from wallet
  },
  lent: {
    label: 'Lent Money (ধার দেওয়া)',
    bengali: 'কাউকে ধার দেওয়া',
    color: 'sky',
    badgeClass: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 border-sky-300 dark:border-sky-700',
    icon: 'fa-hand-holding-dollar',
    flow: 'out', // Leaves wallet, creates receivable asset
  },
  borrowed: {
    label: 'Borrowed Money (ঋণ নেওয়া)',
    bengali: 'কারো থেকে ধার নেওয়া',
    color: 'amber',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300 dark:border-amber-700',
    icon: 'fa-handshake-angle',
    flow: 'in', // Enters wallet, creates liability debt
  },
  lent_repayment: {
    label: 'Lent Repaid (ধার ফেরত পাওয়া)',
    bengali: 'দেওয়া ধার ফেরত পেলাম',
    color: 'teal',
    badgeClass: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 border-teal-300 dark:border-teal-700',
    icon: 'fa-circle-check',
    flow: 'in', // Money returned to wallet, reduces receivable
  },
  borrowed_repayment: {
    label: 'Debt Repaid (ঋণ পরিশোধ)',
    bengali: 'নেওয়া ঋণ পরিশোধ করলাম',
    color: 'indigo',
    badgeClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700',
    icon: 'fa-check-double',
    flow: 'out', // Leaves wallet, reduces liability
  }
};

// Initial Realistic Demo Data (Bangladeshi context)
function getDemoTransactions() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const pad = (n) => String(n).padStart(2, '0');

  // Format ISO local string
  const makeDate = (dayOffset, hour = 12, min = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() - dayOffset);
    d.setHours(hour, min, 0, 0);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const makeDueDate = (daysAhead) => {
    const d = new Date(now);
    d.setDate(d.getDate() + daysAhead);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  return [
    {
      id: 'txn_demo_1',
      type: 'income',
      amount: 65000,
      person: '',
      sourceDest: 'Tech Solutions Ltd.',
      wallet: 'bank',
      category: 'salary',
      dueDate: '',
      date: makeDate(10, 10, 0),
      notes: 'Monthly salary credited directly to City Bank account',
    },
    {
      id: 'txn_demo_2',
      type: 'income',
      amount: 15000,
      person: 'Client (Upwork)',
      sourceDest: 'Freelance Web Design project',
      wallet: 'bkash',
      category: 'freelance',
      dueDate: '',
      date: makeDate(7, 16, 30),
      notes: 'Payment for landing page design & optimization',
    },
    {
      id: 'txn_demo_3',
      type: 'expense',
      amount: 18000,
      person: 'House Owner (Zakir Bhai)',
      sourceDest: 'Dhanmondi Apartment Rent',
      wallet: 'bank',
      category: 'rent',
      dueDate: '',
      date: makeDate(8, 11, 0),
      notes: 'Monthly apartment rent paid online',
    },
    {
      id: 'txn_demo_4',
      type: 'expense',
      amount: 3200,
      person: '',
      sourceDest: 'Shwapno Superstore',
      wallet: 'credit_card',
      category: 'shopping',
      dueDate: '',
      date: makeDate(5, 19, 15),
      notes: 'Weekly groceries, milk, rice and kitchen supplies',
    },
    {
      id: 'txn_demo_5',
      type: 'expense',
      amount: 750,
      person: '',
      sourceDest: 'Pathao Rides & Rickshaw',
      wallet: 'nagad',
      category: 'transport',
      dueDate: '',
      date: makeDate(4, 9, 45),
      notes: 'Commute to office and meetings',
    },
    {
      id: 'txn_demo_6',
      type: 'expense',
      amount: 1250,
      person: 'Friends',
      sourceDest: 'Kacchi Dine Restaurant',
      wallet: 'cash',
      category: 'food',
      dueDate: '',
      date: makeDate(3, 20, 30),
      notes: 'Dinner with college friends at Dhanmondi 27',
    },
    {
      id: 'txn_demo_7',
      type: 'expense',
      amount: 1200,
      person: '',
      sourceDest: 'Grameenphone & Link3',
      wallet: 'bkash',
      category: 'recharge',
      dueDate: '',
      date: makeDate(2, 14, 0),
      notes: 'Monthly home WiFi bill and mobile flexiload',
    },
    // Loan & Debt Examples
    {
      id: 'txn_demo_8',
      type: 'lent',
      amount: 10000,
      person: 'Tanvir Ahmed (Friend)',
      sourceDest: 'Tanvir personal emergency',
      wallet: 'bkash',
      category: 'debt_loan',
      dueDate: makeDueDate(7),
      date: makeDate(9, 15, 20),
      notes: 'Lent for medical emergency. Promised to return by 20th.',
    },
    {
      id: 'txn_demo_9',
      type: 'lent_repayment',
      amount: 4000,
      person: 'Tanvir Ahmed (Friend)',
      sourceDest: 'Partial repayment from Tanvir',
      wallet: 'bkash',
      category: 'debt_loan',
      dueDate: '',
      date: makeDate(2, 18, 0),
      notes: 'Received partial repayment via bKash. ৳6,000 remaining.',
    },
    {
      id: 'txn_demo_10',
      type: 'lent',
      amount: 5000,
      person: 'Rahim (Colleague)',
      sourceDest: 'Office laptop repair help',
      wallet: 'cash',
      category: 'debt_loan',
      dueDate: makeDueDate(14),
      date: makeDate(6, 13, 0),
      notes: 'Lent cash for repairing his laptop motherboard',
    },
    {
      id: 'txn_demo_11',
      type: 'borrowed',
      amount: 8000,
      person: 'Uncle (Mamun Chacha)',
      sourceDest: 'Short-term loan for advance payment',
      wallet: 'bank',
      category: 'debt_loan',
      dueDate: makeDueDate(18),
      date: makeDate(12, 11, 30),
      notes: 'Borrowed for festival advance shopping, to repay next month',
    },
    {
      id: 'txn_demo_12',
      type: 'borrowed_repayment',
      amount: 3000,
      person: 'Uncle (Mamun Chacha)',
      sourceDest: 'Paid back first installment',
      wallet: 'bank',
      category: 'debt_loan',
      dueDate: '',
      date: makeDate(1, 10, 0),
      notes: 'Bank transfer repayment. ৳5,000 balance remaining.',
    },
    {
      id: 'txn_demo_13',
      type: 'lent',
      amount: 3500,
      person: 'Sabbir (Cousin)',
      sourceDest: 'University semester form fill-up',
      wallet: 'nagad',
      category: 'debt_loan',
      dueDate: makeDueDate(-2), // overdue example!
      date: makeDate(15, 14, 0),
      notes: 'Given for admission fee. Follow-up needed.',
    }
  ];
}

class Store {
  constructor() {
    this.transactions = [];
    this.settings = {
      darkMode: false,
      currencySymbol: '৳',
      selectedPeriod: 'this_month', // 'this_month', 'all_time', 'last_30_days', 'this_year'
    };
    this.listeners = [];
    this.init();
  }

  init() {
    try {
      const storedTxns = localStorage.getItem(STORAGE_KEY);
      if (storedTxns) {
        this.transactions = JSON.parse(storedTxns);
      } else {
        // First time load: provide realistic Bangladeshi sample data
        this.transactions = getDemoTransactions();
        this.save();
      }

      const storedSettings = localStorage.getItem(SETTINGS_KEY);
      if (storedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(storedSettings) };
      }
    } catch (e) {
      console.error('Failed to load from localStorage:', e);
      this.transactions = getDemoTransactions();
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.transactions));
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
      this.notify();
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this);
      } catch (err) {
        console.error('Error in store listener:', err);
      }
    }
  }

  // Add Transaction
  addTransaction(txnData) {
    const newTxn = {
      id: 'txn_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      type: txnData.type,
      amount: parseFloat(txnData.amount) || 0,
      person: (txnData.person || '').trim(),
      sourceDest: (txnData.sourceDest || '').trim(),
      wallet: txnData.wallet || 'cash',
      category: txnData.category || 'other_expense',
      dueDate: txnData.dueDate || '',
      date: txnData.date || new Date().toISOString().slice(0, 16),
      notes: (txnData.notes || '').trim(),
    };

    this.transactions.unshift(newTxn);
    this.save();
    return newTxn;
  }

  // Update Transaction
  updateTransaction(id, updatedData) {
    const index = this.transactions.findIndex(t => t.id === id);
    if (index !== -1) {
      this.transactions[index] = {
        ...this.transactions[index],
        type: updatedData.type,
        amount: parseFloat(updatedData.amount) || 0,
        person: (updatedData.person || '').trim(),
        sourceDest: (updatedData.sourceDest || '').trim(),
        wallet: updatedData.wallet || 'cash',
        category: updatedData.category || 'other_expense',
        dueDate: updatedData.dueDate || '',
        date: updatedData.date || this.transactions[index].date,
        notes: (updatedData.notes || '').trim(),
      };
      this.save();
      return this.transactions[index];
    }
    return null;
  }

  // Delete Transaction
  deleteTransaction(id) {
    const prevCount = this.transactions.length;
    this.transactions = this.transactions.filter(t => t.id !== id);
    if (this.transactions.length !== prevCount) {
      this.save();
      return true;
    }
    return false;
  }

  // Record Repayment Settlement for a Person
  recordSettlement({ person, amount, wallet, isLentRepayment, notes, date }) {
    // If isLentRepayment is true: Person is paying back what you lent them -> 'lent_repayment' (cash enters wallet)
    // If isLentRepayment is false: You are paying back what you borrowed from them -> 'borrowed_repayment' (cash leaves wallet)
    const type = isLentRepayment ? 'lent_repayment' : 'borrowed_repayment';
    const sourceDest = isLentRepayment
      ? `Debt settlement received from ${person}`
      : `Debt repayment paid to ${person}`;

    return this.addTransaction({
      type,
      amount: parseFloat(amount),
      person,
      sourceDest,
      wallet: wallet || 'cash',
      category: 'debt_loan',
      dueDate: '',
      date: date || new Date().toISOString().slice(0, 16),
      notes: notes || `Settlement recorded on ${new Date().toLocaleDateString('en-GB')}`,
    });
  }

  // Helper to get all unique counterparty person names for autocompletion
  getKnownPeople() {
    const peopleSet = new Set();
    this.transactions.forEach(t => {
      if (t.person && t.person.trim()) {
        peopleSet.add(t.person.trim());
      }
    });
    return Array.from(peopleSet).sort();
  }

  // Filter transactions by period
  filterByPeriod(transactions, period = this.settings.selectedPeriod) {
    if (period === 'all_time') return transactions;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    if (period === 'this_month') {
      return transactions.filter(t => {
        const d = new Date(t.date);
        return d >= startOfMonth && d <= endOfMonth;
      });
    }

    if (period === 'last_30_days') {
      const past30 = new Date(now);
      past30.setDate(past30.getDate() - 30);
      return transactions.filter(t => {
        const d = new Date(t.date);
        return d >= past30 && d <= now;
      });
    }

    if (period === 'this_year') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return transactions.filter(t => {
        const d = new Date(t.date);
        return d >= startOfYear && d <= now;
      });
    }

    return transactions;
  }

  // Calculations for Financial Summaries
  getOverviewMetrics(period = this.settings.selectedPeriod) {
    const periodTxns = this.filterByPeriod(this.transactions, period);

    // This month (or selected period) Income & Expenses
    let periodIncome = 0;
    let periodExpense = 0;

    periodTxns.forEach(t => {
      if (t.type === 'income') {
        periodIncome += t.amount;
      } else if (t.type === 'expense') {
        periodExpense += t.amount;
      }
    });

    // Net Wallet Balances (Calculated across ALL transactions for real cash on hand)
    const walletBalances = {
      cash: 0,
      bkash: 0,
      nagad: 0,
      bank: 0,
      credit_card: 0,
    };

    let totalWalletBalance = 0;

    this.transactions.forEach(t => {
      const amount = t.amount || 0;
      let delta = 0;

      // Flow in: income, borrowed, lent_repayment
      if (t.type === 'income' || t.type === 'borrowed' || t.type === 'lent_repayment') {
        delta = amount;
      }
      // Flow out: expense, lent, borrowed_repayment
      else if (t.type === 'expense' || t.type === 'lent' || t.type === 'borrowed_repayment') {
        delta = -amount;
      }

      if (walletBalances[t.wallet] !== undefined) {
        walletBalances[t.wallet] += delta;
      }
      totalWalletBalance += delta;
    });

    // Loan & Debt Metrics (Cumulative Outstanding)
    let totalLent = 0;
    let totalLentRepaid = 0;
    let totalBorrowed = 0;
    let totalBorrowedRepaid = 0;

    this.transactions.forEach(t => {
      if (t.type === 'lent') totalLent += t.amount;
      if (t.type === 'lent_repayment') totalLentRepaid += t.amount;
      if (t.type === 'borrowed') totalBorrowed += t.amount;
      if (t.type === 'borrowed_repayment') totalBorrowedRepaid += t.amount;
    });

    // Active Receivables (You are owed by others)
    const totalToCollect = Math.max(0, totalLent - totalLentRepaid);
    // Active Liabilities (You owe to others)
    const totalToRepay = Math.max(0, totalBorrowed - totalBorrowedRepaid);

    return {
      periodIncome,
      periodExpense,
      netSavings: periodIncome - periodExpense,
      totalWalletBalance,
      walletBalances,
      totalToCollect,
      totalToRepay,
      netWorth: totalWalletBalance + totalToCollect - totalToRepay,
      totalTxnCount: this.transactions.length,
    };
  }

  // Get Detailed Person Ledger for Loan Management
  getPeopleLedger() {
    const peopleMap = {};

    this.transactions.forEach(t => {
      if (!t.person || !t.person.trim()) return;
      const person = t.person.trim();

      if (!peopleMap[person]) {
        peopleMap[person] = {
          name: person,
          lent: 0,
          lentRepaid: 0,
          borrowed: 0,
          borrowedRepaid: 0,
          transactions: [],
          latestDueDate: null,
          hasOverdue: false,
        };
      }

      peopleMap[person].transactions.push(t);

      if (t.type === 'lent') peopleMap[person].lent += t.amount;
      if (t.type === 'lent_repayment') peopleMap[person].lentRepaid += t.amount;
      if (t.type === 'borrowed') peopleMap[person].borrowed += t.amount;
      if (t.type === 'borrowed_repayment') peopleMap[person].borrowedRepaid += t.amount;

      if (t.dueDate) {
        const due = new Date(t.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (!peopleMap[person].latestDueDate || due > new Date(peopleMap[person].latestDueDate)) {
          peopleMap[person].latestDueDate = t.dueDate;
        }
        if (due < today && (peopleMap[person].lent > peopleMap[person].lentRepaid || peopleMap[person].borrowed > peopleMap[person].borrowedRepaid)) {
          peopleMap[person].hasOverdue = true;
        }
      }
    });

    const result = Object.values(peopleMap).map(p => {
      // Net balance calculation:
      // Positive: They owe you money (Asset / To Collect)
      // Negative: You owe them money (Liability / To Repay)
      const netReceivable = (p.lent - p.lentRepaid) - (p.borrowed - p.borrowedRepaid);
      
      let status = 'settled';
      if (netReceivable > 0.01) status = 'owes_you';
      else if (netReceivable < -0.01) status = 'you_owe';

      return {
        ...p,
        netBalance: Math.abs(netReceivable),
        status, // 'owes_you', 'you_owe', 'settled'
        rawBalance: netReceivable,
        activeLentDue: Math.max(0, p.lent - p.lentRepaid),
        activeBorrowedDue: Math.max(0, p.borrowed - p.borrowedRepaid),
      };
    });

    // Sort: active balances first, then alphabetically
    return result.sort((a, b) => {
      if (a.status !== 'settled' && b.status === 'settled') return -1;
      if (a.status === 'settled' && b.status !== 'settled') return 1;
      return b.netBalance - a.netBalance || a.name.localeCompare(b.name);
    });
  }

  // Get Expense Breakdown by Category for Charts
  getCategoryExpenseBreakdown(period = this.settings.selectedPeriod) {
    const txns = this.filterByPeriod(this.transactions, period);
    const catMap = {};

    txns.forEach(t => {
      if (t.type === 'expense') {
        const catId = t.category || 'other_expense';
        catMap[catId] = (catMap[catId] || 0) + t.amount;
      }
    });

    const labels = [];
    const data = [];
    const colors = [];

    // Map into ordered array
    Object.keys(catMap).forEach(catId => {
      const catObj = CATEGORIES.find(c => c.id === catId) || { name: catId, color: '#94A3B8' };
      labels.push(catObj.name.split(' (')[0]); // Clean short label
      data.push(catMap[catId]);
      colors.push(catObj.color);
    });

    return { labels, data, colors };
  }

  // Get Cash Flow Comparison for Bar Chart
  getCashFlowDistribution(period = this.settings.selectedPeriod) {
    const txns = this.filterByPeriod(this.transactions, period);
    let income = 0;
    let expense = 0;
    let lent = 0;
    let borrowed = 0;

    txns.forEach(t => {
      if (t.type === 'income') income += t.amount;
      else if (t.type === 'expense') expense += t.amount;
      else if (t.type === 'lent') lent += t.amount;
      else if (t.type === 'borrowed') borrowed += t.amount;
    });

    return {
      labels: ['Income (আয়)', 'Expense (ব্যয়)', 'Lent (ধার দেওয়া)', 'Borrowed (ঋণ নেওয়া)'],
      data: [income, expense, lent, borrowed],
      colors: ['#10B981', '#EF4444', '#0284C7', '#F59E0B']
    };
  }

  // Export Transactions to CSV
  exportTransactionsCSV() {
    const headers = ['ID', 'Date', 'Type', 'Amount (BDT)', 'Person / Counterparty', 'Source / Destination', 'Wallet', 'Category', 'Due Date', 'Notes'];
    const rows = this.transactions.map(t => [
      t.id,
      t.date,
      TRANSACTION_TYPES[t.type]?.label || t.type,
      t.amount,
      `"${(t.person || '').replace(/"/g, '""')}"`,
      `"${(t.sourceDest || '').replace(/"/g, '""')}"`,
      t.wallet,
      t.category,
      t.dueDate || '',
      `"${(t.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HishabNikash_Transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Export Loan Ledger Summary to CSV
  exportLoanLedgerCSV() {
    const ledger = this.getPeopleLedger();
    const headers = ['Person Name', 'Status', 'Net Balance (BDT)', 'Total Lent', 'Lent Repaid', 'Total Borrowed', 'Borrowed Repaid', 'Latest Due Date'];
    const rows = ledger.map(p => [
      `"${p.name.replace(/"/g, '""')}"`,
      p.status === 'owes_you' ? 'Owes You (পাওনা)' : (p.status === 'you_owe' ? 'You Owe (দেনা)' : 'Settled (পরিশোধিত)'),
      p.netBalance,
      p.lent,
      p.lentRepaid,
      p.borrowed,
      p.borrowedRepaid,
      p.latestDueDate || 'N/A'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HishabNikash_Debt_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Export full JSON Backup
  exportJSONBackup() {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      transactions: this.transactions,
      settings: this.settings,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `HishabNikash_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  // Import JSON Backup
  importJSONBackup(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.transactions)) {
        this.transactions = data.transactions;
        if (data.settings) {
          this.settings = { ...this.settings, ...data.settings };
        }
        this.save();
        return { success: true, count: this.transactions.length };
      } else {
        return { success: false, error: 'Invalid backup file format: missing transactions array.' };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // Reset to Demo Data
  resetToDemo() {
    this.transactions = getDemoTransactions();
    this.save();
  }

  // Clear All Data
  clearAll() {
    this.transactions = [];
    this.save();
  }
}

// Global Store Instance
window.appStore = new Store();
