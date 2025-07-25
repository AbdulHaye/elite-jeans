import React, { useEffect, useState } from "react";
import axios from "axios";
import api from "../../../../../../ApiServices/api";

function TopSection({ workOrderId }) {
  const [specs, setSpecs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [styleInfo, setStyleInfo] = useState({
    orderNumber: "N/A",
    createdOn: "N/A",
    styleNumbers: ["N/A"],
    fabricContent: "N/A",
    customerBrand: "N/A",
    size: "N/A",
    descriptionImage: null,
  });

  useEffect(() => {
    const fetchSpecs = async () => {
      try {
        const response = await api.get(
          `/api/sampleGradedSpecs/specs/${workOrderId}`
        );

        if (response?.data?.data?.length > 0) {
          const firstItem = response.data.data[0];
          setSpecs(firstItem);
          setStyleInfo({
            orderNumber: workOrderId,
            createdOn: new Date().toLocaleDateString(), // Using current date as fallback
            styleNumbers: [firstItem?.spec_template?.Name || "N/A"],
            fabricContent: firstItem?.fabric_content || "N/A",
            customerBrand: firstItem?.customer_or_brand || "N/A",
            size: firstItem?.size || "N/A",
            descriptionImage:
              firstItem?.workOrder?.pictures?.[0]?.imageUrl || null,
          });
        } else {
          // No data found, but we'll keep the default "N/A" values
          setSpecs({
            customer_or_brand: "N/A",
            fabric_content: "N/A",
            garment_specs_details: "N/A",
            name: "N/A",
            size: "N/A",
            size_range: "N/A",
          });
          setError("No Sample Graded Specs found for this workOrder");
        }
      } catch (err) {
        setError(err.message);
        // Initialize specs with N/A values even on error
        setSpecs({
          customer_or_brand: "N/A",
          fabric_content: "N/A",
          garment_specs_details: "N/A",
          name: "N/A",
          size: "N/A",
          size_range: "N/A",
        });
      } finally {
        setLoading(false);
      }
    };

    if (workOrderId) {
      fetchSpecs();
    } else {
      setLoading(false);
      setError("No workOrderId provided");
    }
  }, [workOrderId]);

  // Helper function to safely get style numbers
  const getStyleNumbers = () => {
    if (!specs?.itemDetails) return "N/A";
    
    // Check if itemDetails is an array
    if (Array.isArray(specs.itemDetails)) {
      return specs.itemDetails
        .map((item) => item?.stylenumbers || "N/A")
        .filter(Boolean) // Remove empty strings
        .join(", ") || "N/A";
    }
    
    // Handle case where itemDetails might be an object
    if (typeof specs.itemDetails === 'object' && specs.itemDetails !== null) {
      return specs.itemDetails.stylenumbers || "N/A";
    }
    
    return "N/A";
  };

  return (
    <div className="main_top_fit">
      <div className="col_top_fit">
        <div className="well well-sm">
          <div className="flex-row_fit" style={{ 
            display: "flex", 
            gap: "10px",
            alignItems: "stretch",
            height: "100%"
          }}>
            {/* Information Section - stays aligned to top */}
            <div style={{ 
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start"
            }}>
              <div className="form-group-row" style={{ display: "flex", marginBottom: "12px", alignItems: "center" }}>
                <label style={{ flex: "0 0 150px", fontWeight: "500" }}>Order #:</label>
                <span style={{ flex: 1 }}>{specs?.workOrder?.workOrderId || "N/A"}</span>
              </div>
    
              <div className="form-group-row" style={{ display: "flex", marginBottom: "12px", alignItems: "center" }}>
                <label style={{ flex: "0 0 150px", fontWeight: "500" }}>Created on:</label>
                <span style={{ flex: 1 }}>
                  {specs?.workOrder?.createdAt
                    ? new Date(specs?.workOrder?.createdAt).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
    
              <div className="form-group-row" style={{ display: "flex", marginBottom: "12px", alignItems: "center" }}>
                <label style={{ flex: "0 0 150px", fontWeight: "500" }}>Style #:</label>
                <span style={{ flex: 1 }}>
  {specs?.stylenumbers?.map(item => item.number).join(', ')}
</span>
              </div>
    
              <div className="form-group-row" style={{ display: "flex", marginBottom: "12px", alignItems: "center" }}>
                <label style={{ flex: "0 0 150px", fontWeight: "500" }}>Fabric Content:</label>
                <span style={{ flex: 1 }}>{specs?.fabric_content || "N/A"}</span>
              </div>
    
              <div className="form-group-row" style={{ display: "flex", marginBottom: "12px", alignItems: "center" }}>
                <label style={{ flex: "0 0 150px", fontWeight: "500" }}>Customer / Brand:</label>
                <span style={{ flex: 1 }}>{specs?.customer_or_brand || "N/A"}</span>
              </div>
    
              <div className="form-group-row" style={{ display: "flex", marginBottom: "12px", alignItems: "center" }}>
                <label style={{ flex: "0 0 150px", fontWeight: "500" }}>Size:</label>
                <span style={{ flex: 1 }}>{specs?.size || "N/A"}</span>
              </div>
            </div>
    
            {/* Image Section - Centered vertically */}
            <div style={{ 
              flex: "0 0 250px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "10px",
              backgroundColor: "#f8f9fa",
              borderRadius: "4px",
              margin: "auto 0"
            }}>
              {styleInfo?.descriptionImage ? (
                <div style={{
                  width: "100%",
                  height: "200px",
                  backgroundImage: `url(${styleInfo.descriptionImage})`,
                  backgroundSize: "contain",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center"
                }}></div>
              ) : (
                <div style={{
                  width: "100%",
                  height: "200px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#6c757d",
                  backgroundColor: "#e9ecef"
                }}>
                  No Image Available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TopSection;