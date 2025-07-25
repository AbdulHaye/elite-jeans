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
  TextField,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import api from "../../../../../ApiServices/api";

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const TrimConModal = ({ isOpen, closeModal, onSubmit }) => {
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
    isUploadingNew: false,
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
    color: "",
    size: "",
    quantity: "",
    comment: "",
    fieldErrors: {
      color: false,
      size: false,
      quantity: false,
    },
    viewMode: "existing", // 'existing' or 'new'
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
  const [isUploadingNew, setIsUploadingNew] = useState(initialState.isUploadingNew);
  const [newPicture, setNewPicture] = useState(initialState.newPicture);
  const [imageFile, setImageFile] = useState(initialState.imageFile);
  const [uploadFormErrors, setUploadFormErrors] = useState(initialState.uploadFormErrors);
  const [color, setColor] = useState(initialState.color);
  const [size, setSize] = useState(initialState.size);
  const [quantity, setQuantity] = useState(initialState.quantity);
  const [comment, setComment] = useState(initialState.comment);
  const [fieldErrors, setFieldErrors] = useState(initialState.fieldErrors);
  const [viewMode, setViewMode] = useState(initialState.viewMode);
  const [searchQuery, setSearchQuery] = useState(initialState.searchQuery);

  const resetModalState = () => {
    setSelectedCategory(initialState.selectedCategory);
    setSelectedImages(initialState.selectedImages);
    setImages(initialState.images);
    setFilteredImages(initialState.filteredImages);
    setError(initialState.error);
    setValidationTriggered(initialState.validationTriggered);
    setIsUploadingNew(initialState.isUploadingNew);
    setNewPicture(initialState.newPicture);
    setImageFile(initialState.imageFile);
    setUploadFormErrors(initialState.uploadFormErrors);
    setColor(initialState.color);
    setSize(initialState.size);
    setQuantity(initialState.quantity);
    setComment(initialState.comment);
    setFieldErrors(initialState.fieldErrors);
    setViewMode(initialState.viewMode);
    setSearchQuery(initialState.searchQuery);
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get("/api/picture/cat_name");
      setCategories(response.data.categories || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError("Failed to fetch categories.");
      setSnackbarOpen(true);
    }
  };

  useEffect(() => {
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
      const response = await api.get(`/api/picture/${category}`);
      const imageUrls = response?.data?.picture?.map((item) => item);
      setImages(imageUrls || []);
      setFilteredImages(imageUrls || []);
    } catch (err) {
      console.error("Error fetching images for category:", err);
      setError("Failed to fetch images.");
      setSnackbarOpen(true);
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

  const validateFields = () => {
    const errors = {
      color: !color.trim(),
      size: !size.trim(),
      quantity: quantity === "" || isNaN(quantity),
    };
    setFieldErrors(errors);
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

  const handleQuantityChange = (e) => {
    const value = e.target.value;
    if (value === "" || !isNaN(value)) {
      setQuantity(value);
      setFieldErrors({ ...fieldErrors, quantity: false });
    }
  };

  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
      setIsUploadingNew(newMode === "new");
    }
  };

  const handleSubmit = async () => {
    setValidationTriggered(true);

    // Validate common fields
    const areFieldsValid = validateFields();
    if (!areFieldsValid) {
      setError("Please fill all required fields.");
      setSnackbarOpen(true);
      return;
    }

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

      const trimImages = selectedImages?.map((imageId) => ({
        image: imageId,
        color: color,
        size: size,
        quantity: parseInt(quantity, 10),
        comment: comment,
      }));

      const payload = {
        trimImages: trimImages,
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
      // First upload the new image
      const formData = new FormData();
      formData.append("imageUrl", imageFile);
      Object.entries(newPicture).forEach(([key, value]) =>
        formData.append(key, value)
      );

      const uploadResponse = await api.post("/api/picture", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newImageId = uploadResponse.data.data._id;

      // Then create the trim image with the uploaded image
      const trimImages = [
        {
          image: newImageId,
          color: color,
          size: size,
          quantity: parseInt(quantity, 10),
          comment: comment,
        },
      ];

      const payload = {
        trimImages: trimImages,
        isNewUpload: true,
      };

      await onSubmit(payload);
      resetModalState();
      closeModal();
    } catch (error) {
      console.error("Error adding picture:", error);
      setError("Failed to upload picture.");
      setSnackbarOpen(true);
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
      <Modal open={isOpen} onClose={handleClose}>
        <Box sx={modalStyle}>
          <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
            Trim Images
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
                  "&.Mui-selected.Mui-disabled": {
                    backgroundColor: "#0d47a1",
                    color: "rgba(255,255,255,0.5)",
                  },
                },
                "& .MuiToggleButtonGroup-grouped": {
                  "&:not(:first-of-type)": {
                    borderLeft: "1px solid #ddd",
                  },
                },
              }}
            >
              <ToggleButton value="existing" sx={{ textTransform: "none" }}>
                Upload from Existing Picture
              </ToggleButton>
              <ToggleButton value="new" sx={{ textTransform: "none" }}>
                Upload New Trim Picture
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {viewMode === "existing" ? (
            <Box sx={leftPanelStyle}>
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
                <Box sx={{ mt: 2 }}>
                  <TextField
                    fullWidth
                    margin="normal"
                    size="small"
                    label="Search Trim Images"
                    placeholder="Search by name, title, etc."
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                  
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Available Images ({filteredImages.length})
                  </Typography>
                  <Box sx={imagesContainerStyle}>
                    {filteredImages?.length > 0 ? (
                      filteredImages.map((image, index) => (
                        <Box key={index} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={selectedImages.includes(image?._id)}
                                onChange={() => handleImageSelection(image?._id)}
                              />
                            }
                            label={
                              <img
                                src={image?.imageUrl}
                                alt={`image-${index}`}
                                style={imageStyle}
                              />
                            }
                          />
                          <Typography variant="caption" sx={{ mt: -1 }}>
                            {image?.imageName || 'Untitled'}
                          </Typography>
                        </Box>
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        {searchQuery ? 
                          "No images match your search criteria." : 
                          "No images available for this category."}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}

              {/* Common fields for existing images */}
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  margin="normal"
                  size="small"
                  label="Color"
                  value={color}
                  onChange={(e) => {
                    setColor(e.target.value);
                    setFieldErrors({ ...fieldErrors, color: false });
                  }}
                  error={fieldErrors.color && validationTriggered}
                  helperText={
                    fieldErrors.color && validationTriggered
                      ? "This field is required"
                      : ""
                  }
                  required
                />
                <TextField
                  fullWidth
                  margin="normal"
                  size="small"
                  label="Size"
                  value={size}
                  onChange={(e) => {
                    setSize(e.target.value);
                    setFieldErrors({ ...fieldErrors, size: false });
                  }}
                  error={fieldErrors.size && validationTriggered}
                  helperText={
                    fieldErrors.size && validationTriggered
                      ? "This field is required"
                      : ""
                  }
                  required
                />
                <TextField
                  fullWidth
                  margin="normal"
                  size="small"
                  label="Quantity"
                  value={quantity}
                  onChange={handleQuantityChange}
                  error={fieldErrors.quantity && validationTriggered}
                  helperText={
                    fieldErrors.quantity && validationTriggered
                      ? "Please enter a valid quantity"
                      : ""
                  }
                  required
                />
                <TextField
                  fullWidth
                  margin="normal"
                  size="small"
                  label="Comment"
                  multiline
                  rows={2}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </Box>
            </Box>
          ) : (
            <Box sx={rightPanelStyle}>
              <TextField
                fullWidth
                margin="dense"
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
                sx={{ mb: 1 }}
              />
              <TextField
                fullWidth
                margin="dense"
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
                sx={{ mb: 1 }}
              />
              <TextField
                fullWidth
                margin="dense"
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
                sx={{ mb: 1 }}
              />

              <Button
                variant="outlined"
                component="label"
                fullWidth
                size="small"
                sx={{ mt: 1.5, mb: 2 }}
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
                <Typography
                  color="error"
                  variant="caption"
                  sx={{ mt: -2, mb: 2, display: "block" }}
                >
                  Please select an image file
                </Typography>
              )}

              {imageFile && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ display: "block" }}>
                    Selected file: {imageFile.name}
                  </Typography>
                  <img
                    src={URL.createObjectURL(imageFile)}
                    alt="Preview"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "150px",
                      marginTop: "8px",
                    }}
                  />
                </Box>
              )}

              {/* Common fields for new image upload */}
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  margin="normal"
                  size="small"
                  label="Color"
                  value={color}
                  onChange={(e) => {
                    setColor(e.target.value);
                    setFieldErrors({ ...fieldErrors, color: false });
                  }}
                  error={fieldErrors.color && validationTriggered}
                  helperText={
                    fieldErrors.color && validationTriggered
                      ? "This field is required"
                      : ""
                  }
                  required
                />
                <TextField
                  fullWidth
                  margin="normal"
                  size="small"
                  label="Size"
                  value={size}
                  onChange={(e) => {
                    setSize(e.target.value);
                    setFieldErrors({ ...fieldErrors, size: false });
                  }}
                  error={fieldErrors.size && validationTriggered}
                  helperText={
                    fieldErrors.size && validationTriggered
                      ? "This field is required"
                      : ""
                  }
                  required
                />
                <TextField
                  fullWidth
                  margin="normal"
                  size="small"
                  label="Quantity"
                  value={quantity}
                  onChange={handleQuantityChange}
                  error={fieldErrors.quantity && validationTriggered}
                  helperText={
                    fieldErrors.quantity && validationTriggered
                      ? "Please enter a valid quantity"
                      : ""
                  }
                  required
                />
                <TextField
                  fullWidth
                  margin="normal"
                  size="small"
                  label="Comment"
                  multiline
                  rows={2}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </Box>
            </Box>
          )}

          <Box sx={modalActionsStyle}>
            <Button onClick={handleClose}>Close</Button>
            <Button onClick={handleSubmit} variant="contained" color="primary">
              Submit
            </Button>
          </Box>

          {error && (
            <Typography color="error" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
        </Box>
      </Modal>

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

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "80%",
  maxWidth: "1000px",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  maxHeight: "90vh",
  display: "flex",
  flexDirection: "column",
  overflowY: "auto",
};

const leftPanelStyle = {
  flex: 1,
  minWidth: 0,
};

const rightPanelStyle = {
  flex: 1,
  minWidth: 0,
};

const imagesContainerStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "10px",
  marginTop: "10px",
  maxHeight: "400px",
  overflowY: "auto",
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

export default TrimConModal;