import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Box,
  Grid,
  FormControlLabel,
  Checkbox,
  Typography
} from "@mui/material";
import "./addWorkOrder.css";
import api from "../../../../ApiServices/api";

const AddWorkOrder = ({ isOpen, closeModal, onSubmit }) => {
  const [formData, setFormData] = useState({
    etd: "",
    itemType: "",
    vendor: "",
    categories: [], // Now an array
    subCategory: "",
    setType: null // '2pc' or '3pc' (optional)
  });

  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [itemTypes, setItemTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [errors, setErrors] = useState({
    etd: "",
    itemType: "",
    vendor: "",
    categories: "",
    subCategory: "",
  });
  const [touched, setTouched] = useState({
    etd: false,
    itemType: false,
    vendor: false,
    categories: false,
    subCategory: false,
  });

  const validateField = (fieldName, value) => {
    switch (fieldName) {
      case "vendor":
        return value ? "" : "Vendor is required";
      case "itemType":
        return value ? "" : "Item Type is required";
      case "categories":
        return value && value.length > 0 ? "" : "At least one category is required";
      case "subCategory":
        return value ? "" : "Sub Category is required";
      case "etd":
        return value ? "" : "ETD is required";
      default:
        return "";
    }
  };

  const handleSetTypeChange = (type) => {
    // Toggle setType - if same type is clicked again, set to null
    const newSetType = formData.setType === type ? null : type;
    
    setFormData({
      ...formData,
      setType: newSetType,
      // Keep existing categories up to the new limit
      categories: newSetType 
        ? formData.categories.slice(0, newSetType === '2pc' ? 2 : 3)
        : formData.categories.slice(0, 1)
    });
  };

  const handleCategoryChange = (index, value) => {
    const newCategories = [...formData.categories];
    newCategories[index] = value;
    
    setFormData({
      ...formData,
      categories: newCategories
    });
    
    setTouched({
      ...touched,
      categories: true
    });
    
    setErrors({
      ...errors,
      categories: validateField("categories", newCategories)
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value,
    });

    // Mark field as touched
    setTouched({
      ...touched,
      [name]: true,
    });

    // Validate current field
    const fieldError = validateField(name, value);
    setErrors({
      ...errors,
      [name]: fieldError,
    });
  };

  const fetchVendors = async () => {
    try {
      const response = await api.get("/api/vendors");
      setVendors(response.data);
    } catch (err) {
      console.error("Error fetching vendors:", err);
    }
  };

  const fetchItemTypes = async () => {
    try {
      const response = await api.get("/api/item-types");
      setItemTypes(response.data);
    } catch (err) {
      console.error("Error fetching item type options:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get("/api/categories");
      setCategories(response.data);
    } catch (err) {
      console.error("Error fetching category options:", err);
    }
  };

  const fetchSubCategories = async () => {
    try {
      const response = await api.get("/api/subcategories");
      setSubCategories(response.data);
    } catch (err) {
      console.error("Error fetching sub-category options:", err);
    }
  };

  useEffect(() => {
    fetchVendors();
    fetchItemTypes();
    fetchCategories();
    fetchSubCategories();
  }, []);

  const navigate = useNavigate();

  const handleNavigateWorkOrderdetail = (Id) => {
    navigate(`/work-order-detail/${Id}`);
  };

  const handleReset = () => {
    setFormData({
      etd: "",
      itemType: "",
      vendor: "",
      categories: [],
      subCategory: "",
      setType: null
    });
    setErrors({
      etd: "",
      itemType: "",
      vendor: "",
      categories: "",
      subCategory: "",
    });
    setTouched({
      etd: false,
      itemType: false,
      vendor: false,
      categories: false,
      subCategory: false,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields (excluding setType as it's optional)
    const formErrors = {
      vendor: validateField("vendor", formData.vendor),
      itemType: validateField("itemType", formData.itemType),
      categories: validateField("categories", formData.categories),
      subCategory: validateField("subCategory", formData.subCategory),
      etd: validateField("etd", formData.etd),
    };

    setErrors(formErrors);

    // Check if any errors exist
    const hasErrors = Object.values(formErrors).some((error) => error !== "");
    if (hasErrors) {
      // Mark all fields as touched to show errors
      setTouched({
        etd: true,
        itemType: true,
        vendor: true,
        categories: true,
        subCategory: true,
      });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/api/work-orders/create", {
        ...formData,
        // Send both itemType and setType separately to the backend
        itemType: formData.itemType,
        setType: formData.setType
      });
      const workOrderData = response.data.data;
      onSubmit(workOrderData);
      handleReset();
      const workorderid = response.data.data._id;
      handleNavigateWorkOrderdetail(workorderid);
      closeModal();
    } catch (err) {
      console.error("Submission error:", err);
      setErrors((prev) => ({
        ...prev,
        form: "There was an error submitting the form. Please try again.",
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={closeModal} maxWidth="sm" fullWidth>
      <DialogTitle>New Work Order</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                select
                label="Vendor"
                name="vendor"
                value={formData.vendor}
                onChange={handleChange}
                error={touched.vendor && Boolean(errors.vendor)}
                helperText={touched.vendor && errors.vendor}
                fullWidth
                required
                margin="normal"
              >
                <MenuItem value="">
                  <em>Select a Vendor</em>
                </MenuItem>
                {vendors?.map((vendor) => (
                  <MenuItem key={vendor._id} value={vendor._id}>
                    {vendor.name || "No Name Available"}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Set Type (Optional)
              </Typography>
              <Box display="flex" gap={2}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.setType === '2pc'}
                      onChange={() => handleSetTypeChange('2pc')}
                      color="primary"
                    />
                  }
                  label="2pc Set"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.setType === '3pc'}
                      onChange={() => handleSetTypeChange('3pc')}
                      color="primary"
                    />
                  }
                  label="3pc Set"
                />
              </Box>
            </Grid>

            <Grid item xs={12}>
              <TextField
                select
                label="Item Type"
                name="itemType"
                value={formData.itemType}
                onChange={handleChange}
                error={touched.itemType && Boolean(errors.itemType)}
                helperText={touched.itemType && errors.itemType}
                fullWidth
                required
                margin="normal"
              >
                <MenuItem value="">
                  <em>Select an Item Type</em>
                </MenuItem>
                {itemTypes?.map((type) => (
                  <MenuItem key={type._id} value={type._id}>
                    {type.name || "No Name Available"}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* First Category - Always shown and required */}
            <Grid item xs={12}>
              <TextField
                select
                label="Category 1"
                value={formData.categories[0] || ""}
                onChange={(e) => handleCategoryChange(0, e.target.value)}
                error={touched.categories && Boolean(errors.categories)}
                helperText={touched.categories && errors.categories}
                fullWidth
                required
                margin="normal"
              >
                <MenuItem value="">
                  <em>Select a Category</em>
                </MenuItem>
                {categories?.map((category) => (
                  <MenuItem key={category._id} value={category._id}>
                    {category.name || "No Name Available"}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Second Category - Shown when 2pc or 3pc is selected */}
            {formData.setType && (
              <Grid item xs={12}>
                <TextField
                  select
                  label="Category 2"
                  value={formData.categories[1] || ""}
                  onChange={(e) => handleCategoryChange(1, e.target.value)}
                  fullWidth
                  required={formData.setType !== null}
                  margin="normal"
                >
                  <MenuItem value="">
                    <em>Select a Category</em>
                  </MenuItem>
                  {categories?.map((category) => (
                    <MenuItem key={category._id} value={category._id}>
                      {category.name || "No Name Available"}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}

            {/* Third Category - Shown only when 3pc is selected */}
            {formData.setType === '3pc' && (
              <Grid item xs={12}>
                <TextField
                  select
                  label="Category 3"
                  value={formData.categories[2] || ""}
                  onChange={(e) => handleCategoryChange(2, e.target.value)}
                  fullWidth
                  required
                  margin="normal"
                >
                  <MenuItem value="">
                    <em>Select a Category</em>
                  </MenuItem>
                  {categories?.map((category) => (
                    <MenuItem key={category._id} value={category._id}>
                      {category.name || "No Name Available"}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}

            <Grid item xs={12}>
              <TextField
                select
                label="Sub Category"
                name="subCategory"
                value={formData.subCategory}
                onChange={handleChange}
                error={touched.subCategory && Boolean(errors.subCategory)}
                helperText={touched.subCategory && errors.subCategory}
                fullWidth
                required
                margin="normal"
              >
                <MenuItem value="">
                  <em>Select a Sub Category</em>
                </MenuItem>
                {subCategories?.map((subCat) => (
                  <MenuItem key={subCat._id} value={subCat._id}>
                    {subCat.name || "No Name Available"}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12}>
           <TextField
  type="date"
  label="Estimated Time of Delivery"
  name="etd"
  value={formData.etd}
  onChange={handleChange}
  error={touched.etd && Boolean(errors.etd)}
  helperText={touched.etd && errors.etd}
  fullWidth
  required
  margin="normal"
  InputLabelProps={{ shrink: true }}
  sx={{
    "& .MuiInputBase-root": {
      position: "relative",
    },
    "& input[type='date']::-webkit-calendar-picker-indicator": {
      position: "absolute",
      left: 0,
      top: 0,
      width: "100%",
      height: "100%",
      opacity: 0,
      cursor: "pointer",
    },
  }}
/>
            </Grid>
          </Grid>

          {errors.form && (
            <Box sx={{ color: "error.main", mt: 2, textAlign: "center" }}>
              {errors.form}
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={closeModal} color="secondary" variant="outlined">
          Cancel
        </Button>
        <Button 
          onClick={handleReset} 
          color="secondary" 
          variant="outlined"
          sx={{ mr: 2 }}
        >
          Reset
        </Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddWorkOrder;