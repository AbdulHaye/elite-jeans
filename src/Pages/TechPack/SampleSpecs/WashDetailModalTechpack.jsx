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
import api from "../../../ApiServices/api";


function WashDetailModalTechpack({
    isOpen,
    closeModal,
    onSubmit,
    techPackData,
    techPackId,
    category
  }) {

    const id = techPackData?._id;

  const initialFormData = {
    dynamicAttributes: {},
    techpack_Id: techPackId,
  };

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dynamicFields, setDynamicFields] = useState([]);

  // Initialize form data when techPackData changes
  useEffect(() => {
    if (techPackData) {
      setFormData({
        dynamicAttributes: techPackData?.dynamicAttributes || {},
      });

      // Convert dynamicAttributes to dynamicFields
      const dynamicAttributes = techPackData?.dynamicAttributes || {};
      const fields = Object?.entries(dynamicAttributes)?.map(([key, value]) => ({
        key,
        value,
      }));
      setDynamicFields(fields);
    }
  }, [techPackData]);

  // Reset form when modal is closed
  // useEffect(() => {
  //   if (!isOpen) {
  //     setFormData(initialFormData);
  //     setDynamicFields([]);
  //   }
  // }, [isOpen]);

  const handleDynamicFieldChange = (index, fieldName, value) => {
    const updatedFields = [...dynamicFields];
    updatedFields[index] = { ...updatedFields[index], [fieldName]: value };
    setDynamicFields(updatedFields);

    // Update dynamicAttributes in formData
    const updatedDynamicAttributes = {};
    updatedFields.forEach((field) => {
      if (field.key && field.value) {
        updatedDynamicAttributes[field.key] = field.value;
      }
    });
    setFormData({
      ...formData,
      dynamicAttributes: updatedDynamicAttributes,
    });
  };

  const handleAddDetail = () => {
    setDynamicFields([...dynamicFields, { key: "", value: "" }]);
  };

  const handleDeleteDetail = (index) => {
    const updatedFields = dynamicFields?.filter((_, idx) => idx !== index);
    setDynamicFields(updatedFields);

    // Update dynamicAttributes in formData
    const updatedDynamicAttributes = {};
    updatedFields?.forEach((field) => {
      if (field?.key && field?.value) {
        updatedDynamicAttributes[field?.key] = field?.value;
      }
    });
    setFormData({
      ...formData,
      dynamicAttributes: updatedDynamicAttributes,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const requestData = {
      ...formData,
      techpack_Id: techPackId,
          category_Id: category?.category?._id,
    };

    try {
      const response = techPackData
        ? await api.put(`/api/work-orders/wash-detail/${id}`, requestData)
        : await api.post("/api/work-orders/wash-detail/create", requestData);

      const newWashDetailData = response?.data?.data;
      onSubmit(newWashDetailData);
      closeModal();
    } catch (err) {
      console.error("Error submitting form:", err);
      setError("There was an error submitting the form. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  return (

    
    <div>

<Dialog open={isOpen} onClose={closeModal}>
      <DialogTitle>{techPackData ? "Edit" : "Add"} Wash Detail</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {/* Dynamic Attributes */}
          <div>
            {dynamicFields?.map((field, index) => (
              <Grid container spacing={2} key={index} style={{ marginTop: "10px" }}>
                <Grid item xs={5}>
                  <TextField
                    fullWidth
                    label={`Key ${index + 1}`}
                    name={`key-${index}`}
                    value={field?.key}
                    onChange={(e) =>
                      handleDynamicFieldChange(index, "key", e.target.value)
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

          {/* Add Detail Button */}
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


    </div>
  )
}

export default WashDetailModalTechpack