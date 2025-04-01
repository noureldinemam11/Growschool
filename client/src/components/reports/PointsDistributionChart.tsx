import { FC, useEffect, useState } from 'react';
import { BehaviorPoint, BehaviorCategory } from '@shared/schema';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useQuery } from '@tanstack/react-query';

interface PointsDistributionChartProps {
  points: BehaviorPoint[];
}

// We'd normally fetch these from the API
const CATEGORY_COLORS: Record<number, string> = {
  1: '#3949AB', // Academic Excellence
  2: '#4CAF50', // Helping Others
  3: '#FFA726', // Teamwork
  4: '#9C27B0', // Leadership
  5: '#F44336', // Classroom Disruption
  6: '#FF9800', // Late Assignment
  7: '#FFEB3B'  // Tardiness
};

const DEFAULT_COLORS = [
  '#3949AB', '#4CAF50', '#FFA726', '#9C27B0', 
  '#F44336', '#FF9800', '#FFEB3B', '#607D8B'
];

const PointsDistributionChart: FC<PointsDistributionChartProps> = ({ points }) => {
  const [chartData, setChartData] = useState<any[]>([]);
  
  // Fetch behavior categories
  const { data: categories } = useQuery<BehaviorCategory[]>({
    queryKey: ['/api/behavior-categories'],
  });
  
  // Create a lookup map for category names
  const categoryNames = categories?.reduce<Record<number, string>>((acc, category) => {
    acc[category.id] = category.name;
    return acc;
  }, {}) || {};
  
  useEffect(() => {
    // Group points by category
    const categoryData: Record<number, { categoryId: number; total: number }> = {};
    
    points.forEach(point => {
      if (!categoryData[point.categoryId]) {
        categoryData[point.categoryId] = { 
          categoryId: point.categoryId, 
          total: 0 
        };
      }
      
      // For a pie chart, we're interested in absolute values
      categoryData[point.categoryId].total += Math.abs(point.points);
    });
    
    // Convert to chart format and sort by total
    const data = Object.values(categoryData)
      .sort((a, b) => b.total - a.total)
      .map((item, index) => ({
        ...item,
        name: categoryNames[item.categoryId] || `Category ${item.categoryId}`,
        color: CATEGORY_COLORS[item.categoryId] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
      }));
    
    setChartData(data);
  }, [points, categoryNames]);
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="total"
          nameKey="name"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value, name, props) => [`${value} points`, name]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default PointsDistributionChart;
