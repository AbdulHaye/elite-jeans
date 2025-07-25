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
  Paper,
  Avatar,
  ToggleButtonGroup,
  ToggleButton,
  Snackbar,
  Alert,
} from "@mui/material";
import api from "../../../ApiServices/api";

const RivetModal = ({ isOpen, closeModal, onSubmit, techPackData }) => {
  // Initial state values
  const initialState = {
    categories: [],
    images: [],
    filteredImages: [],
    selectedCategory: "",
    selectedImages: [],
    loading: false,
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
  const [loading, setLoading] = useState(initialState.loading);
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
    setLoading(initialState.loading);
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
    }
  }, [isOpen]);

  const handleCategoryChange = async (e) => {
    const category = e.target.value;
    setSelectedCategory(category);
    setSelectedImages([]);
    setSearchQuery(""); // Reset search query when category changes
    setLoading(true);
    try {
      const response = await api.get(`/api/picture/${category}`);
      const imageUrls = response?.data?.picture?.map((item) => item);
      setImages(imageUrls || []);
      setFilteredImages(imageUrls || []); // Initialize filtered images with all images
    } catch (err) {
      console.error("Error fetching images for category:", err);
      setError("Failed to fetch images.");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelection = (imageId) => {
    setSelectedImages([imageId]);
  };

  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    
    if (!query) {
      setFilteredImages(images);
      return;
    }

    const filtered = images.filter((image) => {
      // Search in all relevant fields - adjust based on your image object structure
      return (
        (image.imageName && image.imageName.toLowerCase().includes(query)) ||
        (image.imageTitle && image.imageTitle.toLowerCase().includes(query)) ||
        (image._id && image._id.toLowerCase().includes(query)) ||
        (image.category && image.category.toLowerCase().includes(query))
      );
    });

    setFilteredImages(filtered);
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

      const rivetImages = selectedImages.map((imageId) => ({
        image: imageId,
        color: color,
        size: size,
        quantity: parseInt(quantity, 10),
        comment: comment,
      }));

      const payload = {
        rivetImages: rivetImages,
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

      // Then create the rivet image with the uploaded image
      const rivetImages = [
        {
          image: newImageId,
          color: color,
          size: size,
          quantity: parseInt(quantity, 10),
          comment: comment,
        },
      ];

      const payload = {
        rivetImages: rivetImages,
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
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: "80vh",
          overflowY: "auto",
        },
      }}
    >
      <DialogTitle sx={{ bgcolor: "primary.main", color: "white" }}>
        Rivet Selection
      </DialogTitle>
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
              Upload New Rivet Picture
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {viewMode === "existing" ? (
          <>
            <FormControl fullWidth sx={{ mb: 3 }} error={validationTriggered && !selectedCategory}>
              <InputLabel id="category-label">Category</InputLabel>
              <Select
                labelId="category-label"
                id="category"
                value={selectedCategory}
                onChange={handleCategoryChange}
                label="Category"
                disabled={loading}
              >
                <MenuItem value="">
                  <em>Select a Category</em>
                </MenuItem>
                {categories.map((category, index) => (
                  <MenuItem key={index} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
              {validationTriggered && !selectedCategory && (
                <FormHelperText>Please select a category</FormHelperText>
              )}
            </FormControl>

            {selectedCategory && !loading && (
              <TextField
                fullWidth
                margin="normal"
                variant="outlined"
                label="Search Pictures"
                value={searchQuery}
                onChange={handleSearchChange}
                sx={{ mb: 2 }}
              />
            )}

            {loading && (
              <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress />
              </Box>
            )}

            {selectedCategory && !loading && (
              <Box mb={3}>
                <Typography variant="h6" gutterBottom>
                  Images for {selectedCategory}
                </Typography>
                {filteredImages?.length > 0 ? (
                  <Grid container spacing={2}>
                    {filteredImages.map((image, index) => (
                      <Grid item xs={6} sm={4} md={3} key={index}>
                        <Paper
                          elevation={selectedImages.includes(image?._id) ? 6 : 2}
                          sx={{
                            p: 1,
                            borderRadius: 2,
                            cursor: "pointer",
                            border: selectedImages.includes(image?._id)
                              ? "2px solid #1976d2"
                              : validationTriggered && selectedImages.length === 0
                              ? "2px solid red"
                              : "1px solid #ccc",
                            transition: "all 0.2s ease",
                            "&:hover": {
                              borderColor: "#1976d2",
                              boxShadow: 4,
                            },
                          }}
                          onClick={() => handleImageSelection(image?._id)}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                            }}
                          >
                            <Checkbox
                              checked={selectedImages.includes(image?._id)}
                              onChange={() => handleImageSelection(image?._id)}
                              sx={{ alignSelf: "flex-start" }}
                            />
                            <Avatar
                              variant="rounded"
                              src={image?.imageUrl}
                              alt={`image-${index}`}
                              sx={{
                                width: 120,
                                height: 120,
                                mb: 1,
                              }}
                            />
                            <Typography variant="body2" noWrap sx={{ width: '100%', textAlign: 'center' }}>
                              {image.imageName || 'Untitled'}
                            </Typography>
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography variant="body1" color="textSecondary">
                    {searchQuery ? "No matching images found" : "No images available for this category."}
                  </Typography>
                )}
                {validationTriggered && selectedImages.length === 0 && (
                  <Typography variant="body2" color="error" mt={1}>
                    Please select at least one image
                  </Typography>
                )}
              </Box>
            )}
          </>
        ) : (
          <Box>
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
                <Avatar
                  variant="rounded"
                  src={URL.createObjectURL(imageFile)}
                  alt="Preview"
                  sx={{
                    width: 120,
                    height: 120,
                    mt: 1,
                  }}
                />
              </Box>
            )}
          </Box>
        )}

        {/* Common fields for both modes */}
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Color"
              value={color}
              onChange={(e) => {
                setColor(e.target.value);
                setFieldErrors({ ...fieldErrors, color: false });
              }}
              required
              margin="normal"
              error={fieldErrors.color && validationTriggered}
              helperText={
                fieldErrors.color && validationTriggered
                  ? "This field is required"
                  : ""
              }
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Size"
              value={size}
              onChange={(e) => {
                setSize(e.target.value);
                setFieldErrors({ ...fieldErrors, size: false });
              }}
              required
              margin="normal"
              error={fieldErrors.size && validationTriggered}
              helperText={
                fieldErrors.size && validationTriggered
                  ? "This field is required"
                  : ""
              }
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Quantity"
              type="number"
              value={quantity}
              onChange={handleQuantityChange}
              required
              margin="normal"
              error={fieldErrors.quantity && validationTriggered}
              helperText={
                fieldErrors.quantity && validationTriggered
                  ? "Please enter a valid quantity"
                  : ""
              }
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              multiline
              rows={3}
              margin="normal"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button variant="outlined" onClick={handleClose}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit}>
          Submit
        </Button>
      </DialogActions>

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
    </Dialog>
  );
};

export default RivetModal;