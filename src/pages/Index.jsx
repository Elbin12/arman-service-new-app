import React from 'react';
import { Box, Container, Typography, Button, Card, CardContent } from '@mui/material';
import { BusinessCenter, Schedule, LocationOn } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', background: 'var(--gradient-light)' }}>
      {/* Hero Section */}
      <Container maxWidth="lg">
        <Box sx={{ pt: 8, pb: 6, textAlign: 'center' }}>
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 'bold',
              background: 'var(--gradient-primary)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2,
            }}
          >
            Professional Service Booking Platform
          </Typography>
          <Typography
            variant="h5"
            color="text.secondary"
            sx={{ mb: 4, maxWidth: '600px', mx: 'auto' }}
          >
            Streamline your service bookings with dynamic pricing, location management, and
            comprehensive end-to-end flows.
          </Typography>

          <Box
            sx={{
              display: 'flex',
              gap: 2,
              justifyContent: 'center',
              flexWrap: 'wrap',
              mt: 2,
            }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/booking')}
              sx={{
                background: 'var(--gradient-primary)',
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                '&:hover': {
                  background: 'var(--gradient-primary)',
                  opacity: 0.9,
                },
              }}
            >
              Get Quote
            </Button>
          </Box>
        </Box>

        {/* Features Section */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 4,
            mb: 8,
          }}
        >
          <Card sx={{ height: '100%', textAlign: 'center', p: 2, borderRadius: 2, boxShadow: 3 }}>
            <CardContent>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: 2,
                  background: 'hsl(var(--primary) / 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <BusinessCenter sx={{ fontSize: 32, color: 'hsl(var(--primary))' }} />
              </Box>
              <Typography variant="h6" gutterBottom>
                Service Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Comprehensive CRUD interface for managing services, packages, and features with
                dynamic pricing.
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ height: '100%', textAlign: 'center', p: 2, borderRadius: 2, boxShadow: 3 }}>
            <CardContent>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: 2,
                  background: 'hsl(var(--secondary) / 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <Schedule sx={{ fontSize: 32, color: 'hsl(var(--secondary))' }} />
              </Box>
              <Typography variant="h6" gutterBottom>
                Smart Booking Flow
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Multi-step booking process with dynamic questions and real-time pricing
                calculations.
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ height: '100%', textAlign: 'center', p: 2, borderRadius: 2, boxShadow: 3 }}>
            <CardContent>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: 2,
                  background: 'hsl(var(--success) / 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <LocationOn sx={{ fontSize: 32, color: 'hsl(var(--success))' }} />
              </Box>
              <Typography variant="h6" gutterBottom>
                Location Intelligence
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Google Places integration with automatic trip surcharge calculation based on
                location.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </Box>
  );
};

export default Index;
