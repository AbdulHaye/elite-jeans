import React, { useState, useEffect } from "react";
import {
  Modal,
  Box,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  FormHelperText,
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import api from "../../../../../ApiServices/api";

const EditWorkOrderModal = ({ isOpen, closeModal, onSubmit, techPackData }) => {
  const [formData, setFormData] = useState({
    etd: "",
    itemType: "",
    vendor: "",
    category: "",
    subCategory: "",
  });

  console.log(techPackData,"work order data")

  const [errors, setErrors] = useState({});
  const test = techPackData?._id;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [itemType, setItemType] = useState([]);
  const [category, setCategory] = useState([]);
  const [subCategory, setSubCategory] = useState([]);

  const fetchVendors = async () => {
    try {
      const response = await api.get("/api/vendors");
      setVendors(response.data);
    } catch (err) {
      console.error("Error fetching vendors:", err);
      setError("Failed to fetch vendor options.");
    }
  };

  const fetchItemType = async () => {
    try {
      const response = await api.get("/api/item-types");
      setItemType(response.data);
      console.log(response, "response response response");
    } catch (err) {
      console.error("Error fetching item type options:", err);
    }
  };

  const fetchCategory = async () => {
    try {
      const response = await api.get("/api/categories");
      setCategory(response.data);
    } catch (err) {
      console.error("Error fetching category options:", err);
    }
  };

  const fetchSubCategory = async () => {
    try {
      const response = await api.get("/api/subcategories");
      setSubCategory(response.data);
    } catch (err) {
      console.error("Error fetching subcategory options:", err);
    }
  };

  useEffect(() => {
    fetchVendors();
    fetchItemType();
    fetchCategory();
    fetchSubCategory();
  }, []);

  useEffect(() => {
    if (techPackData) {
      setFormData({
        etd: techPackData.etd ? techPackData.etd.split("T")[0] : "",
        itemType: techPackData.itemType?._id || "",
        vendor: techPackData.vendor?._id || "",
        category: techPackData.category?._id || "",
        subCategory: techPackData.subCategory?._id || "",
      });
    }
  }, [techPackData]);
  console.log(techPackData, "techPackData in edit");
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    if (value) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.vendor) newErrors.vendor = "Vendor is required";
    if (!formData.itemType) newErrors.itemType = "Item Type is required";
    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.subCategory)
      newErrors.subCategory = "Sub Category is required";
    if (!formData.etd) newErrors.etd = "ETD is required";

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await api.put(`/api/work-orders/${test}`, formData);
      const newTechPackData = response.data.data;
      onSubmit(newTechPackData);
      closeModal();
    } catch (err) {
      console.error("Error submitting form:", err);
      setError("There was an error submitting the form. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={isOpen} onClose={closeModal}>
      <Box sx={modalStyles}>
        <Typography variant="h6" gutterBottom>
          Edit Work Order
        </Typography>
        <form onSubmit={handleSubmit}>
          <FormControl fullWidth margin="normal" error={!!errors.vendor}>
            <InputLabel id="vendor-label">Vendor</InputLabel>
            <Select
              labelId="vendor-label"
              id="vendor"
              name="vendor"
              value={formData.vendor}
              onChange={handleChange}
              label="Vendor"
            >
              <MenuItem value="">Select a Vendor</MenuItem>
              {vendors.map((vendor) => (
                <MenuItem key={vendor._id} value={vendor._id}>
                  {vendor.name || "No Name Available"}
                </MenuItem>
              ))}
            </Select>
            {errors.vendor && <FormHelperText>{errors.vendor}</FormHelperText>}
          </FormControl>

          <FormControl fullWidth margin="normal" error={!!errors.itemType}>
            <InputLabel id="itemType-label">Item Type</InputLabel>
            <Select
              labelId="itemType-label"
              id="itemType"
              name="itemType"
              value={formData.itemType}
              onChange={handleChange}
              label="Item Type"
            >
              <MenuItem value="">Select an Item Type</MenuItem>
              {itemType.map((field) => (
                <MenuItem key={field?._id} value={field?._id}>
                  {field?.name || "No Name Available"}
                </MenuItem>
              ))}
            </Select>
            {errors.itemType && (
              <FormHelperText>{errors.itemType}</FormHelperText>
            )}
          </FormControl>

          <FormControl fullWidth margin="normal" error={!!errors.category}>
            <InputLabel id="category-label">Category</InputLabel>
            <Select
              labelId="category-label"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              label="Category"
            >
              <MenuItem value="">Select a Category</MenuItem>
              {category.map((field) => (
                <MenuItem key={field._id} value={field._id}>
                  {field.name || "No Name Available"}
                </MenuItem>
              ))}
            </Select>
            {errors.category && (
              <FormHelperText>{errors.category}</FormHelperText>
            )}
          </FormControl>

          <FormControl fullWidth margin="normal" error={!!errors.subCategory}>
            <InputLabel id="subCategory-label">Sub Category</InputLabel>
            <Select
              labelId="subCategory-label"
              id="subCategory"
              name="subCategory"
              value={formData.subCategory}
              onChange={handleChange}
              label="Sub Category"
            >
              <MenuItem value="">Select a Sub Category</MenuItem>
              {subCategory.map((field) => (
                <MenuItem key={field._id} value={field._id}>
                  {field.name || "No Name Available"}
                </MenuItem>
              ))}
            </Select>
            {errors.subCategory && (
              <FormHelperText>{errors.subCategory}</FormHelperText>
            )}
          </FormControl>

          <TextField
            fullWidth
            margin="normal"
            id="etd"
            name="etd"
            label="ETD"
            type="date"
            value={formData.etd}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            error={!!errors.etd}
            helperText={errors.etd}
            required
            sx={{
              '& input[type="date"]::-webkit-calendar-picker-indicator': {
                position: "absolute",
                right: 0,
                top: 0,
                width: "100%",
                height: "100%",
                margin: 0,
                padding: 0,
                cursor: "pointer",
                opacity: 0,
              },
            }}
          />

          {error && (
            <Typography color="error" margin="normal">
              {error}
            </Typography>
          )}

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 2,
            }}
          >
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit"}
            </Button>
            <Button variant="outlined" color="secondary" onClick={closeModal}>
              Cancel
            </Button>
          </Box>
        </form>
      </Box>
    </Modal>
  );
};

const modalStyles = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

export default EditWorkOrderModal;
