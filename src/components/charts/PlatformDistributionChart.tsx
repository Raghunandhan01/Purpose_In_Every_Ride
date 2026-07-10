import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { formatCurrency } from '../../utils/formatCurrency';

const defaultData = [
  { name: 'Uber', value: 8500 },
  { name: 'Swiggy', value: 12500 },
  { name: 'Zomato', value: 11800 },
  { name: 'Blinkit', value: 5200 },
];

const COLORS = ['#F7C54A', '#D8A41E', '#7284A3', '#A7B7D0'];

interface PlatformDistributionChartProps {
  data?: any[];
}

export default function PlatformDistributionChart({ data = defaultData }: PlatformDistributionChartProps) {
  const chartData = data && data.length > 0 ? data : defaultData;
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Platform Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number, name: string) => [formatCurrency(value), name]}
                contentStyle={{ backgroundColor: '#2E3A52', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.12)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#F7C54A', fontWeight: 'bold' }}
              />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
