import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import ServiceDetailsForm from './forms/ServiceDetailsForm';
import PackageManagementForm from './forms/PackageManagementForm';
import QuestionBuilderForm from './forms/QuestionBuilderForm';
import PriceSetupForm from './forms/PriceSetupForm';
import { 
  servicesApi,
  useCreateServiceMutation, 
  useCreateServiceSettingsMutation, 
  useUpdateServiceMutation, 
  useUpdateServiceSettingsMutation
} from '../../../store/api/servicesApi';
import { useCreatePackageMutation } from '../../../store/api/packagesApi';
import { useCreateFeatureMutation } from '../../../store/api/featuresApi';
import { useCreateQuestionMutation } from '../../../store/api/questionsApi';
import { useDispatch } from 'react-redux';
import { setEditingService } from '../../../store/slices/servicesSlice';
import ServiceSettingsForm from './forms/ServiceSettingsForm';

const steps = [
  'Service Details',
  'Package Management',
  'Question Builder', 
  'Price Setup',
  'Final Details'
];

// ServiceCreationWizardProps: { open, onClose, onComplete, editData }

export const ServiceCreationWizard = ({
  open,
  onClose,
  onComplete,
  editData,
  serviceData,
  activeStep,
  setActiveStep,
  setServiceData,
}) => { 
  
  const [savedSteps, setSavedSteps] = useState({
    0: false,
    1: false,
    2: false,
    3: false,
    4: false
  });

  const [stepErrors, setStepErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const [createService] = useCreateServiceMutation();
  const [updateService] = useUpdateServiceMutation();
  const [createPackage] = useCreatePackageMutation();
  const [createFeature] = useCreateFeatureMutation();
  const [createQuestion] = useCreateQuestionMutation();

  const [createServiceSettings] = useCreateServiceSettingsMutation();
  const [updateServiceSettings] = useUpdateServiceSettingsMutation();


  const dispatch = useDispatch();

  // Update service data when editData changes
  React.useEffect(() => {
    if (editData && open) {
      setServiceData({
        id: editData.id,
        name: editData.name || '',
        description: editData.description || '',
        packages: editData.packages || [],
        features: editData.features || [],
        questions: editData.questions || [],
        pricing: editData.pricing || {},
        settings: editData.settings
      });
      setSavedSteps({
        0: true,
        1: true,
        2: true,
        3: true,
        4: true
      });
    } else if (!editData && open) {
      setServiceData({
        name: '',
        description: '',
        packages: [],
        features: [],
        questions: [],
        pricing: {},
      });
      setSavedSteps({
        0: false,
        1: false,
        2: false,
        3: false,
        4: false
      });
    }
  }, [editData, open]);

  const validateStep = (step) => {
    switch (step) {
      case 0:
        if (!serviceData.name || !serviceData.description) {
          setStepErrors({ 0: 'Name and description are required' });
          return false;
        }
        break;
      case 1:
        if (!serviceData.packages || serviceData.packages.length === 0) {
          setStepErrors({ 1: 'At least one package is required' });
          return false;
        }
        break;
      case 2:

      if(serviceData?.questions.length==0){
        setStepErrors({ 2: 'At least one question is required' });
        return false;
      }
        
      if (serviceData.questions && serviceData.questions.length > 0) {
        for (const question of serviceData.questions) {
          if (
            question.question_type === 'options' &&
            (!question.options || question.options.length === 0)
          ) {
            setStepErrors({ 2: 'Each "option" type question must have at least one option.' });
            return false;
          }
        }
      }
        break;
      case 3:
        // Pricing validation can be added here
        break;
      case 4:
        break;
    }
    setStepErrors({});
    return true;
  };

  const handleNext = async () => {
    if (!validateStep(activeStep)) {
      return;
    }

    setIsLoading(true);
    setStepErrors({});
    try {
      switch (activeStep) {
        case 0:
          if (!savedSteps[0]) {
            const servicePayload = {
              name: serviceData.name,
              description: serviceData.description
            };
            
            let result;
            if (editData) {
              result = await updateService({ id: editData.id, ...servicePayload }).unwrap();
              dispatch(
                servicesApi.util.updateQueryData('getServices', undefined, (draft) => {
                  const index = draft.findIndex((item) => item.id === serviceData.id);
                  if (index !== -1) {
                    draft[index] = result;
                  }
                })
              );
            } else {
              result = await createService(servicePayload).unwrap();
              dispatch(setEditingService(result))
            }
            
            setServiceData((prev) => ({ ...prev, id: result.id }));
            setSavedSteps((prev) => ({ ...prev, 0: true }));
          }
          break;

        case 1:
          // Packages and features are created directly in the PackageManagementForm
          // No API calls needed here
          setSavedSteps((prev) => ({ ...prev, 1: true }));
          break;

        case 2:
          if (!savedSteps[2]) {
            // Create questions
            for (const question of serviceData.questions) {
              const questionPayload = {
                service: serviceData.id,
                question_text: question.question_text,
                question_type: question.question_type,
                order: question.order
              };
              
              if (question.options) {
                questionPayload.options = question.options;
              }
              
              await createQuestion(questionPayload).unwrap();
            }
            setSavedSteps((prev) => ({ ...prev, 2: true }));
          }
          break;

        case 3:
          if (!savedSteps[3]) {
            // Final step - pricing setup is already handled in packages
            setSavedSteps((prev) => ({ ...prev, 3: true }));
          }
          break;
          
        case 4: // Final Step
          await createServiceSettings({
            serviceId: serviceData.id,
            general_disclaimer: serviceData.settings.general_disclaimer || '',
            bid_in_person_disclaimer: serviceData.settings.bid_in_person_disclaimer || '',
            apply_area_minimum: serviceData.settings.apply_area_minimum || false,
            apply_house_size_minimum: serviceData.settings.apply_house_size_minimum || false,
            apply_trip_charge_to_bid: serviceData.settings.apply_trip_charge_to_bid || false,
            enable_dollar_minimum: serviceData.settings.enable_dollar_minimum || false
          }).unwrap();

          onComplete(serviceData);
          handleReset();
          onClose();
          return;

        default:
          break;
      }

      setActiveStep((prev) => prev + 1);
    } catch (error) {
      console.error("Step failed:", error);
      setStepErrors({ 
        [activeStep]: error?.data?.message || error?.data?.detail || 'An error occurred. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };


  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setServiceData({
      name: '',
      description: '',
      packages: [],
      questions: [],
      pricing: {},
    });
    setSavedSteps({
      0: false,
      1: false,
      2: false,
      3: false,
    });
    setStepErrors({});
  };

  const updateServiceData = (stepData) => {
    setServiceData((prev) => ({ ...prev, ...stepData }));
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <ServiceDetailsForm
            data={serviceData}
            onUpdate={updateServiceData}
            setSavedSteps={setSavedSteps}
          />
        );
      case 1:
        return (
          <PackageManagementForm
            data={serviceData}
            onUpdate={updateServiceData}
          />
        );
      case 2:
        return (
          <QuestionBuilderForm
            data={serviceData}
            onUpdate={updateServiceData}
          />
        );
      case 3:
        return (
          <PriceSetupForm
            data={serviceData}
            onUpdate={updateServiceData}
          />
        );
      case 4:
        return (
          <ServiceSettingsForm
            data={serviceData}
            onUpdate={updateServiceData}
          />
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{editData ? 'Edit Service' : 'Create New Service'}</Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            <Box sx={{ minHeight: '400px' }}>
              {stepErrors[activeStep] && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {stepErrors[activeStep]}
                </Alert>
              )}
              {getStepContent(activeStep)}
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
              <Button
                color="inherit"
                disabled={activeStep === 0}
                onClick={handleBack}
                sx={{ mr: 1 }}
              >
                Back
              </Button>
              <Box sx={{ flex: '1 1 auto' }} />
              <Button 
                onClick={handleNext} 
                variant="contained"
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={20} /> : null}
              >
                {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};