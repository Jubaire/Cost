# HishabNikash (হিসাবনিকাশ) - Personal Expense & Loan Manager

A fully functional, aesthetic, modern, and mobile/web/desktop-responsive **Personal Expense & Loan Manager** web application built with HTML5, Tailwind CSS, and vanilla JavaScript.

Designed specifically for personal cash flow management with Bangladeshi financial context (BDT `৳` currency, bKash, Nagad, Bank accounts, cash flow, and informal loans/debts with friends, family, and colleagues).

---

## 🌟 Key Features & Modules

### 1. Transaction Entry Module (Data Input)
- **4 Primary Transaction Types**:
  - 🟢 **Income (আয়/জমা)**: Salary, Freelancing, Gifts, Investments (+ to wallet balance).
  - 🔴 **Expense (খরচ)**: Food, Rent, Transport, Utilities, Recharges, Medical (- from wallet balance).
  - 🔵 **Lent Money (কাউকে ধার দেওয়া)**: Money given to someone (Receivable asset, - from wallet, tracked in debt ledger).
  - 🟠 **Borrowed Money (কারো কাছ থেকে ঋণ নেওয়া)**: Money borrowed from someone (Liability debt, + to wallet, tracked in debt ledger).
  - 🔄 **Settlement Repayments**: Automatically records repayments and updates wallet and debt balances.
- **BDT (৳) Currency Input**: With quick preset increment buttons (`+500`, `+1,000`, `+5,000`).
- **Person / Counterparty Tracking**: Required when lending or borrowing with autocomplete suggestions from previously recorded people.
- **Source / Destination**: Specific details on where money went or came from.
- **Payment Method / Wallet**: Cash (নগদ), bKash (বিকাশ), Nagad (নগদ), Bank Account (ব্যাংক), Credit Card (ক্রেডিট কার্ড).
- **15+ Categorized Icons**: Food, Transport, Rent, Utility, Recharge, Shopping, Medical, Education, Salary, Freelance, Gift, Loan, etc.
- **Due / Settlement Date**: Optional target repayment date with automatic overdue notifications.
- **Date & Time Picker**: Defaults to current date and time with a 1-click "Set to Now" shortcut.
- **Notes & Memo**: Add optional context for each transaction.

### 2. Dashboard & Financial Overview
- **Top 5 Summary Stat Cards**:
  1. **Total Income (This Month / Selected Period)**
  2. **Total Expenses (This Month / Selected Period)**
  3. **Net Wallet Balance (Cash + bKash + Nagad + Bank + Card)**
  4. **Total Given as Loan / To Collect (কাউকে দেওয়া মোট পাওনা টাকা)**
  5. **Total Borrowed / To Pay Back (কারো কাছ থেকে নেওয়া মোট দেনা/ঋণ)**
- **Net Period Cash Flow**: Clear badge showing net savings/deficit for the selected period.
- **Visual Interactive Charts (Chart.js)**:
  - 🍩 **Expense by Category Doughnut Chart**: Interactive hover tooltips with BDT formatting and percentage of total expenses.
  - 📊 **Cash Flow & Loan Distribution Bar Chart**: Side-by-side comparison of Income vs. Expense vs. Lent vs. Borrowed.
- **Upcoming & Overdue Loan Alerts**: Real-time alerts for loans that are overdue or approaching due dates with 1-click settlement.
- **Recent Transactions Widget**: Latest transactions with instant links to the full ledger.
- **Period Filter**: Seamlessly switch between "This Month", "Last 30 Days", "This Year", and "All Time".

### 3. Dedicated "Loan & Debt Ledger" Module (ধার দেনার হিসাব)
- **Net Balance Per Counterparty**: Aggregates all lent money, borrowed money, and partial repayments for each person (e.g., *"Rahim owes you ৳5,000"*, *"You owe Karim ৳2,000"*).
- **Status Indicators**:
  - `Owes You (পাওনা)`: Money you have to collect.
  - `You Owe (দেনা)`: Money you have to repay.
  - `Settled (পরিশোধিত)`: All loans with this person have been settled.
- **1-Click Quick Settle / Repay Modal**:
  - Record full or partial repayments with custom amounts.
  - Choose which wallet (Cash, bKash, Bank, etc.) received or paid the money.
  - Automatically updates the main wallet balance and reduces the debt.
  - Celebratory confetti animation upon settling debts! 🎉
- **Counterparty Statement & History**:
  - Click "History" on any person card to view their complete statement of loans and repayments.
  - 1-click printable statement for transparent settlements.

### 4. Detailed History & Filterable Ledger Table
- **Multi-Parameter Search & Filters**:
  - Search by note, person name, category, wallet, or amount.
  - Filter by transaction type (Income, Expense, Lent, Borrowed, Repayments, or All Loans).
  - Filter by category and wallet.
  - Filter by date range: Today, This Week, This Month, Last Month, All Time, or Custom Date Range.
  - Sort by Date (newest/oldest) or Amount (highest/lowest).
- **Dynamic Stats Bar**: Computes filtered Total In, Total Out, and Net for your active search results.
- **Color Coded Badges**:
  - Income: Green (`#10B981`)
  - Expense: Red (`#EF4444`)
  - Lent: Blue (`#0284C7`)
  - Borrowed: Orange/Amber (`#F59E0B`)
- **Responsive Layout**: High-density table on desktop and touch-friendly cards on mobile devices.
- **Full CRUD Support**: Edit any transaction in-place or delete with a safe confirmation modal.

### 5. Wallets & Accounts Overview
- Detailed breakdown of each wallet/method (Cash, bKash, Nagad, Bank, Credit Card).
- Shows live available balance, total money in, total money out, and transaction count.
- 1-click shortcut to filter all transactions by that specific wallet.

### 6. Data Storage & Export
- **100% Client-Side LocalStorage**: Your financial data remains private on your machine.
- **CSV / Excel Exports**:
  - Download all transactions to CSV.
  - Download loan and debt ledger summary to CSV.
- **JSON Backup & Restore**: Download full encrypted JSON backup to transfer data between devices or restore anytime.
- **Realistic Sample Data**: 1-click button to load realistic Bangladeshi sample transactions or clear everything to start fresh.

### 7. Aesthetic Design & Responsive UI/UX
- Built with Tailwind CSS, Inter font, and Hind Siliguri font for crisp English & Bengali typography.
- Light and Dark mode toggle with persistent preference.
- Mobile floating action button (FAB `+`) and sticky bottom navigation.
- Smooth modal transitions, micro-interactions, and toast alerts.

---

## 🚀 How to Run the Application

This web application has **zero dependencies to build or compile**. Simply open `index.html` in any web browser:

1. Double-click `index.html` or right-click and choose **Open with Google Chrome / Microsoft Edge / Firefox / Safari**.
2. Alternatively, serve via any local web server (e.g. VS Code Live Server or Python `python -m http.server 8000`).

---

## 📁 File Structure

```text
├── index.html            # Main semantic HTML5 layout, modals, tabs, and CDN imports
├── css/
│   └── styles.css        # Custom styles, fonts, scrollbars, print styles, and micro-animations
├── js/
│   ├── state.js          # Central state store, calculations, balances, local storage & CSV export
│   ├── charts.js         # Chart.js visualizations (Category Doughnut & Cash Flow Bar charts)
│   ├── loans.js          # Dedicated Loan & Debt ledger module, people grouping & settlement modal
│   ├── transactions.js   # Transaction CRUD, table filters, search, pagination & modal forms
│   └── app.js            # Main controller, navigation tabs, theme toggle, toast notifications & backups
└── README.md             # Complete documentation and user guide
```
