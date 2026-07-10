import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Car, Utensils, Package, ArrowUpRight } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatCurrency';

interface RecentActivityProps {
  logs?: any[];
}

export default function RecentActivity({ logs = [] }: RecentActivityProps) {
  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'ride': return Car;
      case 'delivery': return Package;
      default: return Utensils;
    }
  };

  return (
    <Card className="col-span-full lg:col-span-1">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Activity</CardTitle>
        <Link to="/dashboard/transactions" className="text-sm text-primary hover:text-primary-dark font-medium flex items-center gap-1">
          View all <ArrowUpRight className="w-4 h-4" />
        </Link>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="py-8 text-center text-text-secondary text-sm">
            No recent activity found.
          </div>
        ) : (
          <div className="space-y-6 mt-4">
            {logs.map((log: any, index: number) => {
              const Icon = getIcon(log.type || 'delivery');
              const itemKey = log.id || log._id || index;
              return (
                <div key={itemKey} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary text-white">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{log.platformName || 'Unknown Platform'}</p>
                      <p className="text-xs text-text-secondary">{new Date(log.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className="font-semibold text-success">+{formatCurrency(log.amount || 0)}</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
