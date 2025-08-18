import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
} from '@mui/icons-material';
import { ServiceCreationWizard } from '../../components/admin/services/ServiceCreationWizard.jsx';
// Temporarily removed RTK Query imports
import { 
  useGetServicesQuery, 
  useCreateServiceMutation, 
  useUpdateServiceMutation, 
  useDeleteServiceMutation, 
  servicesApi
} from '../../store/api/servicesApi';
import {
  setWizardOpen,
  setEditingService,
  setDeleteConfirmOpen,
  setServiceToDelete,
  clearEditingService,
} from '../../store/slices/servicesSlice';

const ServicesManagement = () => {
  const dispatch = useDispatch();
  const { 
    wizardOpen, 
    editingService, 
    deleteConfirmOpen, 
    serviceToDelete 
  } = useSelector((state) => {
    return state.services;
  });

  const [activeStep, setActiveStep] = useState(0);
  const [serviceData, setServiceData] = useState({
    name: '',
    description: '',
    packages: [],
    questions: [],
    pricing: {},
  });

  // Temporarily disable RTK Query to test basic Redux
  const { data: services = [], isLoading, error } = useGetServicesQuery();
  const [createService] = useCreateServiceMutation();
  const [updateService] = useUpdateServiceMutation();
  const [deleteService] = useDeleteServiceMutation();
  
  // const services = [];
  // const isLoading = false;
  // const error = null;

  const handleCreateService = async (serviceData) => {
      handleCloseWizard();
  };

const handleEditService = async (service) => {
  console.log(service, 'service from handleEditService');
  
  try {
    const fullServiceData = await dispatch(
      servicesApi.endpoints.getServiceById.initiate(service.id, { forceRefetch: true })
    ).unwrap();

    console.log(fullServiceData, 'from handleEditService');

    dispatch(setEditingService(fullServiceData));
    dispatch(setWizardOpen(true));
  } catch (error) {
    console.error('Failed to fetch service details:', error);
    dispatch(setEditingService(service));
    dispatch(setWizardOpen(true));
  }
};


  const handleDeleteConfirm = (service) => {
    dispatch(setServiceToDelete(service));
    dispatch(setDeleteConfirmOpen(true));
  };

  const handleDeleteService = async () => {
    try {
      console.log('Handle delete service:', serviceToDelete);
      await deleteService(serviceToDelete.id).unwrap();
      dispatch(setDeleteConfirmOpen(false));
      dispatch(setServiceToDelete(null));
    } catch (error) {
      console.error('Failed to delete service:', error);
    }
  };

  const handleCloseWizard = () => {
    dispatch(setWizardOpen(false));
    dispatch(clearEditingService());
    setActiveStep(0);
    setServiceData(null);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography color="error">
          Error loading services: {error.message || 'Unknown error'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Services Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your service offerings, packages, and pricing
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => dispatch(setWizardOpen(true))}
        >
          Create New Service
        </Button>
      </Box>

      <Card>
        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Service Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Questions</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {service.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {service.description && service.description.length > 50 
                          ? `${service.description.substring(0, 50)}...`
                          : service.description
                        }
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={`${service?.questions_count} questions`} 
                        size="small" 
                        color="secondary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={service.is_active ? 'active' : 'inactive'} 
                        size="small"
                        color={service.is_active ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>{new Date(service.created_at).toLocaleDateString()}</TableCell>
                    <TableCell align="right">
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => handleEditService(service)}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDeleteConfirm(service)}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <ServiceCreationWizard
        open={wizardOpen}
        onClose={handleCloseWizard}
        onComplete={handleCreateService}
        editData={editingService}
        serviceData={serviceData}
        setServiceData={setServiceData}
        setActiveStep={setActiveStep}
        activeStep={activeStep}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => dispatch(setDeleteConfirmOpen(false))}
      >
        <DialogTitle>Delete Service</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this service? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => dispatch(setDeleteConfirmOpen(false))}>
            Cancel
          </Button>
          <Button onClick={handleDeleteService} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ServicesManagement;