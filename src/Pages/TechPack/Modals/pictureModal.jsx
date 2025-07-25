import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Checkbox,
  Grid,
  Typography,
  Box,
  CircularProgress,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  Snackbar,
  FormControlLabel,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import axios from "axios";
import api from "../../../ApiServices/api";

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const PictureModal = ({ isOpen, closeModal, onSubmit, techPackData }) => {
  // Initial state values
  const initialState = {
    categories: [],
    images: [],
    filteredImages: [],
    selectedCategory: "",
    selectedImages: [],
    error: null,
    snackbarOpen: false,
    validationTriggered: false,
    newPicture: {
      imageName: "",
      imageTitle: "",
      category: "",
    },
    imageFile: null,
    uploadFormErrors: {
      imageName: false,
      imageTitle: false,
      category: false,
      imageFile: false,
    },
    viewMode: "existing", // 'existing' or 'new'
    loading: false,
    searchQuery: "",
  };

  // State management
  const [categories, setCategories] = useState(initialState.categories);
  const [images, setImages] = useState(initialState.images);
  const [filteredImages, setFilteredImages] = useState(initialState.filteredImages);
  const [selectedCategory, setSelectedCategory] = useState(initialState.selectedCategory);
  const [selectedImages, setSelectedImages] = useState(initialState.selectedImages);
  const [error, setError] = useState(initialState.error);
  const [snackbarOpen, setSnackbarOpen] = useState(initialState.snackbarOpen);
  const [validationTriggered, setValidationTriggered] = useState(initialState.validationTriggered);
  const [newPicture, setNewPicture] = useState(initialState.newPicture);
  const [imageFile, setImageFile] = useState(initialState.imageFile);
  const [uploadFormErrors, setUploadFormErrors] = useState(initialState.uploadFormErrors);
  const [viewMode, setViewMode] = useState(initialState.viewMode);
  const [loading, setLoading] = useState(initialState.loading);
  const [searchQuery, setSearchQuery] = useState(initialState.searchQuery);

  const resetModalState = () => {
    setSelectedCategory(initialState.selectedCategory);
    setSelectedImages(initialState.selectedImages);
    setImages(initialState.images);
    setFilteredImages(initialState.filteredImages);
    setError(initialState.error);
    setValidationTriggered(initialState.validationTriggered);
    setNewPicture(initialState.newPicture);
    setImageFile(initialState.imageFile);
    setUploadFormErrors(initialState.uploadFormErrors);
    setViewMode(initialState.viewMode);
    setLoading(initialState.loading);
    setSearchQuery(initialState.searchQuery);
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/picture/cat_name");
      setCategories(response.data.categories || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError("Failed to fetch categories.");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    } else {
      resetModalState();
    }
  }, [isOpen]);

  const handleCategoryChange = async (e) => {
    const category = e.target.value;
    setSelectedCategory(category);
    setSelectedImages([]);
    setSearchQuery("");
    setLoading(true);
    try {
      const response = await api.get(`/api/picture/${category}`);
      const imageUrls = response?.data?.picture?.map((item) => item);
      setImages(imageUrls || []);
      setFilteredImages(imageUrls || []);
    } catch (err) {
      console.error("Error fetching images for category:", err);
      setError("Failed to fetch images.");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    
    if (!query) {
      setFilteredImages(images);
      return;
    }

    const filtered = images.filter(image => {
      // Search in all string fields of the image object
      return Object.entries(image).some(([key, value]) => {
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
    setSelectedImages([imageId]);
  };

  const validateUploadForm = () => {
    const errors = {
      imageName: !newPicture.imageName,
      imageTitle: !newPicture.imageTitle,
      category: !newPicture.category,
      imageFile: !imageFile,
    };
    setUploadFormErrors(errors);
    return !Object.values(errors).some(Boolean);
  };

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
    setUploadFormErrors({ ...uploadFormErrors, imageFile: false });
  };

  const handleUploadFieldChange = (field) => (e) => {
    setNewPicture({ ...newPicture, [field]: e.target.value });
    setUploadFormErrors({ ...uploadFormErrors, [field]: false });
  };

  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  const handleSubmit = async () => {
    setValidationTriggered(true);

    // If we're selecting an existing image
    if (viewMode === "existing") {
      if (!selectedCategory) {
        setError("Please select a category.");
        setSnackbarOpen(true);
        return;
      }

      if (selectedImages.length === 0) {
        setError("Please select at least one image.");
        setSnackbarOpen(true);
        return;
      }

      const payload = {
        pictures: selectedImages,
        isNewUpload: false,
      };

      try {
        await onSubmit(payload);
        resetModalState();
        closeModal();
      } catch (err) {
        setError("Failed to submit selected images.");
        setSnackbarOpen(true);
      }
      return;
    }

    // If we're uploading a new image
    const isUploadFormValid = validateUploadForm();
    if (!isUploadFormValid) {
      setError("Please fill all required fields for upload.");
      setSnackbarOpen(true);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("imageUrl", imageFile);
      Object.entries(newPicture).forEach(([key, value]) =>
        formData.append(key, value)
      );

      setLoading(true);
      const uploadResponse = await api.post("/api/picture", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newImageId = uploadResponse.data.data._id;

      const payload = {
        pictures: [newImageId],
        isNewUpload: true,
      };

      await onSubmit(payload);
      resetModalState();
      closeModal();
    } catch (error) {
      console.error("Error adding picture:", error);
      setError("Failed to upload picture.");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleClose = () => {
    resetModalState();
    closeModal();
  };

  return (
    <>
      <Dialog
        open={isOpen}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "8px",
            maxHeight: "80vh",
          },
        }}
      >
        <DialogTitle>Style Picture</DialogTitle>
        <DialogContent dividers>
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
                    backgroundColor: "#1976d2",
                    color: "white",
                    fontWeight: "600",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                    "&:hover": {
                      backgroundColor: "#1565c0",
                    },
                  },
                },
              }}
            >
              <ToggleButton value="existing" sx={{ textTransform: "none" }}>
                Select Existing Picture
              </ToggleButton>
              <ToggleButton value="new" sx={{ textTransform: "none" }}>
                Upload New Picture
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {viewMode === "existing" ? (
            <Box>
              <FormControl
                fullWidth
                margin="normal"
                error={validationTriggered && !selectedCategory}
              >
                <InputLabel id="category-label">Category</InputLabel>
                <Select
                  labelId="category-label"
                  id="category"
                  value={selectedCategory}
                  label="Category"
                  onChange={handleCategoryChange}
                  disabled={loading}
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

              {selectedCategory && !loading && (
                <Box mt={2}>
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Search Pictures"
                    placeholder="Search by name, title, etc."
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                  
                  <Typography variant="subtitle1" gutterBottom>
                    Available Images for {selectedCategory} ({filteredImages.length})
                  </Typography>
                  
                  {loading && (
                    <Box display="flex" justifyContent="center" my={4}>
                      <CircularProgress />
                    </Box>
                  )}

                  {filteredImages?.length > 0 ? (
                    <Grid container spacing={2}>
                      {filteredImages?.map((image, index) => (
                        <Grid item xs={6} sm={4} md={3} key={index}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={selectedImages.includes(image?._id)}
                                  onChange={() => handleImageSelection(image?._id)}
                                />
                              }
                              label={
                                <Box
                                  component="img"
                                  src={image?.imageUrl}
                                  alt={`image-${index}`}
                                  sx={{
                                    width: "100%",
                                    height: "120px",
                                    objectFit: "cover",
                                    display: "block",
                                  }}
                                />
                              }
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                margin: 0,
                              }}
                            />
                            <Typography variant="caption" sx={{ mt: 1 }}>
                              {image?.imageName || 'Untitled'}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Typography variant="body1" color="textSecondary">
                      {searchQuery ? 
                        "No images match your search criteria." : 
                        "No images available for this category."}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          ) : (
            <Box>
              <TextField
                fullWidth
                margin="normal"
                size="small"
                label="Image Name"
                value={newPicture.imageName}
                onChange={handleUploadFieldChange("imageName")}
                error={uploadFormErrors.imageName && validationTriggered}
                helperText={
                  uploadFormErrors.imageName && validationTriggered
                    ? "This field is required"
                    : ""
                }
              />
              <TextField
                fullWidth
                margin="normal"
                size="small"
                label="Image Title"
                value={newPicture.imageTitle}
                onChange={handleUploadFieldChange("imageTitle")}
                error={uploadFormErrors.imageTitle && validationTriggered}
                helperText={
                  uploadFormErrors.imageTitle && validationTriggered
                    ? "This field is required"
                    : ""
                }
              />
              <TextField
                fullWidth
                margin="normal"
                size="small"
                label="Category"
                value={newPicture.category}
                onChange={handleUploadFieldChange("category")}
                error={uploadFormErrors.category && validationTriggered}
                helperText={
                  uploadFormErrors.category && validationTriggered
                    ? "This field is required"
                    : ""
                }
              />

              <Button
                variant="outlined"
                component="label"
                fullWidth
                size="small"
                sx={{ mt: 2, mb: 1 }}
                color={
                  uploadFormErrors.imageFile && validationTriggered
                    ? "error"
                    : "primary"
                }
              >
                Upload Image File
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </Button>
              {uploadFormErrors.imageFile && validationTriggered && (
                <FormHelperText error>
                  Please select an image file
                </FormHelperText>
              )}

              {imageFile && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Selected file: {imageFile.name}
                  </Typography>
                  <Box
                    component="img"
                    src={URL.createObjectURL(imageFile)}
                    alt="Preview"
                    sx={{
                      maxWidth: "100%",
                      maxHeight: "200px",
                      objectFit: "contain",
                    }}
                  />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
          <Button
            onClick={handleSubmit}
            color="primary"
            variant="contained"
            disabled={
              (viewMode === "existing" && selectedImages.length === 0) || loading
            }
          >
            {loading ? <CircularProgress size={24} /> : "Submit"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity="error" onClose={handleSnackbarClose}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};

export default PictureModal;