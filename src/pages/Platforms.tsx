import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle2, XCircle, Search, Edit2, Trash2 } from 'lucide-react';
import Button from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';
import api from '../lib/api';

export default function Platforms() {
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlatforms = async () => {
      try {
        const res = await api.get('/platforms');
        if (res.data.success) {
          setPlatforms(res.data.data);
        }
      } catch (error) {
        toast.error('Failed to load platforms');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlatforms();
  }, []);

  const filteredPlatforms = platforms.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleStatus = async (id: string, currentStatus: boolean, name: string) => {
    try {
      const newStatus = !currentStatus;
      const res = await api.put(`/platforms/${id}`, { active: newStatus });
      if (res.data.success) {
        setPlatforms(platforms.map(p => p.id === id ? { ...p, active: newStatus } : p));
        toast.success(`${name} marked as ${newStatus ? 'Active' : 'Inactive'}`);
      }
    } catch (error) {
      toast.error('Failed to update platform');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Platform Management</h1>
          <p className="text-text-secondary mt-1">Manage the gigs and platforms you work for.</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Platform
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center bg-surface/30 rounded-t-2xl">
            <div className="w-full sm:max-w-md relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input 
                type="text" 
                placeholder="Search platforms..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-surface-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Platform Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-text-secondary">Loading platforms...</TableCell>
                </TableRow>
              ) : filteredPlatforms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-text-secondary">No platforms found.</TableCell>
                </TableRow>
              ) : (
                filteredPlatforms.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center font-bold text-primary">
                          {row.logo}
                        </div>
                        {row.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        row.active
                          ? 'bg-success/10 text-success border-success/20' 
                          : 'bg-surface text-text-secondary border-border'
                      }`}>
                        {row.active ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                        {row.active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => toggleStatus(row.id, row.active, row.name)}>
                          {row.active ? 'Disable' : 'Enable'}
                        </Button>
                      </div>
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
