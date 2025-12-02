'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#c4704b', '#e07b5c', '#8b5a3c', '#d4a574', '#6b8e6b', '#a67c5b'];

interface DashboardChartProps {
  title: string;
  description: string;
  data: Array<{ name?: string; value?: number; revenue?: number; date?: string; units?: number }>;
  type: 'pie' | 'line';
}

export function DashboardChart({ title, description, data, type }: DashboardChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value) + ' AED';
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {type === 'pie' ? (
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="45%"
                labelLine={true}
                label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                outerRadius={90}
                innerRadius={0}
                fill="#8884d8"
                dataKey="value"
                paddingAngle={2}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, _name: string, props) => [
                  `${value} units (${formatCurrency(props.payload.revenue || 0)})`,
                  props.payload.name,
                ]}
              />
              <Legend 
                layout="horizontal" 
                verticalAlign="bottom" 
                align="center"
                wrapperStyle={{ paddingTop: '20px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === 'revenue') return [formatCurrency(value), 'Revenue'];
                  return [value, 'Units'];
                }}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                stroke="#f43f5e"
                strokeWidth={2}
                dot={{ fill: '#f43f5e', strokeWidth: 2 }}
                activeDot={{ r: 6 }}
                name="Revenue"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="units"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ fill: '#6366f1', strokeWidth: 2 }}
                activeDot={{ r: 6 }}
                name="Units"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

