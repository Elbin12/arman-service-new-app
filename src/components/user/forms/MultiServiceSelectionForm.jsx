import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useCreateCustomProductMutation, useGetServicesQuery } from "../../../store/api/user/quoteApi";

const MultiServiceSelectionForm = ({ data, onUpdate }) => {
  const { data: servicesData, error, isLoading } = useGetServicesQuery(
    data?.submission_id,
    {
      refetchOnMountOrArgChange: true,
    }
  );

  const [createCustomProduct, { isLoading: isCreating }] = useCreateCustomProductMutation();

  const services = servicesData?.services || [];
  const customProducts = servicesData?.custom_services || [];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    product_name: "",
    description: "",
    price: "",
  });

  useEffect(() => {
    if (services) {
      onUpdate?.({
        availableLocations: services.locations,
        availableSizes: services.size_ranges,
      });
    }
  }, [services, onUpdate]);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error fetching services</p>;

  // Toggle service selection
  const toggleService = (service) => {
    const existing = data.selectedServices || [];
    const isSelected = existing.find((s) => s.id === service.id);
    const updatedServices = isSelected
      ? existing.filter((s) => s.id !== service.id)
      : [...existing, service];

    onUpdate({ selectedServices: updatedServices });
  };

  // Toggle custom product selection
  const toggleCustomProduct = (product) => {
    const existing = data.selectedCustomProducts || [];
    const isSelected = existing.find((p) => p.id === product.id);
    const updatedProducts = isSelected
      ? existing.filter((p) => p.id !== product.id)
      : [...existing, product];

    onUpdate({ selectedCustomProducts: updatedProducts });
  };

  // Add custom product → ideally call API instead of local update
  const handleAddCustomProduct = async() => {
    // Here you should call your backend mutation instead of local update
    // Example: addCustomProductMutation(newProduct).then(refetch)
    console.log("Adding custom product to backend:", newProduct);
    try {
      const response = await createCustomProduct({...newProduct, purchase:data?.submission_id}).unwrap();

      setDialogOpen(false);
      setNewProduct({ product_name: '', description: '', price: '' });
    } catch (err) {
      console.error("Failed to create custom product", err);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Select Services</h2>

      {/* Services list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {services.map((service) => {
          const checked = data.selectedServices?.some(
            (s) => s.id === service.id
          );
          return (
            <Card
              key={service.id}
              className={`cursor-pointer ${
                checked ? "border-blue-500 bg-blue-50" : ""
              }`}
              onClick={() => toggleService(service)}
            >
              <CardContent className="flex items-center space-x-3">
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggleService(service)}
                />
                <div>
                  <p className="font-semibold">{service.name}</p>
                  <p className="text-sm text-gray-600">
                    {service.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Custom Products list (from API) */}
      {customProducts.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Custom Products</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customProducts.map((prod) => {
              
              return (
                <Card key={prod.id}>
                  <CardContent className="flex items-center space-x-3">
                    <div>
                      <p className="font-medium">{prod.product_name}</p>
                      <p className="text-sm text-gray-600">{prod.description}</p>
                      <p className="text-sm text-gray-800">${prod.price}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Add custom product button */}
      <Button onClick={() => setDialogOpen(true)}>Add Custom Product</Button>

      {/* Dialog for adding custom product */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Product Name"
              value={newProduct.product_name}
              onChange={(e) =>
                setNewProduct({ ...newProduct, product_name: e.target.value })
              }
            />
            <Input
              placeholder="Description"
              value={newProduct.description}
              onChange={(e) =>
                setNewProduct({ ...newProduct, description: e.target.value })
              }
            />
            <Input
              type="number"
              placeholder="Price"
              value={newProduct.price}
              onChange={(e) =>
                setNewProduct({ ...newProduct, price: Number(e.target.value) })
              }
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCustomProduct}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MultiServiceSelectionForm;
