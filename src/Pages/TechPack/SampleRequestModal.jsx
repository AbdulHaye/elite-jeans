import React, { useState } from "react";
import "./sampleRequest.css";

const SampleRequestModal = ({ onClose, onSubmit, request }) => {
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
        }
      : {
          styleNumber: "",
          size: "",
          quantity: "",
          sampleType: "",
          dueDate: "",
          comments: "",
          status: "Pending",
        }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="modal">
      <div className="modal-content mdch">
        <h3>{request ? "Edit Sample Request" : "Add Sample Request"}</h3>
        <form onSubmit={handleSubmit}>
          <div className="testst">
            <label>
              Style #:
              <input
                type="text"
                name="styleNumber"
                value={formData.styleNumber}
                onChange={handleChange}
              />
            </label>
            <label>
              Size:
              <input
                type="text"
                name="size"
                value={formData.size}
                onChange={handleChange}
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
              />
            </label>
            <label>
              Sample Type:
              <input
                type="text"
                name="sampleType"
                value={formData.sampleType}
                onChange={handleChange}
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
              required
              // These attributes will ensure proper calendar functionality
              min={new Date().toISOString().split('T')[0]} // Optional: prevents selecting past dates
              onClick={(e) => e.target.showPicker()} // Ensures calendar opens on click
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
          <label>
            Status:
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
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