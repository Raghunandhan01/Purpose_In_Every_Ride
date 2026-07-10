import React, { useState } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Download, 
  Printer, 
  Filter, 
  Search,
  FileText
} from 'lucide-react';
import { EmergencyFund, EmergencyFundTransaction } from '../../types/emergencyFund';
import toast from 'react-hot-toast';

interface TransactionListProps {
  funds: EmergencyFund[];
  transactions: EmergencyFundTransaction[];
}

export default function TransactionList({ funds, transactions }: TransactionListProps) {
  const [filterFundId, setFilterFundId] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Resolve fund names for transaction listing
  const getFundInfo = (fundId: string) => {
    const found = funds.find(f => f._id === fundId);
    return found ? { name: found.name, category: found.category } : { name: 'Unknown Goal', category: 'General' };
  };

  // Filter transaction records
  const filteredTransactions = transactions.filter(t => {
    const matchesFund = filterFundId === 'all' || t.fundId === filterFundId;
    const matchesType = filterType === 'all' || t.type === filterType;
    
    const fundInfo = getFundInfo(t.fundId);
    const matchesSearch = searchTerm === '' || 
      fundInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fundInfo.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.notes || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.source || '').toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFund && matchesType && matchesSearch;
  });

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      toast.error('No transactions available to export');
      return;
    }

    const headers = ['Transaction ID', 'Goal Name', 'Category', 'Type', 'Amount (INR)', 'Source', 'Date', 'Notes'];
    const rows = filteredTransactions.map(t => {
      const info = getFundInfo(t.fundId);
      return [
        t._id,
        info.name.replace(/,/g, ' '),
        info.category,
        t.type,
        t.amount,
        t.source,
        t.date,
        (t.notes || '').replace(/,/g, ' ')
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `scooter_emergency_fund_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV Report exported successfully!');
  };

  // Export to Excel-compatible CSV format
  const handleExportExcel = () => {
    if (filteredTransactions.length === 0) {
      toast.error('No transactions available to export');
      return;
    }

    // Tab-delimited values which Excel opens directly as a formatted spreadsheet without UTF-8 CSV bugs
    const headers = ['Transaction ID', 'Goal Name', 'Category', 'Type', 'Amount (INR)', 'Source', 'Date', 'Notes'];
    const rows = filteredTransactions.map(t => {
      const info = getFundInfo(t.fundId);
      return [
        t._id,
        info.name,
        info.category,
        t.type,
        t.amount,
        t.source,
        t.date,
        t.notes || ''
      ];
    });

    let excelContent = headers.join('\t') + '\n';
    rows.forEach(r => {
      excelContent += r.join('\t') + '\n';
    });

    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `scooter_savings_ledger_${new Date().toISOString().split('T')[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Excel-ready spreadsheet exported successfully!');
  };

  // Printable Report (High-fidelity PDF generator)
  const handlePrintPDF = () => {
    if (filteredTransactions.length === 0) {
      toast.error('No transactions available to print');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to generate print report');
      return;
    }

    const dateToday = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const rowsHtml = filteredTransactions.map((t, idx) => {
      const info = getFundInfo(t.fundId);
      return `
        <tr>
          <td>${idx + 1}</td>
          <td>${t.date}</td>
          <td><strong>${info.name}</strong><br/><small style="color: #666">${info.category}</small></td>
          <td style="color: ${t.type === 'Contribution' ? '#10b981' : '#ef4444'}; font-weight: bold;">${t.type}</td>
          <td>₹${t.amount.toLocaleString('en-IN')}</td>
          <td>${t.source}</td>
          <td>${t.notes || '-'}</td>
        </tr>
      `;
    }).join('');

    const totalIn = filteredTransactions.filter(t => t.type === 'Contribution').reduce((s, t) => s + t.amount, 0);
    const totalOut = filteredTransactions.filter(t => t.type === 'Withdrawal').reduce((s, t) => s + t.amount, 0);

    printWindow.document.write(`
      <html>
        <head>
          <title>Scooter Applet - Emergency Fund Audit Report</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; padding: 40px; }
            .header { display: flex; justify-content: space-between; border-b: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #facc15; text-shadow: 1px 1px 1px #1e293b; }
            .title { text-align: right; }
            .title h1 { margin: 0; font-size: 22px; color: #0f172a; }
            .title p { margin: 5px 0 0; font-size: 12px; color: #64748b; }
            .stats { display: flex; gap: 20px; margin-bottom: 35px; }
            .stat-card { flex: 1; border: 1px solid #cbd5e1; border-radius: 8px; padding: 15px; background: #f8fafc; }
            .stat-card span { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; }
            .stat-card div { font-size: 18px; font-weight: bold; margin-top: 5px; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; background: #0f172a; color: #ffffff; padding: 10px; font-size: 12px; }
            td { padding: 12px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
            tr:nth-child(even) { background: #f8fafc; }
            .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #94a3b8; border-t: 1px solid #e2e8f0; padding-top: 15px; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">⚡ SCOOTER</div>
            <div class="title">
              <h1>Emergency Fund Ledger Audit</h1>
              <p>Generated on ${dateToday}</p>
            </div>
          </div>
          
          <div class="stats">
            <div class="stat-card">
              <span>Total Transactions Listed</span>
              <div>${filteredTransactions.length}</div>
            </div>
            <div class="stat-card">
              <span>Total Accumulated Deposits</span>
              <div style="color: #10b981">₹${totalIn.toLocaleString('en-IN')}</div>
            </div>
            <div class="stat-card">
              <span>Total Audited Withdrawals</span>
              <div style="color: #ef4444">₹${totalOut.toLocaleString('en-IN')}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 5%">#</th>
                <th style="width: 12%">Date</th>
                <th style="width: 25%">Savings Goal & Category</th>
                <th style="width: 12%">Action</th>
                <th style="width: 12%">Amount</th>
                <th style="width: 15%">Source</th>
                <th style="width: 19%">Remarks / Notes</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="footer">
            Scooter Application for Gig-Economy Drivers - Highly Secure Financial Savings Record Ledger.
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="rounded-2xl border border-border bg-surface-card overflow-hidden">
      {/* Search / Filter bar */}
      <div className="p-6 border-b border-border space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-text-primary tracking-tight">Savings & Allocation Ledger</h3>
            <span className="text-xs text-text-secondary">Track the movement of funds inside your emergency savings accounts.</span>
          </div>

          {/* Export Action Tools */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-border bg-surface hover:border-primary/20 hover:text-primary transition-all text-xs font-semibold cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-border bg-surface hover:border-primary/20 hover:text-primary transition-all text-xs font-semibold cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" /> Excel
            </button>
            <button
              onClick={handlePrintPDF}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-border bg-surface hover:border-primary/20 hover:text-primary transition-all text-xs font-semibold cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> PDF Audit
            </button>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
          {/* Search text */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-text-secondary absolute left-3.5 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by goal, remarks, source..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-text-primary focus:outline-none focus:border-primary"
            />
          </div>

          {/* Filter by Goal */}
          <div className="relative">
            <select
              value={filterFundId}
              onChange={(e) => setFilterFundId(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs font-medium text-text-primary focus:outline-none focus:border-primary cursor-pointer appearance-none"
            >
              <option value="all">All Goals</option>
              {funds.map(f => (
                <option key={f._id} value={f._id}>{f.name}</option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-text-secondary absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Filter by Type */}
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs font-medium text-text-primary focus:outline-none focus:border-primary cursor-pointer appearance-none"
            >
              <option value="all">All Types</option>
              <option value="Contribution">Contributions (Deposit)</option>
              <option value="Withdrawal">Withdrawals</option>
            </select>
            <Filter className="w-3.5 h-3.5 text-text-secondary absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Grid of Results */}
      <div className="overflow-x-auto">
        {filteredTransactions.length === 0 ? (
          <div className="py-12 text-center text-text-secondary text-sm">
            No transaction entries found matching your query filters.
          </div>
        ) : (
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-surface/50 border-b border-border text-xs text-text-secondary uppercase tracking-wider font-semibold">
                <th className="py-3 px-6">Date</th>
                <th className="py-3 px-6">Savings Goal / Category</th>
                <th className="py-3 px-6">Transaction Type</th>
                <th className="py-3 px-6 text-right">Amount</th>
                <th className="py-3 px-6">Allocation Source</th>
                <th className="py-3 px-6">Audit Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredTransactions.map((t) => {
                const info = getFundInfo(t.fundId);
                const isContrib = t.type === 'Contribution';

                return (
                  <tr key={t._id} className="text-xs text-text-primary hover:bg-surface/30 transition-colors">
                    <td className="py-4 px-6 font-medium whitespace-nowrap text-text-secondary">
                      {t.date}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="font-bold text-text-primary">{info.name}</div>
                      <div className="text-[10px] text-text-secondary">{info.category}</div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        isContrib 
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                          : 'bg-danger/10 text-danger border border-danger/20'
                      }`}>
                        {isContrib ? (
                          <>
                            <ArrowDownLeft className="w-3 h-3 text-emerald-500" /> Deposit
                          </>
                        ) : (
                          <>
                            <ArrowUpRight className="w-3 h-3 text-danger" /> Withdrawal
                          </>
                        )}
                      </span>
                    </td>
                    <td className={`py-4 px-6 text-right font-extrabold whitespace-nowrap text-sm ${
                      isContrib ? 'text-emerald-500' : 'text-danger'
                    }`}>
                      {isContrib ? '+' : '-'}₹{(t.amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap font-semibold text-text-secondary">
                      {t.source}
                    </td>
                    <td className="py-4 px-6 text-text-secondary max-w-xs truncate" title={t.notes}>
                      {t.notes || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
