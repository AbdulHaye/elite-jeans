import React, { useState, useEffect } from "react";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import api from "../../../../../ApiServices/api";

const ButtonsRivetsModal = ({
  isOpen,
  closeModal,
  onSubmit,
  type, // 'button' or 'rivet'
  techPackData,
}) => {
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState("");
  const [comment, setComment] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("error");
  const [colorError, setColorError] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [quantityError, setQuantityError] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get("/api/picture/cat_name");
        setCategories(response?.data?.categories || []);
      } catch (err) {
        console.error("Error fetching categories:", err);
        showSnackbar("Failed to fetch categories.", "error");
      }
    };
    fetchCategories();
  }, []);

  const handleCategoryChange = async (e) => {
    const category = e.target.value;
    setSelectedCategory(category);
    setSelectedImages([]);
    try {
      const response = await api.get(`/api/picture/${category}`);
      const imageUrls = response?.data?.picture?.map((item) => item);
      setImages(imageUrls || []);
    } catch (err) {
      console.error("Error fetching images for category:", err);
      showSnackbar("Failed to fetch images.", "error");
    }
  };

  const handleImageSelection = (imageId) => {
    setSelectedImages([imageId]);
  };

  const handleQuantityChange = (e) => {
    const value = e.target.value;
    if (value === "" || /^[1-9]\d*$/.test(value)) {
      setQuantity(value);
      setQuantityError(false);
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const validateForm = () => {
    let isValid = true;

    if (selectedImages.length === 0) {
      showSnackbar("Please select at least one image.", "error");
      isValid = false;
    }

    if (color.trim() === "") {
      setColorError(true);
      isValid = false;
    }

    if (size.trim() === "") {
      setSizeError(true);
      isValid = false;
    }

    if (quantity === "" || parseInt(quantity, 10) <= 0) {
      setQuantityError(true);
      showSnackbar("Please enter a valid quantity.", "error");
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const imagesPayload = selectedImages?.map((imageId) => ({
      image: imageId,
      color: color,
      size: size,
      quantity: parseInt(quantity, 10),
      comment: comment,
    }));

    const payload = {
      [`${type}Images`]: imagesPayload,
    };

    onSubmit(payload);
    closeModal();
  };

  return (
    <>
      <Modal open={isOpen} onClose={closeModal}>
        <Box sx={modalStyle}>
          <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
            {type === "rivet" ? "Rivet" : "Button"} Images
          </Typography>
          <Box sx={{ maxHeight: "60vh", overflowY: "auto", pr: 2 }}>
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
              <Box>
                <Typography variant="subtitle1" sx={{ mt: 2 }}>
                  Images for {selectedCategory}
                </Typography>
                <Box sx={imagesContainerStyle}>
                  {images?.length > 0 ? (
                    images?.map((image, index) => (
                      <FormControlLabel
                        key={index}
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
                    ))
                  ) : (
                    <Typography>
                      No images available for this category.
                    </Typography>
                  )}
                </Box>
              </Box>
            )}

            <TextField
              fullWidth
              margin="normal"
              label="Color"
              value={color}
              onChange={(e) => {
                setColor(e.target.value);
                setColorError(false);
              }}
              error={colorError}
              helperText={colorError ? "Color is required" : ""}
              required
            />
            <TextField
              fullWidth
              margin="normal"
              label="Size"
              value={size}
              onChange={(e) => {
                setSize(e.target.value);
                setSizeError(false);
              }}
              error={sizeError}
              helperText={sizeError ? "Size is required" : ""}
              required
            />
            <TextField
              fullWidth
              margin="normal"
              label="Quantity"
              type="number"
              value={quantity}
              onChange={handleQuantityChange}
              error={quantityError}
              helperText={quantityError ? "Please enter a valid quantity" : ""}
              required
            />
            <TextField
              fullWidth
              margin="normal"
              label="Comment"
              multiline
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </Box>
          <Box sx={modalActionsStyle}>
            <Button onClick={closeModal}>Close</Button>
            <Button onClick={handleSubmit} variant="contained" color="primary">
              Submit
            </Button>
          </Box>
        </Box>
      </Modal>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
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
  width: 400,
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

export default ButtonsRivetsModal;