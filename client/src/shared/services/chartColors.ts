export const chartColors = {
  primary: '#3B82F6',
  secondary: '#6B7280',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#06B6D4',
  
  // Gradient colors for charts
  gradients: {
    blue: ['#3B82F6', '#1D4ED8'],
    green: ['#10B981', '#059669'],
    purple: ['#8B5CF6', '#7C3AED'],
    orange: ['#F59E0B', '#D97706'],
    red: ['#EF4444', '#DC2626'],
    teal: ['#06B6D4', '#0891B2'],
  },
  
  // Category colors for different data types
  categories: {
    revenue: '#10B981',
    cost: '#EF4444',
    profit: '#3B82F6',
    usage: '#8B5CF6',
    performance: '#F59E0B',
    efficiency: '#06B6D4',
  },
  
  // Semantic colors
  semantic: {
    positive: '#10B981',
    negative: '#EF4444',
    neutral: '#6B7280',
    highlight: '#F59E0B',
  },
  
  // Accessibility-friendly colors
  accessible: {
    blue: '#2563EB',
    green: '#059669',
    red: '#DC2626',
    yellow: '#D97706',
    purple: '#7C3AED',
    teal: '#0891B2',
  }
};

export const getChartColor = (index: number, palette: keyof typeof chartColors.gradients = 'blue'): string => {
  const colors = [
    chartColors.primary,
    chartColors.success,
    chartColors.warning,
    chartColors.danger,
    chartColors.info,
    chartColors.gradients.purple[0],
    chartColors.gradients.orange[0],
    chartColors.gradients.teal[0],
  ];
  
  return colors[index % colors.length];
};

export const getGradientColors = (palette: keyof typeof chartColors.gradients = 'blue'): string[] => {
  return chartColors.gradients[palette];
}; 