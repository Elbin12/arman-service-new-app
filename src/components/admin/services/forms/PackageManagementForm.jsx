import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/card";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { Alert, AlertDescription } from "../../../ui/alert";
import { Check, X, Plus, Trash2 } from 'lucide-react';
import { useCreatePackageMutation, useDeletePackageMutation } from '../../../../store/api/packagesApi';
import { useCreateFeatureMutation, useDeleteFeatureMutation, useUpdateFeatureStatusMutation } from '../../../../store/api/featuresApi';
import { useCreatePackageFeatureMutation, useUpdatePackageFeatureMutation } from '../../../../store/api/packageFeaturesApi';
import { servicesApi, useGetServiceByIdQuery } from '../../../../store/api/servicesApi';
import { useDispatch } from 'react-redux';

// Custom Modal Component
const CustomModal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-lg max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

const PackageManagementForm = ({
  data,
  onUpdate,
}) => {
  const [packages, setPackages] = useState(data.packages || []);
  const [features, setFeatures] = useState(data.features || []);

  // Sync with prop changes
  React.useEffect(() => {
    setPackages(data.packages || []);
    setFeatures(data.features || []);
  }, [data.packages, data.features]);
  
  const [packageDialogOpen, setPackageDialogOpen] = useState(false);
  const [newPackage, setNewPackage] = useState({ name: '', base_price: '' });
  const [newFeature, setNewFeature] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);

  const [featureToDelete, setFeatureToDelete] = useState(null);
  const [featureDeleteConfirmOpen, setFeatureDeleteConfirmOpen] = useState(false);


  const dispatch = useDispatch();

  const [createPackage] = useCreatePackageMutation();
  const [createFeature] = useCreateFeatureMutation();
  const [deleteFeature] = useDeleteFeatureMutation();
  const [updateFeatureStatus] = useUpdatePackageFeatureMutation();
  const [deletePackage] = useDeletePackageMutation();

  const validatePackage = () => {
    const newErrors = {};
    
    if (!newPackage.name || newPackage.name.trim().length < 3) {
      newErrors.name = 'Package name must be at least 3 characters';
    }
    
    if (!newPackage.base_price || isNaN(newPackage.base_price) || parseFloat(newPackage.base_price) <= 0) {
      newErrors.base_price = 'Base price must be a valid positive number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddFeatureInline = async () => {
    if (!newFeature.trim() || newFeature.trim().length < 3) {
      setErrors({ feature_name: 'Feature name must be at least 3 characters' });
      return;
    }
    
    setIsLoading(true);
    try {
      const featurePayload = {
        service: data.id,
        name: newFeature.trim(),
      };
      
      const result = await createFeature(featurePayload).unwrap();

      const new_data = await dispatch(servicesApi.endpoints.getServiceById.initiate(data.id, { forceRefetch: true })).unwrap();
      onUpdate(new_data);
      
      const updatedFeatures = [...features, result];
      setFeatures(updatedFeatures);
      onUpdate({ features: updatedFeatures });
      setNewFeature('');
      setErrors({});
    } catch (error) {
      console.error('Failed to create feature:', error);
      setErrors({ 
        general: error?.data?.message || error?.data?.detail || 'Failed to create feature. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPackage = async () => {
    if (!validatePackage()) return;
    
    setIsLoading(true);
    try {
      const packagePayload = {
        service: data.id,
        name: newPackage.name.trim(),
        base_price: newPackage.base_price,
      };
      
      const result = await createPackage(packagePayload).unwrap();
      
      
      const updatedPackages = [...packages, result];
      setPackages(updatedPackages);
      onUpdate({ packages: updatedPackages });
      setPackageDialogOpen(false);
      setNewPackage({ name: '', base_price: '' });
      setErrors({});
    } catch (error) {
      console.error('Failed to create package:', error);
      setErrors({ 
        general: error?.data?.message || error?.data?.detail || 'Failed to create package. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDeletePackage = async () => {
    if (!selectedPackage) return;

    try {
      await deletePackage(selectedPackage.id).unwrap();
      const updatedPackages = packages.filter(pkg => pkg.id !== selectedPackage?.id);
      setPackages(updatedPackages);
      onUpdate({ packages: updatedPackages });
      setDeleteConfirmOpen(false);
      setSelectedPackage(null);
    } catch (error) {
      console.error('Failed to delete package:', error);
      setErrors({
        general: error?.data?.message || error?.data?.detail || 'Failed to delete package. Please try again.'
      });
    }
  };

  const confirmFeatureDelete = (feature) => {
    setFeatureToDelete(feature);
    setFeatureDeleteConfirmOpen(true);
  };

  const handleConfirmDeleteFeature = async () => {
    try {
      await deleteFeature(featureToDelete.id).unwrap();
      const updatedFeatures = features.filter(feat => feat.id !== featureToDelete.id);
      setFeatures(updatedFeatures);
      onUpdate({ features: updatedFeatures });
      setFeatureDeleteConfirmOpen(false);
      setFeatureToDelete(null);
    } catch (error) {
      console.error("Failed to delete feature:", error);
      setErrors({
        general: error?.data?.message || error?.data?.detail || 'Failed to delete feature. Please try again.'
      });
    }
  };

  const handleFeatureToggle = async (packageId, featureId, isIncluded) => {
    try {
      const pkg = packages.find(p => p.id === packageId);
      const id = pkg?.features?.find(f => f.feature === featureId)?.id

      console.log('isIncluded:', isIncluded, 'typeof:', typeof isIncluded, id, pkg.features);
      const updatedFeature = await updateFeatureStatus({id:id, is_included:isIncluded, feature:featureId, package:packageId}).unwrap();
      
      // Update local state
      const updatedPackages = packages.map(pkg => {
        if (pkg.id === packageId) {
          const updatedFeatures = pkg.features.map(f => {
            if (f.feature === featureId) {
              return { ...f, is_included: isIncluded };
            }
            return f;
          });

          return { ...pkg, features: updatedFeatures };
        }
        return pkg;
      });

    setPackages(updatedPackages);
    // onUpdate({ packages: updatedPackages, features: updatedFeatures });
  } catch (error) {
    console.error("Failed to update package feature:", error);
  }
};


  const isFeatureIncluded = (packageId, featureId) => {
    const pkg = packages.find(p => p.id === packageId);
    return pkg?.features?.find(f => f.feature === featureId)?.is_included
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Package & Feature Management</h3>
        <p className="text-sm text-muted-foreground">
          Create packages for your service and assign features to them.
        </p>
      </div>

      {errors.general && (
        <Alert>
          <AlertDescription>{errors.general}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Button 
          disabled={!data.id}
          onClick={() => setPackageDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Package
        </Button>
      </div>

      {!data.id && (
        <Alert>
          <AlertDescription>
            Please save the service details first before adding packages and features.
          </AlertDescription>
        </Alert>
      )}

      {packages.length === 0 ? (
        <p className="text-muted-foreground">Please add at least one package to continue.</p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium">
                      {/* Empty header for features column */}
                    </th>
                    {packages.map((pkg, index) => (
                      <th key={pkg.id} className="text-center p-4 min-w-[120px]">
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">Package {index + 1}</div>
                          <div className="font-semibold">{pkg.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Base Price ${pkg.base_price}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedPackage(pkg);
                              setDeleteConfirmOpen(true);
                            }}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </th>
                    ))}
                    <th className="p-4 w-8">
                      {/* Empty header for actions */}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature) => (
                    <tr key={feature.id} className="border-b">
                      <td className="p-4 flex items-center justify-between">
                        <span className="font-medium">{feature.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => confirmFeatureDelete(feature)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </td>
                      {packages.map((pkg) => (
                        <td key={pkg.id} className="p-4 text-center">
                          <div className="flex gap-2 justify-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleFeatureToggle(pkg.id, feature.id, true)}
                              className={`h-8 w-8 p-0 ${
                                isFeatureIncluded(pkg.id, feature.id)
                                  ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                                  : 'text-muted-foreground hover:text-emerald-600'
                              }`}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleFeatureToggle(pkg.id, feature.id, false)}
                              className={`h-8 w-8 p-0 ${
                                !isFeatureIncluded(pkg.id, feature.id)
                                  ? 'text-red-600 bg-red-50 hover:bg-red-100'
                                  : 'text-muted-foreground hover:text-red-600'
                              }`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      ))}
                      <td className="p-4"></td>
                    </tr>
                  ))}
                  
                  {/* Add Feature Row */}
                  <tr className="border-b bg-muted/25">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Input
                          value={newFeature}
                          onChange={(e) => {
                            setNewFeature(e.target.value);
                            if (errors.feature_name) setErrors(prev => ({ ...prev, feature_name: '' }));
                          }}
                          placeholder="Add feature name..."
                          className="text-sm"
                          disabled={!data.id}
                        />
                        <Button
                          onClick={handleAddFeatureInline}
                          disabled={!newFeature.trim() || !data.id || isLoading}
                          size="sm"
                          variant="outline"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {errors.feature_name && (
                        <p className="text-xs text-destructive mt-1">{errors.feature_name}</p>
                      )}
                    </td>
                    {packages.map((pkg) => (
                      <td key={pkg.id} className="p-4"></td>
                    ))}
                    <td className="p-4"></td>
                  </tr>
                  
                  {features.length === 0 && (
                    <tr>
                      <td colSpan={packages.length + 2} className="p-8 text-center text-muted-foreground">
                        No features created yet. Add features using the input above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Package Dialog */}
      <CustomModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Delete Package"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Are you sure you want to delete <span className='text-xl text-[#4E4FBB]'>{selectedPackage?.name}</span> package? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDeletePackage}
            >
              Delete
            </Button>
          </div>
        </div>
      </CustomModal>

      {/* Delete feature modal */}
      <CustomModal
        isOpen={featureDeleteConfirmOpen}
        onClose={() => setFeatureDeleteConfirmOpen(false)}
        title="Delete Feature"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Are you sure you want to delete feature{' '}
            <span className='text-[#4E4FBB] font-medium'>{featureToDelete?.name}</span>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setFeatureDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDeleteFeature}
            >
              Delete
            </Button>
          </div>
        </div>
      </CustomModal>



      {/* Custom Modal */}
      <CustomModal
        isOpen={packageDialogOpen}
        onClose={() => setPackageDialogOpen(false)}
        title="Add New Package"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="package-name">Package Name</Label>
            <Input
              id="package-name"
              value={newPackage.name}
              onChange={(e) => {
                setNewPackage({ ...newPackage, name: e.target.value });
                if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
              }}
              placeholder="e.g., Basic, Premium"
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>
          <div>
            <Label htmlFor="base-price">Base Price ($)</Label>
            <Input
              id="base-price"
              type="number"
              value={newPackage.base_price}
              onChange={(e) => {
                setNewPackage({ ...newPackage, base_price: e.target.value });
                if (errors.base_price) setErrors(prev => ({ ...prev, base_price: '' }));
              }}
              placeholder="50"
            />
            {errors.base_price && <p className="text-sm text-destructive">{errors.base_price}</p>}
          </div>
          <Button 
            onClick={handleAddPackage} 
            disabled={!newPackage.name || isLoading}
            className="w-full"
          >
            {isLoading ? 'Adding...' : 'Add Package'}
          </Button>
        </div>
      </CustomModal>
    </div>
  );
};

export default PackageManagementForm;