import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { formatCurrency } from '../../utils/formatCurrency';

const defaultData = [
  { name: 'Mon', earnings: 980 },
  { name: 'Tue', earnings: 1140 },
  { name: 'Wed', earnings: 860 },
  { name: 'Thu', earnings: 1320 },
  { name: 'Fri', earnings: 1680 },
  { name: 'Sat', earnings: 1950 },
  { name: 'Sun', earnings: 1720 },
];

interface EarningsChartProps {
  data?: any[];
}

export default function EarningsChart({ data = defaultData }: EarningsChartProps) {
  const chartData = data && data.length > 0 ? data : defaultData;
  return (
    <Card className="col-span-full lg:col-span-2 h-full">
      <CardHeader>
        <CardTitle>Weekly Earnings Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F7C54A" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F7C54A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.12)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#D1D9E6', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#D1D9E6', fontSize: 12 }} tickFormatter={(val) => formatCurrency(val)} />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Earnings']}
                contentStyle={{ backgroundColor: '#2E3A52', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.12)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#F7C54A', fontWeight: 'bold' }}
              />
              <Area 
                type="monotone" 
                dataKey="earnings" 
                stroke="#F7C54A" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorEarnings)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
