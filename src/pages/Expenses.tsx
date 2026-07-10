import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Fuel, Wrench, FileText, Edit2, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Card, CardContent } from '../components/ui/Card';
import StatCard from '../components/dashboard/StatCard';
import { formatCurrency } from '../utils/formatCurrency';
import api from '../lib/api';

export default function Expenses() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const res = await api.get('/worklogs');
        if (res.data.success) {
          const logs = res.data.data
            .filter((l: any) => (l.fuelCost || 0) + (l.otherExpenses || 0) > 0)
            .map((l: any) => ({
              id: l._id,
              date: new Date(l.date).toLocaleDateString(),
              category: l.fuelCost > 0 ? 'Fuel' : 'Other Expenses',
              description: l.notes || 'Work Expense',
              amount: (l.fuelCost || 0) + (l.otherExpenses || 0)
            }));
          setExpenses(logs);
        }
      } catch (error) {
        toast.error('Failed to load expenses');
      } finally {
        setIsLoading(false);
      }
    };
    fetchExpenses();
  }, []);

  const onSubmit = async (data: any) => {
    try {
      const payload = {
        platform: 'swiggy', // Default fallback
        date: data.date,
        loginTime: '00:00',
        logoutTime: '00:00',
        hoursWorked: 0,
        ordersCompleted: 0,
        grossEarnings: 0,
        tips: 0,
        bonusIncentives: 0,
        fuelCost: data.category === 'Fuel' ? Number(data.amount) : 0,
        otherExpenses: data.category !== 'Fuel' ? Number(data.amount) : 0,
        notes: data.description,
      };
      
      const res = await api.post('/worklogs', payload);
      if (res.data.success) {
        const l = res.data.data;
        const newExpense = {
          id: l._id,
          date: new Date(l.date).toLocaleDateString(),
          category: l.fuelCost > 0 ? 'Fuel' : 'Other Expenses',
          description: l.notes || 'Work Expense',
          amount: (l.fuelCost || 0) + (l.otherExpenses || 0)
        };
        setExpenses([newExpense, ...expenses]);
        toast.success('Expense added successfully!');
        setIsModalOpen(false);
        reset();
      }
    } catch (error) {
      toast.error('Failed to save expense');
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      await api.delete(`/worklogs/${id}`);
      setExpenses(expenses.filter(e => e.id !== id));
      toast.success('Expense deleted successfully');
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };

  const filteredExpenses = expenses.filter(e => 
    e.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalFuel = expenses.filter(e => e.category === 'Fuel').reduce((sum, e) => sum + e.amount, 0);
  const totalOther = expenses.filter(e => e.category !== 'Fuel').reduce((sum, e) => sum + e.amount, 0);
  const totalAll = totalFuel + totalOther;

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Expenses</h1>
          <p className="text-text-secondary mt-1">Manage your work-related costs.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2" onClick={() => toast.success('Expenses exported to CSV!')}>
            <Download className="w-4 h-4" /> Export
          </Button>
          <Button className="gap-2" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4" /> Add Expense
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard 
          title="Total Expenses (₹)" 
          value={formatCurrency(totalAll)} 
          trend="0%" 
          isPositive={false} 
          icon={FileText} 
        />
        <StatCard 
          title="Fuel Costs (₹)" 
          value={formatCurrency(totalFuel)} 
          trend="0%" 
          isPositive={true} 
          icon={Fuel} 
        />
        <StatCard 
          title="Other / Maintenance (₹)" 
          value={formatCurrency(totalOther)} 
          trend="0%" 
          isPositive={true} 
          icon={Wrench} 
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center bg-surface/30 rounded-t-2xl">
            <div className="w-full sm:max-w-md relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input 
                type="text" 
                placeholder="Search expenses..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-surface-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-text-secondary">Loading...</TableCell>
                </TableRow>
              ) : filteredExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-text-secondary">No expenses found.</TableCell>
                </TableRow>
              ) : filteredExpenses.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.date}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface text-text-primary border border-border capitalize">
                      {row.category}
                    </span>
                  </TableCell>
                  <TableCell className="text-text-secondary">{row.description}</TableCell>
                  <TableCell className="text-right font-bold text-danger">-{formatCurrency(row.amount)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" className="text-danger" onClick={() => deleteExpense(row.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Expense Entry">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Category</label>
              <select 
                {...register('category', { required: true })}
                className="w-full bg-surface-card border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="Fuel">Fuel</option>
                <option value="Food">Food</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Parking">Parking</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <Input 
              label="Date" 
              type="date" 
              {...register('date', { required: true })}
            />
          </div>
          
          <Input 
            label="Description" 
            type="text" 
            placeholder="e.g. Petrol at Shell"
            {...register('description', { required: true })}
          />

          <Input 
            label="Amount (₹)" 
            type="number" 
            step="1"
            placeholder="0"
            icon={<span className="text-text-secondary font-medium">₹</span>}
            {...register('amount', { required: 'Amount is required' })}
            error={errors.amount?.message as string}
          />

          <div className="pt-4 flex gap-3 justify-end border-t border-border mt-6">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save Expense
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
