import React from 'react';
import { Card } from '../ui/Card';
import { cn } from '../../utils/cn';

interface StatCardProps {
  title: string;
  value: string;
  trend: string;
  isPositive: boolean;
  icon: React.ElementType;
  className?: string;
}

export default function StatCard({ title, value, trend, isPositive, icon: Icon, className }: StatCardProps) {
  return (
    <Card className={cn('flex flex-col relative overflow-hidden group', className)}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-medium text-text-secondary">{title}</p>
          <h3 className="text-2xl font-bold text-text-primary mt-1">{value}</h3>
        </div>
        <div className={cn(
          "p-2.5 rounded-xl transition-colors",
          isPositive ? "bg-success/10 text-success group-hover:bg-success/20" : "bg-danger/10 text-danger group-hover:bg-danger/20"
        )}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="flex items-center text-sm mt-auto">
        <span className={cn("font-medium", isPositive ? "text-success" : "text-danger")}>
          {trend}
        </span>
        <span className="text-text-secondary ml-2">vs last week</span>
      </div>
    </Card>
  );
}
