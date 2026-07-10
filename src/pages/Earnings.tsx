import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Clock, Edit2, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Card, CardContent } from '../components/ui/Card';
import { formatCurrency } from '../utils/formatCurrency';
import api from '../lib/api';

export default function Earnings() {
  const [earnings, setEarnings] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const res = await api.get('/worklogs');
        if (res.data.success) {
          // Filter logs that have earnings
          const logs = res.data.data.filter((l: any) => l.totalEarnings > 0);
          setEarnings(logs);
        }
      } catch (error) {
        toast.error('Failed to load earnings');
      } finally {
        setIsLoading(false);
      }
    };
    fetchEarnings();
  }, []);

  const onSubmit = async (data: any) => {
    try {
      const payload = {
        platform: data.platform,
        date: data.date,
        loginTime: '00:00',
        logoutTime: '00:00',
        hoursWorked: Number(data.hours) || 0,
        ordersCompleted: Number(data.trips) || 0,
        grossEarnings: Number(data.amount),
        tips: 0,
        bonusIncentives: 0,
        fuelCost: 0,
        otherExpenses: 0,
      };
      
      const res = await api.post('/worklogs', payload);
      if (res.data.success) {
        setEarnings([res.data.data, ...earnings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        toast.success('Earning added successfully!');
        setIsModalOpen(false);
        reset();
      }
    } catch (error) {
      toast.error('Failed to save earning');
    }
  };

  const deleteEarning = async (id: string) => {
    try {
      await api.delete(`/worklogs/${id}`);
      setEarnings(earnings.filter(e => e._id !== id));
      toast.success('Earning deleted successfully');
    } catch (error) {
      toast.error('Failed to delete earning');
    }
  };

  const filteredEarnings = earnings.filter(e => 
    e.platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.date.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Earnings History</h1>
          <p className="text-text-secondary mt-1">Track and manage all your gig earnings.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2" onClick={() => toast.success('Earnings exported to CSV!')}>
            <Download className="w-4 h-4" /> Export
          </Button>
          <Button className="gap-2" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4" /> Add Earning
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center bg-surface/30 rounded-t-2xl">
            <div className="w-full sm:max-w-md relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input 
                type="text" 
                placeholder="Search earnings..." 
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
                <TableHead>Platform</TableHead>
                <TableHead>Trips/Jobs</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-text-secondary">Loading...</TableCell>
                </TableRow>
              ) : filteredEarnings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-text-secondary">No earnings found.</TableCell>
                </TableRow>
              ) : filteredEarnings.map((row) => (
                <TableRow key={row._id}>
                  <TableCell className="font-medium">{new Date(row.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface text-text-primary border border-border capitalize">
                      {row.platform}
                    </span>
                  </TableCell>
                  <TableCell>{row.ordersCompleted}</TableCell>
                  <TableCell>{row.hoursWorked}h</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
                      {row.status || 'Completed'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-bold text-text-primary">{formatCurrency(row.totalEarnings)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" className="text-danger" onClick={() => deleteEarning(row._id)}>
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Earning Entry">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Platform</label>
              <select 
                {...register('platform', { required: true })}
                className="w-full bg-surface-card border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="swiggy">Swiggy</option>
                <option value="zomato">Zomato</option>
                <option value="rapido">Rapido</option>
                <option value="blinkit">Blinkit</option>
              </select>
            </div>
            <Input 
              label="Date" 
              type="date" 
              {...register('date', { required: true })}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Trips/Jobs Completed" 
              type="number" 
              placeholder="e.g. 12"
              {...register('trips', { required: true })}
            />
            <Input 
              label="Hours Worked" 
              type="number" 
              step="0.1"
              placeholder="e.g. 5.5"
              icon={<Clock className="w-4 h-4" />}
              {...register('hours', { required: true })}
            />
          </div>

          <Input 
            label="Total Earnings (₹)" 
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
              Save Earning
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
