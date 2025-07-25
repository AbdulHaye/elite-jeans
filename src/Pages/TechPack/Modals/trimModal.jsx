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
  CircularProgress,
} from "@mui/material";
import axios from "axios";
import api from "../../../ApiServices/api";

const TrimModal = ({ isOpen, closeModal, onSubmit, techPackData }) => {
  // State for existing trims
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [filteredImages, setFilteredImages] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState({
    categories: false,
    images: false,
  });

  // State for new trim upload
  const [newTrim, setNewTrim] = useState({
    name: "",
    description: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [viewMode, setViewMode] = useState("existing"); // 'existing' or 'new'
  const [validationErrors, setValidationErrors] = useState({
    name: false,
    description: false,
    imageFile: false,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "error",
  });

  // Reset all form states
  const resetForm = () => {
    setSelectedCategory("");
    setSelectedImages([]);
    setImages([]);
    setFilteredImages([]);
    setSearchQuery("");
    setNewTrim({
      name: "",
      description: "",
    });
    setImageFile(null);
    setValidationErrors({
      name: false,
      description: false,
      imageFile: false,
    });
  };

  const handleClose = () => {
    resetForm();
    closeModal();
  };

  const showSnackbar = (message, severity = "error") => {
    setSnackbar({ open: true, message, severity });
  };

  // Fetch categories when modal opens
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(prev => ({...prev, categories: true}));
      try {
        const response = await api.get("/api/trim/getnames");
        setCategories(response.data.categories || []);
      } catch (err) {
        console.error("Error fetching categories:", err);
        showSnackbar("Failed to fetch categories.");
      } finally {
        setLoading(prev => ({...prev, categories: false}));
      }
    };

    if (isOpen) {
      fetchCategories();
    } else {
      // Reset when modal closes
      resetForm();
    }
  }, [isOpen]);

  const handleCategoryChange = async (e) => {
    const category = e.target.value;
    setSelectedCategory(category);
    setSelectedImages([]);
    setSearchQuery("");
    setLoading(prev => ({...prev, images: true}));
    try {
      const response = await api.get(`/api/trim/names?name=${category}`);
      const trims = response.data.trims || [];
      setImages(trims);
      setFilteredImages(trims);
    } catch (err) {
      console.error("Error fetching images for category:", err);
      showSnackbar("Failed to fetch trims.");
    } finally {
      setLoading(prev => ({...prev, images: false}));
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

  const validateNewTrim = () => {
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
      // Existing trim submission
      if (selectedImages.length === 0) {
        showSnackbar("Please select at least one trim.");
        return;
      }

      const payload = {
        labelTrim: selectedImages,
        isNewUpload: false,
      };

      onSubmit(payload);
      handleClose();
    } else {
      // New trim submission
      if (!validateNewTrim()) {
        showSnackbar("Please fill all required fields.");
        return;
      }

      try {
        const formData = new FormData();
        formData.append("name", newTrim.name);
        formData.append("description", newTrim.description);
        formData.append("previewImage", imageFile);

        setLoading(prev => ({...prev, images: true}));
        const response = await api.post("/api/trim", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const payload = {
          labelTrim: [response.data._id],
          isNewUpload: true,
        };

        onSubmit(payload);
        handleClose();
      } catch (err) {
        console.error("Error uploading new trim:", err);
        showSnackbar("Failed to upload new trim. Please try again.");
      } finally {
        setLoading(prev => ({...prev, images: false}));
      }
    }
  };

  return (
    <>
      <Modal open={isOpen} onClose={handleClose}>
        <Box sx={modalStyle}>
          <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
            Packaging Selection
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
                <InputLabel id="category-label">Packaging Category</InputLabel>
                <Select
                  labelId="category-label"
                  id="category"
                  value={selectedCategory}
                  label="Packaging Category"
                  onChange={handleCategoryChange}
                  disabled={loading.categories}
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
                {loading.categories && (
                  <CircularProgress size={24} sx={{ position: "absolute", right: 40, top: 10 }} />
                )}
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
                    Packaging for {selectedCategory} ({filteredImages.length})
                  </Typography>
                  
                  {loading.images ? (
                    <Box display="flex" justifyContent="center" my={4}>
                      <CircularProgress />
                    </Box>
                  ) : filteredImages.length > 0 ? (
                    <Box sx={imagesContainerStyle}>
                      {filteredImages.map((image, index) => (
                        <FormControlLabel
                          key={index}
                          control={
                            <Checkbox
                              checked={selectedImages.includes(image?._id)}
                              onChange={() => handleImageSelection(image?._id)}
                            />
                          }
                          label={
                            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                              <img
                                src={image?.previewImage}
                                alt={`trim-${index}`}
                                style={imageStyle}
                              />
                              <Typography variant="caption" sx={{ mt: 1 }}>
                                {image?.name || `Trim ${index + 1}`}
                              </Typography>
                            </Box>
                          }
                        />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body1" color="text.secondary" textAlign="center" py={4}>
                      {searchQuery ? 
                        "No packaging items match your search." : 
                        "No packaging available for this category."}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          ) : (
            <Box sx={{ maxHeight: "60vh", overflowY: "auto", pr: 2 }}>
              <TextField
                fullWidth
                margin="normal"
                label="Packaging Name"
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
            <Button 
              onClick={handleSubmit} 
              variant="contained" 
              color="primary"
              disabled={loading.images}
            >
              {loading.images ? <CircularProgress size={24} /> : "Submit"}
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