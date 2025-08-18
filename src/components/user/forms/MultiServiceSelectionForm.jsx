import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import axios from "axios";

const MultiServiceSelectionForm = ({ data, onUpdate }) => {
  const [services, setServices] = useState([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await axios.get("https://site.cleanonthego.com/api/user/services/");
        const services = response.data;
        setServices(services);

        // onUpdate({
        //   availableLocations: locations,
        //   availableSizes: size_ranges,
        // });
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };

    fetchInitialData();
  }, []);

  const toggleService = (service) => {
    const existing = data.selectedServices || [];
    const isSelected = existing.find((s) => s.id === service.id);
    const updatedServices = isSelected
      ? existing.filter((s) => s.id !== service.id)
      : [...existing, service];

    onUpdate({ selectedServices: updatedServices });
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Select Services</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((service) => {
          const checked = data.selectedServices?.some((s) => s.id === service.id);
          return (
            <Card
              key={service.id}
              className={`cursor-pointer ${checked ? "border-blue-500 bg-blue-50" : ""}`}
              onClick={() => toggleService(service)}
            >
              <CardContent className="flex items-center space-x-3">
                <Checkbox checked={checked} onChange={() => toggleService(service)} />
                <div>
                  <p className="font-semibold">{service.name}</p>
                  <p className="text-sm text-gray-600">{service.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MultiServiceSelectionForm;
