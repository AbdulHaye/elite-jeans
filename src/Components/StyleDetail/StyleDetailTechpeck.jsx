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
import api from "../../ApiServices/api";

function StyleDetailTechpeck({
  isOpen,
  closeModal,
  onSubmit,
  techPackData,
  techPackId,
  isAddMode,
   categoryId
}) {
  const id = techPackData?._id;
  const initialFormData = {
    dynamicAttributes: {},
    techpack_Id: techPackId,
    category_Id: categoryId,
  };
console.log(categoryId,"category for tech pack  style id use")
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dynamicFields, setDynamicFields] = useState([]);
  const [fieldErrors, setFieldErrors] = useState([]);

  useEffect(() => {
    if (!isOpen || !techPackId) {
      resetForm();
      return;
    }

    if (techPackData && !isAddMode) {
      const dynamicAttributes = techPackData.dynamicAttributes || {};
      const fields = Object.entries(dynamicAttributes).map(([key, value]) => ({
        key,
        value,
      }));
      setDynamicFields(fields);
      setFieldErrors(fields.map(() => ({ key: false, value: false })));
      setFormData({
        dynamicAttributes,
        techpack_Id: techPackId,
      });
    } else {
      resetForm();
    }
  }, [techPackId, techPackData, isOpen, isAddMode]);

  const resetForm = () => {
    setFormData(initialFormData);
    setDynamicFields([]);
    setFieldErrors([]);
  };

  const handleDynamicFieldChange = (index, fieldName, value) => {
    const updatedFields = [...dynamicFields];
    updatedFields[index][fieldName] = value;
    setDynamicFields(updatedFields);

    // Clear error when user starts typing
    const updatedErrors = [...fieldErrors];
    updatedErrors[index][fieldName] = false;
    setFieldErrors(updatedErrors);
  };

  const handleAddDetail = () => {
    setDynamicFields([...dynamicFields, { key: "", value: "" }]);
    setFieldErrors([...fieldErrors, { key: false, value: false }]);
  };

  const handleDeleteDetail = (index) => {
    const updatedFields = dynamicFields.filter((_, idx) => idx !== index);
    const updatedErrors = fieldErrors.filter((_, idx) => idx !== index);
    setDynamicFields(updatedFields);
    setFieldErrors(updatedErrors);
  };

  const validateFields = () => {
    let isValid = true;
    const errors = dynamicFields.map((field) => {
      const newError = {
        key: !field.key.trim(),
        value: !field.value.trim()
      };
      if (newError.key || newError.value) isValid = false;
      return newError;
    });
    
    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate only if there are dynamic fields
    if (dynamicFields.length > 0 && !validateFields()) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);

    // Build valid dynamic attributes
    const dynamicAttributes = dynamicFields.reduce((acc, field) => {
      if (field.key.trim() && field.value.trim()) {
        acc[field.key.trim()] = field.value.trim();
      }
      return acc;
    }, {});

    const requestData = {
      ...formData,
      dynamicAttributes,
      techpack_Id: techPackId,
      category_Id: categoryId,
    };

    try {
      const response = techPackData && !isAddMode
        ? await api.put(`/api/work-orders/styled-detail/${id}`, requestData)
        : await api.post("/api/work-orders/styled-detail/create", requestData);

      onSubmit(response.data.data);
      closeModal();
    } catch (err) {
      console.error("Error submitting form:", err);
      setError(err.response?.data?.message || "There was an error submitting the form. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={closeModal} fullWidth maxWidth="md">
      <DialogTitle>{techPackData && !isAddMode ? "Edit" : "Add"} Style Detail Tech Pack </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <div>
            {dynamicFields.map((field, index) => (
              <Grid container spacing={2} key={index} style={{ marginTop: "10px" }}>
                <Grid item xs={5}>
                  <TextField
                    fullWidth
                    label={`Key ${index + 1}`}
                    value={field.key}
                    onChange={(e) => handleDynamicFieldChange(index, "key", e.target.value)}
                    error={fieldErrors[index]?.key}
                    helperText={fieldErrors[index]?.key && "Key is required"}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={5}>
                  <TextField
                    fullWidth
                    label={`Value ${index + 1}`}
                    value={field.value}
                    onChange={(e) => handleDynamicFieldChange(index, "value", e.target.value)}
                    error={fieldErrors[index]?.value}
                    helperText={fieldErrors[index]?.value && "Value is required"}
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
          
          {error && <div style={{ color: "red", marginTop: "10px" }}>{error}</div>}
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
}

export default StyleDetailTechpeck;