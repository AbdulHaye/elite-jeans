import React, { useState, useEffect } from "react";
import {
  Modal,
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Typography,
  FormHelperText,
  Checkbox,
  FormControlLabel,
  Grid
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import api from "../../ApiServices/api";

const INITIAL_FORM_STATE = {
  styleId: "",
  itemType: "",
  vendor: "",
  categories: [],
  subCategory: "",
  setType: null
};

const AddModal = ({ isOpen, closeModal, onSubmit }) => {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [touchedFields, setTouchedFields] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [itemTypes, setItemTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async (url, setter) => {
      try {
        const response = await api.get(url);
        setter(response.data);
      } catch (err) {
        console.error(`Error fetching data from ${url}:`, err);
      }
    };

    fetchData("/api/vendors", setVendors);
    fetchData("/api/item-types", setItemTypes);
    fetchData("/api/categories", setCategories);
    fetchData("/api/subcategories", setSubCategories);
  }, []);

  const handleSetTypeChange = (type) => {
    const newSetType = formData.setType === type ? null : type;
    
    setFormData({
      ...formData,
      setType: newSetType,
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
    
    setTouchedFields({
      ...touchedFields,
      categories: true
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setTouchedFields({ ...touchedFields, [e.target.name]: true });
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.styleId) errors.styleId = true;
    if (!formData.vendor) errors.vendor = true;
    if (!formData.itemType) errors.itemType = true;
    if (formData.categories.length === 0 || formData.categories.some(c => !c)) errors.categories = true;
    if (!formData.subCategory) errors.subCategory = true;
    
    // Validate set type constraints
    if (formData.setType === '2pc' && formData.categories.length !== 2) {
      errors.categories = true;
    }
    if (formData.setType === '3pc' && formData.categories.length !== 3) {
      errors.categories = true;
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();

    setTouchedFields({
      styleId: true,
      vendor: true,
      itemType: true,
      categories: true,
      subCategory: true,
    });

    if (Object.keys(errors).length > 0) {
      setError("Please fill all required fields correctly");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await api.post("/api/techPack", formData);
      onSubmit(response.data.data);
      closeModal();
      setFormData(INITIAL_FORM_STATE);
      setTouchedFields({});
    } catch (err) {
      console.error("Form submission error:", err);
      setError(
        err.response?.data?.message ||
          "There was an error submitting the form. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={isOpen} onClose={closeModal} aria-labelledby="create-tech-pack-modal">
      <Box sx={modalStyles}>
        <Typography variant="h5" sx={{ mb: 2, textAlign: "center", fontWeight: "bold" }}>
          Create TechPack
        </Typography>

        <form onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Style Id"
                name="styleId"
                value={formData.styleId}
                onChange={handleChange}
                fullWidth
                required
                margin="normal"
                error={touchedFields.styleId && !formData.styleId}
                helperText={
                  touchedFields.styleId && !formData.styleId
                    ? "Style Id is required"
                    : ""
                }
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth margin="normal" required error={touchedFields.vendor && !formData.vendor}>
                <InputLabel>Vendor</InputLabel>
                <Select
                  name="vendor"
                  value={formData.vendor}
                  onChange={handleChange}
                  label="Vendor"
                >
                  <MenuItem value="">
                    <em>Select Vendor</em>
                  </MenuItem>
                  {vendors.map((vendor) => (
                    <MenuItem key={vendor._id} value={vendor._id}>
                      {vendor.name || "No Name Available"}
                    </MenuItem>
                  ))}
                </Select>
                {touchedFields.vendor && !formData.vendor && (
                  <FormHelperText>Vendor is required</FormHelperText>
                )}
              </FormControl>
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
              <FormControl fullWidth margin="normal" required error={touchedFields.itemType && !formData.itemType}>
                <InputLabel>Item Type</InputLabel>
                <Select
                  name="itemType"
                  value={formData.itemType}
                  onChange={handleChange}
                  label="Item Type"
                >
                  <MenuItem value="">
                    <em>Select Item Type</em>
                  </MenuItem>
                  {itemTypes.map((type) => (
                    <MenuItem key={type._id} value={type._id}>
                      {type.name || "No Name Available"}
                    </MenuItem>
                  ))}
                </Select>
                {touchedFields.itemType && !formData.itemType && (
                  <FormHelperText>Item Type is required</FormHelperText>
                )}
              </FormControl>
            </Grid>

            {/* First Category - Always shown and required */}
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal" required error={touchedFields.categories && (!formData.categories[0] || formData.categories.length === 0)}>
                <InputLabel>Category 1</InputLabel>
                <Select
                  value={formData.categories[0] || ""}
                  onChange={(e) => handleCategoryChange(0, e.target.value)}
                  label="Category 1"
                >
                  <MenuItem value="">
                    <em>Select Category</em>
                  </MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category._id} value={category._id}>
                      {category.name || "No Name Available"}
                    </MenuItem>
                  ))}
                </Select>
                {touchedFields.categories && (!formData.categories[0] || formData.categories.length === 0) && (
                  <FormHelperText>Category is required</FormHelperText>
                )}
              </FormControl>
            </Grid>

            {/* Second Category - Shown when 2pc or 3pc is selected */}
            {formData.setType && (
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal" required>
                  <InputLabel>Category 2</InputLabel>
                  <Select
                    value={formData.categories[1] || ""}
                    onChange={(e) => handleCategoryChange(1, e.target.value)}
                    label="Category 2"
                  >
                    <MenuItem value="">
                      <em>Select Category</em>
                    </MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category._id} value={category._id}>
                        {category.name || "No Name Available"}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {/* Third Category - Shown only when 3pc is selected */}
            {formData.setType === '3pc' && (
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal" required>
                  <InputLabel>Category 3</InputLabel>
                  <Select
                    value={formData.categories[2] || ""}
                    onChange={(e) => handleCategoryChange(2, e.target.value)}
                    label="Category 3"
                  >
                    <MenuItem value="">
                      <em>Select Category</em>
                    </MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category._id} value={category._id}>
                        {category.name || "No Name Available"}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {/* Single Sub Category Field */}
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal" required error={touchedFields.subCategory && !formData.subCategory}>
                <InputLabel>Sub Category</InputLabel>
                <Select
                  name="subCategory"
                  value={formData.subCategory}
                  onChange={handleChange}
                  label="Sub Category"
                >
                  <MenuItem value="">
                    <em>Select Sub Category</em>
                  </MenuItem>
                  {subCategories.map((subCat) => (
                    <MenuItem key={subCat._id} value={subCat._id}>
                      {subCat.name || "No Name Available"}
                    </MenuItem>
                  ))}
                </Select>
                {touchedFields.subCategory && !formData.subCategory && (
                  <FormHelperText>Sub Category is required</FormHelperText>
                )}
              </FormControl>
            </Grid>
          </Grid>

          {error && (
            <Typography color="error" sx={{ mt: 2, textAlign: 'center' }}>
              {error}
            </Typography>
          )}

          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
            <Button
              variant="outlined"
              color="secondary"
              fullWidth
              onClick={closeModal}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={loading}
              sx={{ ml: 2 }}
            >
              {loading ? "Submitting..." : "Submit"}
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
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  width: { xs: "90%", sm: "600px" },
  borderRadius: "8px",
  maxHeight: '90vh',
  overflowY: 'auto'
};

export default AddModal;