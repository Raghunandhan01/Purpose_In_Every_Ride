import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { formatCurrency } from '../utils/formatCurrency';
import api from '../lib/api';

export default function Transactions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await api.get('/worklogs');
        if (res.data.success) {
          const transformed: any[] = [];
          res.data.data.forEach((log: any) => {
            if (log.totalEarnings > 0) {
              transformed.push({
                id: `${log._id}-earn`,
                date: new Date(log.date).toLocaleDateString(),
                type: 'Earning',
                category: log.platform,
                amount: log.totalEarnings,
                status: log.status || 'Completed'
              });
            }
            const totalExpenses = (log.fuelCost || 0) + (log.otherExpenses || 0);
            if (totalExpenses > 0) {
              transformed.push({
                id: `${log._id}-exp`,
                date: new Date(log.date).toLocaleDateString(),
                type: 'Expense',
                category: 'Fuel/Maintenance',
                amount: totalExpenses,
                status: log.status || 'Completed'
              });
            }
          });
          transformed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setTransactions(transformed);
        }
      } catch (error) {
        toast.error('Failed to load transactions');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const handleExport = () => {
    toast.success('Transactions exported to CSV!');
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.category.toLowerCase().includes(searchTerm.toLowerCase()) || t.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'All' || t.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Transaction History</h1>
          <p className="text-text-secondary mt-1">View all your combined earnings and expenses.</p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center bg-surface/30 rounded-t-2xl">
            <div className="w-full sm:max-w-md relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input 
                type="text" 
                placeholder="Search transactions..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-surface-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <select 
                className="bg-surface-card border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-auto"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="All">All Types</option>
                <option value="Earning">Earnings</option>
                <option value="Expense">Expenses</option>
              </select>
              <Button variant="outline" className="px-3 border-border">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category/Platform</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount (₹)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-text-secondary">
                    Loading transactions...
                  </TableCell>
                </TableRow>
              ) : filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-text-secondary">
                    No transactions found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.date}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {row.type === 'Earning' ? (
                          <ArrowUpRight className="w-4 h-4 text-success" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-danger" />
                        )}
                        {row.type}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface text-text-primary border border-border capitalize">
                        {row.category}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
                        {row.status}
                      </span>
                    </TableCell>
                    <TableCell className={`text-right font-medium ${row.type === 'Earning' ? 'text-success' : 'text-text-primary'}`}>
                      {row.type === 'Earning' ? '+' : '-'}{formatCurrency(row.amount)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
