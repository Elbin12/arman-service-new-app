import React, { useEffect, useState } from 'react';
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
  TextField,
  Switch,
  Pagination,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  DragIndicator,
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { ServiceCreationWizard } from '../../components/admin/services/ServiceCreationWizard.jsx';
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
import { useCreateGlobalBasePriceMutation, useGetGlobalBasePriceQuery, useUpdateGlobalBasePriceMutation } from '../../store/api/globalPriceApi.js';

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

  const [createGlobalBasePrice] = useCreateGlobalBasePriceMutation();
  const [updateGlobalBasePrice] = useUpdateGlobalBasePriceMutation();

  const [basePrice, setBasePrice] = useState('');
  const [originalBasePrice, setOriginalBasePrice] = useState('');
  
  const [createService] = useCreateServiceMutation();
  const [updateService] = useUpdateServiceMutation();
  const [deleteService] = useDeleteServiceMutation();

  const [loadingEdit, setLoadingEdit] = useState(false);
  const [orderedServices, setOrderedServices] = useState([]);

  const [page, setPage] = useState(1);
  
  const { data: servicesData = [], isLoading, error } = useGetServicesQuery(page);
  const { data: basePriceData, isLoading: basePriceLoading } = useGetGlobalBasePriceQuery();
  
  const services = servicesData.results;
  const totalPages = servicesData.count ? Math.ceil(servicesData.count / 20) : 1;

  useEffect(() => {
    if (basePriceData) {
      setBasePrice(basePriceData.base_price);
      setOriginalBasePrice(basePriceData.base_price);
    }
  }, [basePriceData]);

  // Update ordered services when data changes
  useEffect(() => {
    if (services && services.length > 0) {
      // Sort by order if available, otherwise keep original order
      const sorted = [...services].sort((a, b) => {
        const orderA = a.order ?? 999999;
        const orderB = b.order ?? 999999;
        return orderA - orderB;
      });
      setOrderedServices(sorted);
    }
  }, [services]);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleToggleActive = async (service) => {
    try {
      await updateService({
        id: service.id,
        is_active: !service.is_active,
      }).unwrap();
      console.log(`Service ${service.name} ${!service.is_active ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('Failed to update service status:', error);
    }
  };

  const handleSaveBasePrice = async () => {
    try {
      if (basePriceData?.id) {
        await updateGlobalBasePrice({ base_price: basePrice }).unwrap();
      } else {
        await createGlobalBasePrice({ base_price: basePrice }).unwrap();
      }
      setOriginalBasePrice(basePrice);
    } catch (error) {
      console.error("Failed to save base price:", error);
    }
  };

  const handleCreateService = async (serviceData) => {
    handleCloseWizard();
  };

  const handleEditService = async (service) => {
    console.log(service, 'service from handleEditService');
    dispatch(setEditingService(service));
    dispatch(setWizardOpen(true));
    setLoadingEdit(true);
    
    try {
      const fullServiceData = await dispatch(
        servicesApi.endpoints.getServiceById.initiate(service.id, { forceRefetch: true })
      ).unwrap();

      console.log(fullServiceData, 'from handleEditService');
      dispatch(setEditingService(fullServiceData));
    } catch (error) {
      console.error('Failed to fetch service details:', error);
    } finally {
      setLoadingEdit(false);
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

  const handleDragEnd = async (result) => {
    if (!result.destination) {
      return;
    }

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) {
      return;
    }

    // Reorder the services array
    const reorderedServices = Array.from(orderedServices);
    const [movedService] = reorderedServices.splice(sourceIndex, 1);
    reorderedServices.splice(destinationIndex, 0, movedService);

    // Optimistically update UI
    setOrderedServices(reorderedServices);

    // Update the order on the backend for all affected services
    try {
      // Create update promises for all affected services
      const updatePromises = reorderedServices.map((service, index) => {
        const newOrder = index + 1; // 1-based ordering
        
        // Only update if order actually changed
        if (service.order !== newOrder) {
          return updateService({
            id: service.id,
            order: newOrder,
          }).unwrap();
        }
        return Promise.resolve();
      });

      // Wait for all updates to complete
      await Promise.all(updatePromises);
      
      console.log(`Service ${movedService.name} moved to position ${destinationIndex + 1}`);
      console.log('All services reordered successfully');
    } catch (error) {
      console.error('Failed to update service order:', error);
      // Revert on error
      setOrderedServices(orderedServices);
    }
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
            Manage your service offerings, packages, and pricing. Drag to reorder.
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

      <Box 
        display="flex" 
        alignItems="center" 
        gap={2} 
        mb={3}
      >
        <TextField
          label="Global Base Price"
          type="number"
          value={basePrice}
          onChange={(e) => setBasePrice(e.target.value)}
          disabled={basePriceLoading}
        />
        <Button 
          variant="contained" 
          onClick={handleSaveBasePrice}
          disabled={basePriceLoading || basePrice === originalBasePrice}
        >
          Save
        </Button>
      </Box>

      <Card>
        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width="40px"></TableCell>
                  <TableCell>Service Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Questions</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="services-table">
                  {(provided, snapshot) => (
                    <TableBody
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                    >
                      {orderedServices.map((service, index) => (
                        <Draggable
                          key={service.id}
                          draggableId={service.id.toString()}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <TableRow
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              sx={{
                                backgroundColor: snapshot.isDragging ? 'action.hover' : 'inherit',
                                '&:hover': {
                                  backgroundColor: 'action.hover',
                                },
                              }}
                            >
                              <TableCell {...provided.dragHandleProps}>
                                <DragIndicator 
                                  sx={{ 
                                    cursor: 'grab',
                                    color: 'text.secondary',
                                    '&:active': {
                                      cursor: 'grabbing',
                                    }
                                  }} 
                                />
                              </TableCell>
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
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Switch
                                    checked={service.is_active}
                                    onChange={() => handleToggleActive(service)}
                                    size="small"
                                    color="success"
                                  />
                                  <Chip 
                                    label={service.is_active ? 'active' : 'inactive'} 
                                    size="small"
                                    color={service.is_active ? 'success' : 'default'}
                                  />
                                </Box>
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
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </TableBody>
                  )}
                </Droppable>
              </DragDropContext>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {servicesData.count > 0 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination 
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      <ServiceCreationWizard
        open={wizardOpen}
        onClose={handleCloseWizard}
        onComplete={handleCreateService}
        editData={editingService}
        serviceData={serviceData}
        setServiceData={setServiceData}
        setActiveStep={setActiveStep}
        activeStep={activeStep}
        loadingEdit={loadingEdit}
        servicesLen = {services?.length ?? 0}
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