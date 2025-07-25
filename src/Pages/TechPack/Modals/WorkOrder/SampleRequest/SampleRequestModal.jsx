import React, { useState, useEffect } from "react";
import api from "../../../../../ApiServices/api";

const SampleRequestModal = ({ onClose, onSubmit, request, workOrderId }) => {
  const [styleOptions, setStyleOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  const [formData, setFormData] = useState(
    request
      ? {
          ...request,
          dueDate: formatDateForInput(request.dueDate),
          styleId: request.styleId?._id || request.styleId,
          styleNumber: request.styleNumber
        }
      : {
          styleId: "",
          styleNumber: "",
          size: "",
          quantity: "",
          sampleType: "",
          dueDate: "",
          comments: "",
        }
  );

  useEffect(() => {
    if (workOrderId) {
      const fetchStyleOptions = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await api.get(
            `/api/work-orders/item-detail/workorders/${workOrderId}/style-numbers`
          );
          console.log(response,"style api number")
          const options = response.data.data.map(item => ({
            id: item.id,
            number: item.number
          }));
          
          setStyleOptions(options);
          
          // If editing and current style isn't in options, add it
          if (request?.styleId && !options.some(style => style.id === (request.styleId._id || request.styleId))) {
            try {
              const styleResponse = await api.get(`/api/styles/${request.styleId._id || request.styleId}`);
              setStyleOptions(prev => [...prev, {
                id: styleResponse.data._id,
                number: styleResponse.data.number
              }]);
            } catch (fetchError) {
              console.error("Error fetching individual style:", fetchError);
            }
          }
        } catch (err) {
          setError(err.message || "Failed to fetch style options");
          console.error("Error fetching style options:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchStyleOptions();
    }
  }, [workOrderId, request]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "styleId") {
      const selectedStyle = styleOptions.find(style => style.id === value);
      setFormData(prev => ({
        ...prev,
        [name]: value,
        styleNumber: selectedStyle ? selectedStyle.number : ""
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

const handleSubmit = (e) => {
  e.preventDefault();
  
  // Validate required fields
  if (!formData.styleId) {
    alert("Please select a style number");
    return;
  }

  const selectedStyle = styleOptions.find(style => style.id === formData.styleId);
  
  if (!selectedStyle) {
    alert("Invalid style selected");
    return;
  }

  // Create payload with consistent field names
  const submitData = {
    workOrder_Id: workOrderId,
    styleId: formData.styleId,  // Ensure this matches backend exactly
    styleNumber: selectedStyle.number,
    size: formData.size,
    quantity: Number(formData.quantity), // Convert to number
    sampleType: formData.sampleType,
    dueDate: formData.dueDate,
    comments: formData.comments
  };

  console.log("Final submission payload:", JSON.stringify(submitData, null, 2));
  onSubmit(submitData);
};

  const handleDateClick = (e) => {
    e.target.showPicker();
  };

  return (
    <div className="modal">
      <div className="modal-content mdch">
        <h3>{request ? "Edit Sample Request" : "Add Sample Request"}</h3>
        <form onSubmit={handleSubmit}>
          <div className="testst">
            <label>
              Style #:
              <select
                name="styleId"
                value={formData.styleId}
                onChange={handleChange}
                required
              >
                <option value="">Select a style number</option>
                {loading ? (
                  <option disabled>Loading style numbers...</option>
                ) : error ? (
                  <option disabled>No style# available (Please create item detail First! for style#)</option>
                ) : (
                  styleOptions.map((style) => (
                    <option key={style.id} value={style.id}>
                    {console.log(style,"style number display")}
                      {style.number}
                    </option>
                  ))
                )}
              </select>
            </label>
            <label>
              Size:
              <input
                type="text"
                name="size"
                value={formData.size}
                onChange={handleChange}
                required
              />
            </label>
          </div>
          <div className="testst">
            <label>
              Quantity:
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                required
                min="1"
              />
            </label>
            <label>
              Sample Type:
              <input
                type="text"
                name="sampleType"
                value={formData.sampleType}
                onChange={handleChange}
                required
              />
            </label>
          </div>
          <label>
            Due Date:
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              onClick={handleDateClick}
              onFocus={(e) => e.target.showPicker()}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </label>
          <label>
            Comments:
            <textarea
              name="comments"
              value={formData.comments}
              onChange={handleChange}
            ></textarea>
          </label>
          <div className="modal-actions">
            <button type="submit">Save</button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SampleRequestModal;