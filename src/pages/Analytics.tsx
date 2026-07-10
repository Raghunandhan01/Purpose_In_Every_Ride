import React, { useState, useEffect } from 'react';
import EarningsChart from '../components/charts/EarningsChart';
import PlatformDistributionChart from '../components/charts/PlatformDistributionChart';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import api from '../lib/api';

import { formatCurrency } from '../utils/formatCurrency';

const defaultExpenseData = [
  { name: 'Mon', fuel: 150, maintenance: 0, food: 80 },
  { name: 'Tue', fuel: 120, maintenance: 0, food: 100 },
  { name: 'Wed', fuel: 180, maintenance: 0, food: 60 },
  { name: 'Thu', fuel: 100, maintenance: 850, food: 120 },
  { name: 'Fri', fuel: 200, maintenance: 0, food: 90 },
  { name: 'Sat', fuel: 180, maintenance: 0, food: 150 },
  { name: 'Sun', fuel: 160, maintenance: 0, food: 120 },
];

const defaultEarningsVsExpenses = [
  { name: 'Mon', earnings: 980, expenses: 230 },
  { name: 'Tue', earnings: 1140, expenses: 220 },
  { name: 'Wed', earnings: 860, expenses: 240 },
  { name: 'Thu', earnings: 1320, expenses: 1070 },
  { name: 'Fri', earnings: 1680, expenses: 290 },
  { name: 'Sat', earnings: 1950, expenses: 330 },
  { name: 'Sun', earnings: 1720, expenses: 280 },
];

const defaultWorkingHours = [
  { name: 'Mon', hours: 5.5, orders: 12 },
  { name: 'Tue', hours: 6, orders: 15 },
  { name: 'Wed', hours: 4.5, orders: 10 },
  { name: 'Thu', hours: 7, orders: 18 },
  { name: 'Fri', hours: 8, orders: 22 },
  { name: 'Sat', hours: 9, orders: 25 },
  { name: 'Sun', hours: 8.5, orders: 24 },
];

export default function Analytics() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/analytics/full');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (error) {
        console.warn('Failed to load full analytics, using default fallbacks');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const expenseData = data?.expenseChart || defaultExpenseData;
  const earningsVsExpenses = data?.earningsVsExpensesChart || defaultEarningsVsExpenses;
  const workingHours = data?.workingHoursChart || defaultWorkingHours;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Analytics</h1>
        <p className="text-text-secondary mt-1">Deep dive into your performance metrics.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <EarningsChart data={data?.earningsChart} />
        <PlatformDistributionChart data={data?.platformChart} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expenseData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7DED5" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B5B53', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B5B53', fontSize: 12 }} tickFormatter={(val) => formatCurrency(val)} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [formatCurrency(value), name]}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                  <Bar dataKey="fuel" name="Fuel" stackId="a" fill="#6F4E37" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="maintenance" name="Maintenance" stackId="a" fill="#A67B5B" />
                  <Bar dataKey="food" name="Food" stackId="a" fill="#E8D8C3" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Earnings vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={earningsVsExpenses} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7DED5" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B5B53', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B5B53', fontSize: 12 }} tickFormatter={(val) => formatCurrency(val)} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [formatCurrency(value), name]}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                  <Line type="monotone" dataKey="earnings" name="Earnings" stroke="#6F4E37" strokeWidth={3} dot={{ r: 4, fill: '#6F4E37' }} />
                  <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#ef4444' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Working Hours Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workingHours} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7DED5" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B5B53', fontSize: 12 }} dy={10} />
                  <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{ fill: '#6B5B53', fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#6B5B53', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                  <Bar yAxisId="left" dataKey="hours" name="Hours Worked" fill="#6F4E37" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="orders" name="Orders Completed" fill="#A67B5B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
