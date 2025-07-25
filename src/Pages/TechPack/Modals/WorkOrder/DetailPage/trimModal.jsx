import React, { useState, useEffect } from "react";
import {
  Modal,
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Checkbox,
  FormControlLabel,
  Snackbar,
  Alert,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import axios from "axios";
import api from "../../../../../ApiServices/api";

const TrimModal = ({ isOpen, closeModal, onSubmit }) => {
  // Initial state
  const initialState = {
    categories: [],
    images: [],
    filteredImages: [],
    selectedCategory: "",
    selectedImages: [],
    error: null,
    snackbar: { open: false, message: "", severity: "error" },
    newTrim: {
      name: "",
      description: "",
    },
    imageFile: null,
    viewMode: "existing", // 'existing' or 'new'
    validationErrors: {
      name: false,
      description: false,
      imageFile: false,
    },
    searchQuery: "",
  };

  // State management
  const [categories, setCategories] = useState(initialState.categories);
  const [images, setImages] = useState(initialState.images);
  const [filteredImages, setFilteredImages] = useState(initialState.filteredImages);
  const [selectedCategory, setSelectedCategory] = useState(initialState.selectedCategory);
  const [selectedImages, setSelectedImages] = useState(initialState.selectedImages);
  const [error, setError] = useState(initialState.error);
  const [snackbar, setSnackbar] = useState(initialState.snackbar);
  const [newTrim, setNewTrim] = useState(initialState.newTrim);
  const [imageFile, setImageFile] = useState(initialState.imageFile);
  const [viewMode, setViewMode] = useState(initialState.viewMode);
  const [validationErrors, setValidationErrors] = useState(initialState.validationErrors);
  const [searchQuery, setSearchQuery] = useState(initialState.searchQuery);

  // Reset modal state when closed
  const resetModalState = () => {
    setCategories(initialState.categories);
    setImages(initialState.images);
    setFilteredImages(initialState.filteredImages);
    setSelectedCategory(initialState.selectedCategory);
    setSelectedImages(initialState.selectedImages);
    setError(initialState.error);
    setSnackbar(initialState.snackbar);
    setNewTrim(initialState.newTrim);
    setImageFile(initialState.imageFile);
    setViewMode(initialState.viewMode);
    setValidationErrors(initialState.validationErrors);
    setSearchQuery(initialState.searchQuery);
  };

  // Fetch categories on modal open
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get("/api/trim/getnames");
        setCategories(response.data.categories || []);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError("Failed to fetch categories.");
        showSnackbar("Failed to fetch categories.", "error");
      }
    };
    
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const handleCategoryChange = async (e) => {
    const category = e.target.value;
    setSelectedCategory(category);
    setSelectedImages([]);
    setSearchQuery("");
    
    try {
      const response = await api.get(`/api/trim/names?name=${category}`);
      const trims = response.data.trims || [];
      setImages(trims);
      setFilteredImages(trims);
    } catch (err) {
      console.error("Error fetching images for category:", err);
      setError("Failed to fetch images.");
      showSnackbar("Failed to fetch images for selected category.", "error");
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    
    if (!query) {
      setFilteredImages(images);
      return;
    }

    const filtered = images.filter(trim => {
      // Search in all string fields of the trim object
      return Object.entries(trim).some(([key, value]) => {
        // Skip _id field from search
        if (key === '_id') return false;
        
        // Search in string fields
        if (typeof value === 'string') {
          return value.toLowerCase().includes(query);
        }
        
        // Search in nested objects if needed
        if (typeof value === 'object' && value !== null) {
          return Object.values(value).some(
            nestedValue => typeof nestedValue === 'string' && 
                         nestedValue.toLowerCase().includes(query)
          );
        }
        
        return false;
      });
    });
    
    setFilteredImages(filtered);
  };

  const handleImageSelection = (imageId) => {
    setSelectedImages((prev) => {
      const updatedImages = prev.includes(imageId)
        ? prev.filter((id) => id !== imageId)
        : [...prev, imageId];
      return updatedImages;
    });
  };

  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  const handleNewTrimChange = (field) => (e) => {
    setNewTrim({ ...newTrim, [field]: e.target.value });
    setValidationErrors({ ...validationErrors, [field]: false });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    setValidationErrors({ ...validationErrors, imageFile: false });
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const validateNewTrimForm = () => {
    const errors = {
      name: !newTrim.name,
      description: !newTrim.description,
      imageFile: !imageFile,
    };
    setValidationErrors(errors);
    return !Object.values(errors).some(Boolean);
  };

  const handleSubmit = async () => {
    if (viewMode === "existing") {
      // Existing image selection validation
      if (!selectedCategory) {
        showSnackbar("Please select a packaging category.", "error");
        return;
      }

      if (selectedImages.length === 0) {
        showSnackbar("Please select at least one image.", "error");
        return;
      }

      const payload = {
        trim_id: selectedImages,
        isNewUpload: false,
      };

      onSubmit(payload);
      closeModal();
      resetModalState();
    } else {
      // New image upload validation
      const isValid = validateNewTrimForm();
      if (!isValid) {
        showSnackbar("Please fill all required fields.", "error");
        return;
      }

      try {
        const formData = new FormData();
        formData.append("name", newTrim.name);
        formData.append("description", newTrim.description);
        formData.append("previewImage", imageFile);

        // Upload new trim image
        const response = await api.post("/api/trim", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const newTrimId = response.data._id; // Adjust based on your API response

        const payload = {
          trim_id: [newTrimId],
          isNewUpload: true,
        };

        onSubmit(payload);
        closeModal();
        resetModalState();
      } catch (err) {
        console.error("Error uploading new packaging:", err);
        showSnackbar("Failed to upload new packaging.", "error");
      }
    }
  };

  const handleClose = () => {
    closeModal();
    resetModalState();
  };

  return (
    <>
      <Modal open={isOpen} onClose={handleClose}>
        <Box sx={modalStyle}>
          <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
            Packaging
          </Typography>

          <Box sx={{ mb: 2 }}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewModeChange}
              fullWidth
              sx={{
                "& .MuiToggleButton-root": {
                  backgroundColor: "#f5f5f5",
                  color: "#333",
                  border: "1px solid #ddd",
                  "&:hover": {
                    backgroundColor: "#e0e0e0",
                  },
                  "&.Mui-selected": {
                    backgroundColor: "#0d47a1",
                    color: "white",
                    fontWeight: "600",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                    "&:hover": {
                      backgroundColor: "#0b3d91",
                    },
                  },
                },
              }}
            >
              <ToggleButton value="existing" sx={{ textTransform: "none" }}>
                Select Existing Packaging
              </ToggleButton>
              <ToggleButton value="new" sx={{ textTransform: "none" }}>
                Upload New Packaging
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {viewMode === "existing" ? (
            <Box sx={{ maxHeight: "60vh", overflowY: "auto", pr: 2 }}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="category-label">Packaging</InputLabel>
                <Select
                  labelId="category-label"
                  id="category"
                  value={selectedCategory}
                  label="Packaging"
                  onChange={handleCategoryChange}
                >
                  <MenuItem value="">
                    <em>Select a Category</em>
                  </MenuItem>
                  {categories?.map((category, index) => (
                    <MenuItem key={index} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedCategory && (
                <Box>
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Search Packaging"
                    placeholder="Search by name, description, etc."
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                  
                  <Typography variant="subtitle1" sx={{ mt: 2 }}>
                    Images for {selectedCategory} ({filteredImages.length})
                  </Typography>
                  <Box sx={imagesContainerStyle}>
                    {filteredImages.length > 0 ? (
                      filteredImages.map((trim, index) => (
                        <Box key={index} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={selectedImages.includes(trim?._id)}
                                onChange={() => handleImageSelection(trim?._id)}
                              />
                            }
                            label={
                              <img
                                src={trim?.previewImage}
                                alt={`trim-${index}`}
                                style={imageStyle}
                              />
                            }
                          />
                          <Typography variant="caption" sx={{ mt: -1, mb: 1 }}>
                            {trim?.name}
                          </Typography>
                        </Box>
                      ))
                    ) : (
                      <Typography>
                        {searchQuery ? 
                          "No packaging items match your search." : 
                          "No images available for this category."}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
            </Box>
          ) : (
            <Box sx={{ maxHeight: "60vh", overflowY: "auto", pr: 2 }}>
              <TextField
                fullWidth
                margin="normal"
                label="Name"
                value={newTrim.name}
                onChange={handleNewTrimChange("name")}
                error={validationErrors.name}
                helperText={validationErrors.name ? "This field is required" : ""}
              />
              
              <TextField
                fullWidth
                margin="normal"
                label="Description"
                value={newTrim.description}
                onChange={handleNewTrimChange("description")}
                error={validationErrors.description}
                helperText={validationErrors.description ? "This field is required" : ""}
                multiline
                rows={3}
              />
              
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ mt: 2 }}
                color={validationErrors.imageFile ? "error" : "primary"}
              >
                Upload Image
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </Button>
              {validationErrors.imageFile && (
                <Typography color="error" variant="caption">
                  Please select an image file
                </Typography>
              )}
              
              {imageFile && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption">Preview:</Typography>
                  <img
                    src={URL.createObjectURL(imageFile)}
                    alt="Preview"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "200px",
                      marginTop: "8px",
                    }}
                  />
                </Box>
              )}
            </Box>
          )}

          <Box sx={modalActionsStyle}>
            <Button onClick={handleClose}>Close</Button>
            <Button onClick={handleSubmit} variant="contained" color="primary">
              Submit
            </Button>
          </Box>
        </Box>
      </Modal>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity} 
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

// Styles
const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 700,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  maxHeight: "80vh",
  display: "flex",
  flexDirection: "column",
};

const imagesContainerStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "10px",
  marginTop: "10px",
};

const imageStyle = {
  maxWidth: "150px",
  maxHeight: "150px",
  objectFit: "cover",
};

const modalActionsStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "10px",
  mt: 2,
  pt: 2,
  borderTop: "1px solid #e0e0e0",
};

export default TrimModal;