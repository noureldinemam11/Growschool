import { useMemo } from 'react';
import { BehaviorPoint, BehaviorCategory } from '@shared/schema';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useQuery } from '@tanstack/react-query';

interface PointsDistributionChartProps {
  points: BehaviorPoint[];
}

// Static colors for different categories
const DEFAULT_COLORS = [
  '#3949AB', '#4CAF50', '#FFA726', '#9C27B0', 
  '#F44336', '#FF9800', '#FFEB3B', '#607D8B'
];

// Component with useMemo instead of useState + useEffect to prevent infinite renders
const PointsDistributionChart = ({ points }: PointsDistributionChartProps) => {
  // Fetch behavior categories
  const { data: categories } = useQuery<BehaviorCategory[]>({
    queryKey: ['/api/behavior-categories'],
  });
  
  // Compute chart data with useMemo to avoid unnecessary re-renders
  const chartData = useMemo(() => {
    if (!points?.length || !categories?.length) return [];
    
    // Create a lookup map for category names
    const categoryNames: Record<number, string> = {};
    const categoryColors: Record<number, string> = {};
    
    categories.forEach((category, index) => {
      categoryNames[category.id] = category.name;
      categoryColors[category.id] = DEFAULT_COLORS[index % DEFAULT_COLORS.length];
    });
    
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
    return Object.values(categoryData)
      .sort((a, b) => b.total - a.total)
      .map((item, index) => ({
        ...item,
        name: categoryNames[item.categoryId] || `Category ${item.categoryId}`,
        color: categoryColors[item.categoryId] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
      }));
  }, [points, categories]);
  
  if (!chartData.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No data available for chart</p>
      </div>
    );
  }
  
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
        <Tooltip formatter={(value, name) => [`${value} points`, name]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default PointsDistributionChart;
