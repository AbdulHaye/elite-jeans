import React, { useState, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import api from "../../../../../ApiServices/api";

const StyleDetailModal = ({
  isOpen,
  closeModal,
  onSubmit,
  techPackData,
  techPackId,
  category_Id
}) => {
  const techPackID = techPackId;
  const id = techPackData?._id;
console.log(category_Id,"updte style detail with category iddddddd")
  const initialFormData = {
    dynamicAttributes: {},
    workOrder_Id: techPackID,
    category_Id: category_Id,
  };

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dynamicFields, setDynamicFields] = useState([]);
  const [fieldErrors, setFieldErrors] = useState([]);

  useEffect(() => {
    if (techPackData) {
      setFormData({
        dynamicAttributes: techPackData?.dynamicAttributes || {},
      });

      const dynamicAttributes = techPackData?.dynamicAttributes || {};
      const fields = Object?.entries(dynamicAttributes)?.map(
        ([key, value]) => ({
          key,
          value,
        })
      );
      setDynamicFields(fields);
    }
  }, [techPackData]);

  useEffect(() => {
    if (!isOpen) {
      setFormData(initialFormData);
      setFieldErrors([]);
    }
  }, [isOpen]);

  const handleDynamicFieldChange = (index, fieldName, value) => {
    const updatedFields = [...dynamicFields];
    updatedFields[index] = { ...updatedFields[index], [fieldName]: value };
    setDynamicFields(updatedFields);

    // Clear error for this field when user starts typing
    const updatedErrors = [...fieldErrors];
    updatedErrors[index] = {
      ...updatedErrors[index],
      [`${fieldName}Error`]: false,
    };
    setFieldErrors(updatedErrors);
  };

  const handleAddDetail = () => {
    setDynamicFields([...dynamicFields, { key: "", value: "" }]);
  };

  const handleDeleteDetail = (index) => {
    const updatedFields = dynamicFields?.filter((_, idx) => idx !== index);
    setDynamicFields(updatedFields);
    setFieldErrors(fieldErrors.filter((_, idx) => idx !== index));
  };

  const validateFields = () => {
    const errors = dynamicFields.map((field) => ({
      keyError: !field.key.trim(),
      valueError: !field.value.trim(),
    }));

    setFieldErrors(errors);
    return errors.some((error) => error.keyError || error.valueError);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (validateFields()) {
      setError("Both fields are required for all entries");
      return;
    }

    setLoading(true);

    const updatedDynamicAttributes = {};
    dynamicFields.forEach((field) => {
      if (field.key.trim() && field.value.trim()) {
        updatedDynamicAttributes[field.key.trim()] = field.value.trim();
      }
    });

    const requestData = {
      ...formData,
      dynamicAttributes: updatedDynamicAttributes,
      workOrder_Id: techPackId,
      category_Id: category_Id,
    };

    try {
      const response = techPackData
        ? await api.put(`/api/work-orders/styled-detail/${id}`, requestData)
        : await api.post(
            "/api/work-orders/styled-detail/create",
            requestData
          );

      onSubmit(response?.data?.data);
      closeModal();
    } catch (err) {
      console.error("Error submitting form:", err);
      setError("There was an error submitting the form. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={closeModal}>
      <DialogTitle>{techPackData ? "Edit" : "Add"} Style Detail</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <div>
            {dynamicFields?.map((field, index) => (
              <Grid
                container
                spacing={2}
                key={index}
                style={{ marginTop: "10px" }}
              >
                <Grid item xs={5}>
                  <TextField
                    fullWidth
                    label={`Key ${index + 1}`}
                    name={`key-${index}`}
                    value={field.key}
                    onChange={(e) =>
                      handleDynamicFieldChange(index, "key", e.target.value)
                    }
                    error={fieldErrors[index]?.keyError}
                    helperText={
                      fieldErrors[index]?.keyError && "Key is required"
                    }
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={5}>
                  <TextField
                    fullWidth
                    label={`Value ${index + 1}`}
                    name={`value-${index}`}
                    value={field.value}
                    onChange={(e) =>
                      handleDynamicFieldChange(index, "value", e.target.value)
                    }
                    error={fieldErrors[index]?.valueError}
                    helperText={
                      fieldErrors[index]?.valueError && "Value is required"
                    }
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={2}>
                  <IconButton
                    onClick={() => handleDeleteDetail(index)}
                    color="secondary"
                    style={{ marginTop: "16px" }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </Grid>
            ))}
          </div>
          <Button
            onClick={handleAddDetail}
            variant="outlined"
            color="primary"
            style={{ marginTop: "10px" }}
          >
            Add Detail
          </Button>
          {error && (
            <div style={{ color: "red", marginTop: "10px" }}>{error}</div>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            type="submit"
            color="primary"
            variant="contained"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit"}
          </Button>
          <Button onClick={closeModal} color="secondary">
            Cancel
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default StyleDetailModal;
