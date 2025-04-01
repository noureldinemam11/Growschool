import { useMemo } from 'react';
import { BehaviorPoint } from '@shared/schema';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { startOfDay, startOfWeek, startOfMonth, startOfYear, format, isWithinInterval } from 'date-fns';

interface BehaviorChartProps {
  points: BehaviorPoint[];
  timeframe: string;
}

const BehaviorChart = ({ points, timeframe }: BehaviorChartProps) => {
  // Calculate chart data using useMemo to prevent unnecessary re-renders
  const chartData = useMemo(() => {
    if (!points?.length) return [];
    
    const now = new Date();
    let startDate;
    let dateFormat;
    
    // Set date ranges based on timeframe
    switch (timeframe) {
      case 'day':
        startDate = startOfDay(now);
        dateFormat = 'HH:mm';
        break;
      case 'week':
        startDate = startOfWeek(now);
        dateFormat = 'EEE';
        break;
      case 'month':
        startDate = startOfMonth(now);
        dateFormat = 'dd';
        break;
      case 'year':
        startDate = startOfYear(now);
        dateFormat = 'MMM';
        break;
      default:
        startDate = startOfWeek(now);
        dateFormat = 'EEE';
    }
    
    try {
      // Filter points by timeframe
      const filteredPoints = points.filter(point => {
        const pointDate = new Date(point.timestamp);
        return pointDate >= startDate && pointDate <= now;
      });
      
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
      return Object.keys(groupedData).map(date => ({
        date,
        awarded: groupedData[date].positive,
        deducted: groupedData[date].negative
      }));
    } catch (error) {
      console.error('Error processing chart data:', error);
      return [];
    }
  }, [points, timeframe]);
  
  if (!chartData.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No data available for the selected timeframe</p>
      </div>
    );
  }
  
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
