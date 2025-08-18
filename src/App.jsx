import React from 'react';
import { Provider } from 'react-redux';
import { persistor, store } from './store/index.js';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

// Import pages
import Index from "./pages/Index.jsx";
import NotFound from "./pages/NotFound.jsx";
import { AdminLayout } from './components/layouts/AdminLayout.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import ServicesManagement from './pages/admin/ServicesManagement.jsx';
import LocationsManagement from './pages/admin/LocationsManagement.jsx';
import { BookingWizard } from './components/user/BookingWizard.jsx';
import UserLogin from './pages/admin/userLogin.jsx';
import AdminProtectedRoute from './pages/AdminProtectedRoute.jsx';
import QuoteDetailsPage from './pages/user/QuoteDetailsPage.jsx';
import HouseSizeInfo from './components/admin/HouseSizeInfo.jsx';
import { PersistGate } from 'redux-persist/integration/react';

// Create Material-UI theme that integrates with our design system
const theme = createTheme({
  palette: {
    primary: {
      main: 'hsl(224, 76%, 48%)',
    },
    secondary: {
      main: 'hsl(259, 70%, 55%)',
    },
    background: {
      default: 'hsl(0, 0%, 100%)',
      paper: 'hsl(0, 0%, 100%)',
    },
  },
  typography: {
    fontFamily: '"Inter", "system-ui", sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
});

const queryClient = new QueryClient();

function App() {
  
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={theme}>
            <CssBaseline />
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/booking" element={<BookingWizard />} />
                  <Route path="/quote/details/:id" element={<QuoteDetailsPage />} />
                  
                  {/* Admin Routes */}
                  <Route path="/admin/login" element={<UserLogin />} />
                  {/* <Route path="/admin" element={<AdminProtectedRoute>
                    <AdminLayout><AdminDashboard /></AdminLayout>
                  </AdminProtectedRoute>} /> */}
                  <Route path="/admin/services" element={<AdminProtectedRoute><AdminLayout><ServicesManagement /></AdminLayout></AdminProtectedRoute>} />
                  <Route path="/admin/locations" element={<AdminProtectedRoute><AdminLayout><LocationsManagement /></AdminLayout></AdminProtectedRoute>} />
                  <Route path="/admin/house-size-info" element={<AdminProtectedRoute><AdminLayout><HouseSizeInfo /></AdminLayout></AdminProtectedRoute>} />
                  {/* <Route path="/admin/questions" element={<AdminProtectedRoute><AdminLayout><div>Questions Coming Soon</div></AdminLayout></AdminProtectedRoute>} />
                  <Route path="/admin/settings" element={<AdminProtectedRoute><AdminLayout><div>Settings Coming Soon</div></AdminLayout></AdminProtectedRoute>} /> */}
                  
                  {/* Catch-all route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </PersistGate>
  </Provider>
  );
}

export default App;