import { FC, useEffect, useState } from 'react';
import { BehaviorPoint } from '@shared/schema';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { startOfDay, startOfWeek, startOfMonth, startOfYear, format, isWithinInterval } from 'date-fns';

interface BehaviorChartProps {
  points: BehaviorPoint[];
  timeframe: string;
}

const BehaviorChart: FC<BehaviorChartProps> = ({ points, timeframe }) => {
  const [chartData, setChartData] = useState<any[]>([]);
  
  useEffect(() => {
    const now = new Date();
    let startDate;
    let dateFormat;
    let groupBy: 'day' | 'week' | 'month';
    
    // Set date ranges based on timeframe
    switch (timeframe) {
      case 'day':
        startDate = startOfDay(now);
        dateFormat = 'HH:mm';
        groupBy = 'day';
        break;
      case 'week':
        startDate = startOfWeek(now);
        dateFormat = 'EEE';
        groupBy = 'day';
        break;
      case 'month':
        startDate = startOfMonth(now);
        dateFormat = 'dd';
        groupBy = 'day';
        break;
      case 'year':
        startDate = startOfYear(now);
        dateFormat = 'MMM';
        groupBy = 'month';
        break;
      default:
        startDate = startOfWeek(now);
        dateFormat = 'EEE';
        groupBy = 'day';
    }
    
    // Filter points by timeframe
    const filteredPoints = points.filter(point => 
      isWithinInterval(new Date(point.timestamp), {
        start: startDate,
        end: now
      })
    );
    
    // Group points by date
    const groupedData: Record<string, { positive: number; negative: number }> = {};
    
    filteredPoints.forEach(point => {
      const date = new Date(point.timestamp);
      const formattedDate = format(date, dateFormat);
      
      if (!groupedData[formattedDate]) {
        groupedData[formattedDate] = { positive: 0, negative: 0 };
      }
      
      if (point.points > 0) {
        groupedData[formattedDate].positive += point.points;
      } else {
        groupedData[formattedDate].negative += Math.abs(point.points);
      }
    });
    
    // Convert to chart format
    const data = Object.keys(groupedData).map(date => ({
      date,
      awarded: groupedData[date].positive,
      deducted: groupedData[date].negative
    }));
    
    setChartData(data);
  }, [points, timeframe]);
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="awarded" name="Points Awarded" fill="#3949AB" />
        <Bar dataKey="deducted" name="Points Deducted" fill="#EF5350" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default BehaviorChart;
