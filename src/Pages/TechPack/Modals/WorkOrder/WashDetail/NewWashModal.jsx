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
  Divider,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import api from "../../../../../ApiServices/api";

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const NewWashModal = ({
  show,
  closeModal,
  onSubmit,
  techPackId,
  styleDetail,
  selectedCard,
  showSnackbar,
}) => {
  const SelectedId2 = selectedCard?.id;
  const styleDetail1 = styleDetail?._id;

  // Left panel state (original NewWashModal)
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [filteredImages, setFilteredImages] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [comments, setComments] = useState("");
  const [notes, setNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Right panel state (from ButtonModal)
  const [viewMode, setViewMode] = useState("existing");
  const [isUploadingNew, setIsUploadingNew] = useState(false);
  const [newPicture, setNewPicture] = useState({
    imageName: "",
    imageTitle: "",
    category: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [uploadFormErrors, setUploadFormErrors] = useState({
    imageName: false,
    imageTitle: false,
    category: false,
    imageFile: false,
  });
  const [validationTriggered, setValidationTriggered] = useState(false);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get("/api/picture/cat_name");
        setCategories(response.data.categories || []);
      } catch (err) {
        console.error("Error fetching categories:", err);
        showSnackbar("Error fetching categories", "error");
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      const fetchImages = async () => {
        try {
          const response = await api.get(`/api/picture/${selectedCategory}`);
          setImages(response.data.picture || []);
          setFilteredImages(response.data.picture || []); // Initialize filtered images
        } catch (err) {
          console.error("Error fetching images:", err);
          showSnackbar("Error fetching images", "error");
        }
      };

      fetchImages();
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedCard) {
      setSelectedCategory(selectedCard.detail_category || "");
      setSelectedImage(selectedCard.imageUrl || null);
      setComments(selectedCard.comments || "");
      setNotes("");
      setSearchQuery("");
    } else {
      resetForm();
    }
  }, [selectedCard]);

  const resetForm = () => {
    setSelectedCategory("");
    setSelectedImage(null);
    setComments("");
    setNotes("");
    setNewPicture({
      imageName: "",
      imageTitle: "",
      category: "",
    });
    setImageFile(null);
    setUploadFormErrors({
      imageName: false,
      imageTitle: false,
      category: false,
      imageFile: false,
    });
    setValidationTriggered(false);
    setViewMode("existing");
    setIsUploadingNew(false);
    setSearchQuery("");
    setFilteredImages([]);
  };

  const handleClose = () => {
    resetForm();
    closeModal();
  };

  const handleCategoryChange = async (e) => {
    const category = e.target.value;
    setSelectedCategory(category);
    setSelectedImage(null);
    setSearchQuery(""); // Reset search when category changes
  };

  const handleImageSelection = (imageId) => {
    setSelectedImage(imageId);
  };

  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    
    if (!query) {
      setFilteredImages(images);
      return;
    }

    const filtered = images.filter((image) => {
      // Search in all relevant fields
      return (
        (image.imageName && image.imageName.toLowerCase().includes(query)) ||
        (image.imageTitle && image.imageTitle.toLowerCase().includes(query)) ||
        (image._id && image._id.toLowerCase().includes(query)) ||
        (image.category && image.category.toLowerCase().includes(query))
      );
    });

    setFilteredImages(filtered);
  };

  // Right panel handlers
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
      setIsUploadingNew(newMode === "new");
    }
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

  const handleSubmit = () => {
    if (viewMode === "existing") {
      // Left panel submission
      if (!selectedImage) {
        showSnackbar("Please select an image.", "warning");
        return;
      }

      const payload = {
        pic: selectedImage,
        detail_category: selectedCategory,
        workOrder_Id: techPackId,
        comments: comments,
        notes: notes,
        wash_detail_id: styleDetail1,
        id: SelectedId2,
      };
      
      onSubmit(payload);
      resetForm();
      closeModal();
    } else {
      // Right panel submission
      setValidationTriggered(true);
      const isUploadFormValid = validateUploadForm();
      if (!isUploadFormValid) {
        setError("Please fill all required fields for upload.");
        setSnackbarOpen(true);
        return;
      }

      // Handle new image upload and submission
      const formData = new FormData();
      formData.append("imageUrl", imageFile);
      Object.entries(newPicture).forEach(([key, value]) =>
        formData.append(key, value)
      );

      api.post("/api/picture", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
        .then((uploadResponse) => {
          const newImageId = uploadResponse.data.data._id;
          const payload = {
            pic: newImageId,
            detail_category: newPicture.category,
            workOrder_Id: techPackId,
            comments: comments,
            notes: notes,
            wash_detail_id: styleDetail1,
            id: SelectedId2,
          };
          onSubmit(payload);
          resetForm();
          closeModal();
        })
        .catch((error) => {
          console.error("Error adding picture:", error);
          setError("Failed to upload picture.");
          setSnackbarOpen(true);
        });
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <>
      <Modal open={show} onClose={handleClose}>
        <Box sx={modalStyle}>
          <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
            {selectedCard ? "Edit Category Images" : "New Detail Images"}
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
                Select Existing Image
              </ToggleButton>
              <ToggleButton value="new" sx={{ textTransform: "none" }}>
                Upload New Image
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Box sx={splitContainerStyle}>
            {/* Left Panel - Existing Image Selection */}
            {viewMode === "existing" && (
              <Box sx={leftPanelStyle}>
                <FormControl fullWidth margin="normal">
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
                      variant="outlined"
                      label="Search Images"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      sx={{ mb: 2 }}
                    />
                    
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Available Images
                    </Typography>
                    <Box sx={imagesContainerStyle}>
                      {filteredImages?.length > 0 ? (
                        filteredImages?.map((image, index) => (
                          <Box key={index} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={selectedImage === image?._id}
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
                            <Typography variant="caption" sx={{ mt: -1, mb: 1 }}>
                              {image.imageName || 'Untitled'}
                            </Typography>
                          </Box>
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          {searchQuery ? "No matching images found" : "No images available for this category."}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                )}
              </Box>
            )}

            {/* Right Panel - New Image Upload */}
            {viewMode === "new" && (
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
              </Box>
            )}
          </Box>

          {/* Common fields for both panels */}
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              margin="normal"
              size="small"
              label="Comments"
              multiline
              rows={2}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
            <TextField
              fullWidth
              margin="normal"
              size="small"
              label="Notes"
              multiline
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Box>

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

const splitContainerStyle = {
  display: "flex",
  flexDirection: "row",
  width: "100%",
  gap: "16px",
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

export default NewWashModal;