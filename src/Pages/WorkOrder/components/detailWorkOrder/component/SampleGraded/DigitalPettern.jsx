import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Snackbar,
  Alert,
} from "@mui/material";
import { Edit, Delete, CloudUpload } from "@mui/icons-material";
import axios from "axios";
import api from "../../../../../../ApiServices/api";

const DigitalPattern = () => {
  const { id } = useParams();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    styleNumber: "",
    file: null,
    user: "",
    description: "",
    date: "",
  });
  const [data, setData] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = () => {
    api
      .get(`/api/digital-patterns/by-workorder/${id}`)
      .then((response) => {
        if (Array.isArray(response?.data?.data)) {
          setData(response.data.data);
        } else {
          console.error("Expected an array but got", response.data);
        }
      })
      .catch((error) => console.error("Error fetching data:", error));
  };

  const handleOpen = () => {
    setFormData({
      styleNumber: "",
      file: null,
      user: "",
      description: "",
      date: "",
    });
    setEditIndex(null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, file: e.target.files[0] });
  };

  const handleSubmit = () => {
    const form = new FormData();
    form.append("workOrder_Id", id);
    form.append("styleNumber", formData.styleNumber);
    form.append("user", formData.user);
    form.append("description", formData.description);
    form.append("uploadDate", formData.uploadDate);
    if (formData.file) {
      form.append("file", formData.file);
    }

    const apiCall =
      editIndex !== null
        ? api.put(`/api/digital-patterns/update/${data[editIndex]._id}`, form)
        : api.post("/api/digital-patterns/upload", form);

    apiCall
      .then(() => {
        fetchData();
        setSnackbar({
          open: true,
          message:
            editIndex !== null
              ? "Pattern updated successfully!"
              : "Pattern added successfully!",
          severity: "success",
        });
        handleClose();
      })
      .catch((error) => {
        setSnackbar({
          open: true,
          message: "Error submitting data!",
          severity: "error",
        });
        console.error("Error submitting data:", error);
      });
  };

  const handleEdit = (index) => {
    setFormData({
      styleNumber: data[index].styleNumber,
      file: null,
      user: data[index].user,
      description: data[index].description,
      uploadDate: data[index].uploadDate,
    });
    setEditIndex(index);
    setOpen(true);
  };

  const handleDelete = (index) => {
    setDeleteIndex(index);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    const patternId = data[deleteIndex]._id;
    api
      .delete(`/api/digital-patterns/${patternId}`)
      .then(() => {
        fetchData();
        setSnackbar({
          open: true,
          message: "Pattern deleted successfully!",
          severity: "success",
        });
        setShowDeleteModal(false);
      })
      .catch((error) => {
        setSnackbar({
          open: true,
          message: "Error deleting pattern!",
          severity: "error",
        });
        console.error("Error deleting pattern:", error);
      });
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  const userRole = localStorage.getItem('role');
  return (
    <div>

{(userRole === 'admin' || userRole === 'general') && (
      <Button variant="contained" color="primary" onClick={handleOpen}>
        Add Pattern File
      </Button>
    )}
      <TableContainer component={Paper} sx={{ marginTop: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Style #</TableCell>
              <TableCell>File</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length > 0 ? (
              data.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{row?.styleNumber}</TableCell>
                  <TableCell>
                    {row.file ? (
                      <a
                        href={`${row?.file}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View File
                      </a>
                    ) : (
                      "No file uploaded"
                    )}
                  </TableCell>
                  <TableCell>{row?.user}</TableCell>
                  <TableCell>{row?.description}</TableCell>
                  <TableCell>
                    {new Date(row?.uploadDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                  {(userRole === 'admin' || userRole === 'general') && (
                    <>
                    <IconButton
                      color="primary"
                      onClick={() => handleEdit(index)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      color="secondary"
                      onClick={() => handleDelete(index)}
                    >
                      <Delete />
                    </IconButton>
                    </>
                  )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No data found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: "center", fontWeight: "bold" }}>
          {editIndex !== null ? "Edit" : "Add"} Pattern File
        </DialogTitle>
        <DialogContent sx={{ padding: "20px" }}>
          <TextField
            label="Style #"
            name="styleNumber"
            fullWidth
            margin="dense"
            value={formData?.styleNumber}
            onChange={handleChange}
          />
          <TextField
            label="Upload File"
            type="file"
            fullWidth
            margin="dense"
            InputLabelProps={{ shrink: true }}
            InputProps={{ startAdornment: <CloudUpload color="primary" /> }}
            onChange={handleFileChange}
          />
          {editIndex !== null &&
            formData.file === null &&
            data[editIndex].file && (
              <p>
                Current file:{" "}
                <a
                  href={data[editIndex].file}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View File
                </a>
              </p>
            )}
          <TextField
            label="User"
            name="user"
            fullWidth
            margin="dense"
            value={formData?.user}
            onChange={handleChange}
          />
          <TextField
            label="Description"
            name="description"
            fullWidth
            margin="dense"
            value={formData?.description}
            onChange={handleChange}
          />
        </DialogContent>
        <DialogActions sx={{ padding: "0 24px 20px" }}>
          <Button onClick={handleClose} color="secondary" variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            {editIndex !== null ? "Update" : "Submit"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteModal}
        onClose={cancelDelete}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: "center", fontWeight: "bold" }}>
          Are you sure you want to delete this pattern file?
        </DialogTitle>
        <DialogActions sx={{ padding: "0 24px 20px" }}>
          <Button onClick={cancelDelete} color="secondary" variant="outlined">
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="primary" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default DigitalPattern;