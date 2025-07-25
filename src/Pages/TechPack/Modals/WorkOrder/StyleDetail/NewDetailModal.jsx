import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
import "./NewDetailModal.css";
import api from "../../../../../ApiServices/api";

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const NewDetailModal = ({
  show,
  closeModal,
  onSubmit,
  techPackId,
  styleDetail,
  selectedCard,
  category_Id,
}) => {
  const SelectedId2 = selectedCard?.id;
  const styleDetail1 = styleDetail?._id;

  // Left panel state (existing image selection)
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [filteredImages, setFilteredImages] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [comments, setComments] = useState("");
  const [notes, setNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Right panel state (new image upload)
  const [viewMode, setViewMode] = useState("existing");
  const [newPicture, setNewPicture] = useState({
    imageName: "",
    imageTitle: "",
    category: "",
  });
  const [imageFile, setImageFile] = useState(null);
  
  // Validation states
  const [errors, setErrors] = useState({
    category: false,
    image: false,
    upload: {
      imageName: false,
      imageTitle: false,
      category: false,
      imageFile: false,
    }
  });
  
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "error",
  });

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
    setErrors({
      category: false,
      image: false,
      upload: {
        imageName: false,
        imageTitle: false,
        category: false,
        imageFile: false,
      }
    });
    setViewMode("existing");
    setSearchQuery("");
    setFilteredImages([]);
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get("/api/picture/cat_name");
        setCategories(response.data.categories || []);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setSnackbar({
          open: true,
          message: "Failed to load categories",
          severity: "error",
        });
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
          setSnackbar({
            open: true,
            message: "Failed to load images for selected category",
            severity: "error",
          });
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

  const handleCategoryChange = async (e) => {
    const category = e.target.value;
    setSelectedCategory(category);
    setSelectedImage(null);
    setSearchQuery(""); // Reset search when category changes
    setErrors({...errors, category: false});
  };

  const handleImageSelection = (imageId) => {
    setSelectedImage(imageId);
    setErrors({...errors, image: false});
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

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
    setErrors({
      ...errors,
      upload: {...errors.upload, imageFile: false}
    });
  };

  const handleUploadFieldChange = (field) => (e) => {
    setNewPicture({ ...newPicture, [field]: e.target.value });
    setErrors({
      ...errors,
      upload: {...errors.upload, [field]: false}
    });
  };

  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  const validateExistingForm = () => {
    const newErrors = {
      category: !selectedCategory,
      image: !selectedImage,
    };
    
    setErrors({
      ...errors,
      ...newErrors
    });
    
    if (newErrors.category || newErrors.image) {
      setSnackbar({
        open: true,
        message: "Please fill all required fields",
        severity: "error",
      });
      return false;
    }
    
    return true;
  };

  const validateUploadForm = () => {
    const uploadErrors = {
      imageName: !newPicture.imageName,
      imageTitle: !newPicture.imageTitle,
      category: !newPicture.category,
      imageFile: !imageFile,
    };
    
    setErrors({
      ...errors,
      upload: uploadErrors
    });
    
    if (Object.values(uploadErrors).some(Boolean)) {
      setSnackbar({
        open: true,
        message: "Please fill all required fields for upload",
        severity: "error",
      });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (viewMode === "existing") {
      if (!validateExistingForm()) return;
      
      const payload = {
        pic: selectedImage,
        detail_category: selectedCategory,
        techpack_Id: techPackId,
        comments: comments,
        notes: notes,
        style_detail_id: styleDetail1,
        id: SelectedId2,
        category_Id: category_Id,
      };
      
      try {
        await onSubmit(payload);
        if (!selectedCard) {
          resetForm();
        }
        closeModal();
      } catch (error) {
        console.error("Error submitting form:", error);
        setSnackbar({
          open: true,
          message: "Failed to submit form",
          severity: "error",
        });
      }
    } else {
      if (!validateUploadForm()) return;
      
      const formData = new FormData();
      formData.append("imageUrl", imageFile);
      Object.entries(newPicture).forEach(([key, value]) =>
        formData.append(key, value)
      );

      try {
        const uploadResponse = await api.post("/api/picture", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const newImageId = uploadResponse.data.data._id;
        const payload = {
          pic: newImageId,
          detail_category: newPicture.category,
          techpack_Id: techPackId,
          comments: comments,
          notes: notes,
          style_detail_id: styleDetail1,
          id: SelectedId2,
          category_Id: category_Id,
        };
        
        await onSubmit(payload);
        resetForm();
        closeModal();
      } catch (error) {
        console.error("Error uploading image:", error);
        setSnackbar({
          open: true,
          message: "Failed to upload image",
          severity: "error",
        });
      }
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({...snackbar, open: false});
  };

  return (
    <>
      <Dialog
        open={show}
        onClose={closeModal}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: "90vh",
            overflowY: "auto",
          }
        }}
      >
        <DialogTitle>
          {selectedCard ? "Edit Detail Images" : "New Detail Images"}
        </DialogTitle>
        <DialogContent>
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
                <FormControl fullWidth margin="normal" error={errors.category}>
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
                  {errors.category && (
                    <Typography color="error" variant="caption">
                      This field is required
                    </Typography>
                  )}
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
                    {errors.image && (
                      <Typography color="error" variant="caption">
                        Please select an image
                      </Typography>
                    )}
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
                  error={errors.upload.imageName}
                  helperText={
                    errors.upload.imageName ? "This field is required" : ""
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
                  error={errors.upload.imageTitle}
                  helperText={
                    errors.upload.imageTitle ? "This field is required" : ""
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
                  error={errors.upload.category}
                  helperText={
                    errors.upload.category ? "This field is required" : ""
                  }
                  sx={{ mb: 1 }}
                />

                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  size="small"
                  sx={{ mt: 1.5, mb: 2 }}
                  color={errors.upload.imageFile ? "error" : "primary"}
                >
                  Upload Image File
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </Button>
                {errors.upload.imageFile && (
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
        </DialogContent>
        <DialogActions sx={modalActionsStyle}>
          <Button onClick={closeModal}>Close</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

// Styles
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

export default NewDetailModal;