import React, { useState, useEffect } from "react";

import Navbar from "../../Navbar/Navbar";
import {
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import { Add, Search, Close, Delete } from "@mui/icons-material";
import api from "../../ApiServices/api";
import { useNavigate } from "react-router-dom";

const PictureManager = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);
  const [pictures, setPictures] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [newPicture, setNewPicture] = useState({
    imageName: "",
    imageTitle: "",
    category: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [pictureToDelete, setPictureToDelete] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [picturesRes, categoriesRes] = await Promise.all([
          api.get("/api/picture"),
          api.get("/api/picture/cat_name"),
        ]);
        setPictures(picturesRes.data);
        setCategories(categoriesRes.data.categories || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        if (error?.message && error?.message?.includes("Unauthorized")) {
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
 const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  const addPicture = async () => {
    try {
      if (!imageFile) {
        setSnackbar({
          open: true,
          message: "Please select an image file.",
          severity: 'error',
        });
        return;
      }
      const formData = new FormData();
      formData.append("imageUrl", imageFile);
      Object.entries(newPicture).forEach(([key, value]) =>
        formData.append(key, value)
      );

      await api.post("/api/picture", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const updatedPictures = await api.get("/api/picture");
      setPictures(updatedPictures.data);
      handleCloseModal();
    } catch (error) {
      console.error("Error adding picture:", error);
    }
  };

  const deletePicture = async (id) => {
    try {
      await api.delete(`/api/picture/${id}`);
      setPictures(pictures.filter((picture) => picture._id !== id));
      handleCloseModal();
    } catch (error) {
      console.error("Error deleting picture:", error);
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setShowDeleteModal(false);
    setPictureToDelete(null);
    setNewPicture({ imageName: "", imageTitle: "", category: "" });
    setImageFile(null);
  };

  const filteredPictures = pictures.filter(
    (picture) =>
      (selectedCategory === "All Categories" ||
        picture.category === selectedCategory) &&
      picture.imageTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const userRole = localStorage.getItem("role");
  return (
    <>
      <Navbar />
      <Box sx={{ p: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          {(userRole === "admin" || userRole === "general") && (
            <Button
              variant="contained"
              size="small"
              startIcon={<Add />}
              onClick={() => setShowAddModal(true)}
              sx={{
                px: 2,
                py: 1,
                fontSize: "0.875rem",
              }}
            >
              Add New Picture
            </Button>
          )}

          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Category</InputLabel>
              <Select
                size="small"
                value={selectedCategory}
                label="Category"
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <MenuItem value="All Categories">All Categories</MenuItem>
                {categories.map((category, index) => (
                  <MenuItem key={index} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              size="small"
              variant="outlined"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ width: 220 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredPictures.map((picture) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={picture._id}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <CardMedia
                    component="img"
                    height="160"
                    image={picture.imageUrl}
                    alt={picture.imageTitle}
                    sx={{ objectFit: "cover" }}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography
                      gutterBottom
                      variant="subtitle1"
                      component="div"
                    >
                      {picture.imageTitle || "Untitled"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {picture.category || "No category"}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: "flex-end" }}>
                    {(userRole === "admin" || userRole === "general") && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          setPictureToDelete(picture);
                          setShowDeleteModal(true);
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {!loading && filteredPictures.length === 0 && (
          <Box sx={{ textAlign: "center", p: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No images found
            </Typography>
          </Box>
        )}

        <Dialog
          open={showAddModal}
          onClose={handleCloseModal}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle sx={{ py: 2 }}>Add New Picture</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              margin="dense"
              size="small"
              label="Image Name"
              value={newPicture.imageName}
              onChange={(e) =>
                setNewPicture({ ...newPicture, imageName: e.target.value })
              }
            />
            <TextField
              fullWidth
              margin="dense"
              size="small"
              label="Image Title"
              value={newPicture.imageTitle}
              onChange={(e) =>
                setNewPicture({ ...newPicture, imageTitle: e.target.value })
              }
            />
            <TextField
              fullWidth
              margin="dense"
              size="small"
              label="Category"
              value={newPicture.category}
              onChange={(e) =>
                setNewPicture({ ...newPicture, category: e.target.value })
              }
            />

            <Button
              variant="outlined"
              component="label"
              fullWidth
              size="small"
              sx={{ mt: 1.5 }}
            >
              Upload Image
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])}
              />
            </Button>
            {imageFile && (
              <Typography variant="caption" sx={{ mt: 1, display: "block" }}>
                Selected file: {imageFile.name}
              </Typography>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button size="small" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="contained" size="small" onClick={addPicture}>
              Add Picture
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={showDeleteModal} onClose={handleCloseModal}>
          <DialogTitle sx={{ py: 2, fontSize: "1rem" }}>
            Confirm Delete
          </DialogTitle>
          <DialogContent>
            <DialogContentText variant="body2">
              Are you sure you want to delete "{pictureToDelete?.imageTitle}"?
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button size="small" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              size="small"
              onClick={() => deletePicture(pictureToDelete?._id)}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>

        <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default PictureManager;
