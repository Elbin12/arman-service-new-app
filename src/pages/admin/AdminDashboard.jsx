import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Paper,
} from '@mui/material';
import {
  BusinessCenter,
  LocationOn,
  QuestionAnswer,
  TrendingUp,
  ArrowForward,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const dashboardItems = [
  {
    title: 'Services',
    description: 'Manage your service offerings',
    icon: BusinessCenter,
    path: '/admin/services',
    color: 'hsl(var(--primary))',
    count: '12',
  },
  {
    title: 'Locations',
    description: 'Manage service locations',
    icon: LocationOn,
    path: '/admin/locations',
    color: 'hsl(var(--secondary))',
    count: '8',
  },
  {
    title: 'Questions',
    description: 'Build dynamic pricing questions',
    icon: QuestionAnswer,
    path: '/admin/questions',
    color: 'hsl(var(--success))',
    count: '24',
  },
];

export const AdminDashboard = () => {
  const navigate = useNavigate();

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom className="text-foreground font-bold">
        Dashboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" mb={4}>
        Welcome back! Here's an overview of your service booking platform.
      </Typography>

      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
        gap: 3,
        mb: 4 
      }}>
        {dashboardItems.map((item) => (
          <Card
            key={item.title}
            sx={{
              cursor: 'pointer',
              transition: 'var(--transition-normal)',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 'var(--shadow-lg)',
              },
            }}
            onClick={() => navigate(item.path)}
          >
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      background: `${item.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2,
                    }}
                  >
                    <item.icon sx={{ color: item.color }} />
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    {item.description}
                  </Typography>
                  <Typography variant="h4" color={item.color} fontWeight="bold">
                    {item.count}
                  </Typography>
                </Box>
                <IconButton size="small" sx={{ color: item.color }}>
                  <ArrowForward />
                </IconButton>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
        gap: 3 
      }}>
        <Paper sx={{ p: 3, height: 300 }}>
          <Typography variant="h6" gutterBottom>
            Recent Activity
          </Typography>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            height="200px"
            color="text.secondary"
          >
            <Typography>Activity chart will be implemented here</Typography>
          </Box>
        </Paper>
        
        <Paper sx={{ p: 3, height: 300 }}>
          <Typography variant="h6" gutterBottom>
            Quick Stats
          </Typography>
          <Box mt={3}>
            <Box display="flex" justifyContent="space-between" mb={2}>
              <Typography variant="body2">Total Bookings</Typography>
              <Typography variant="body2" fontWeight="bold">156</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" mb={2}>
              <Typography variant="body2">Revenue</Typography>
              <Typography variant="body2" fontWeight="bold">$12,450</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" mb={2}>
              <Typography variant="body2">Active Services</Typography>
              <Typography variant="body2" fontWeight="bold">12</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2">Pending Orders</Typography>
              <Typography variant="body2" fontWeight="bold">8</Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default AdminDashboard;