import React, { useState, useEffect } from "react";
import "./PointofMeasure.css";
import Navbar from "../../../Navbar/Navbar";
import { 
  Button, 
  Snackbar, 
  Alert, 
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField
} from "@mui/material";
import api from "../../../ApiServices/api";
import { useNavigate } from "react-router-dom";

const PointOfMeasure = () => {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    tolerance: "",
  });
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Snackbar states
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const apiBaseURL = "/api/point-of-measure";
  const navigate = useNavigate();
  
  // Fetch data with pagination and search
  const fetchData = async (page = 1, searchQuery = "") => {
    setIsLoading(true);
    try {
      const response = await api.get(`${apiBaseURL}/paginated/list`, {
        params: {
          page,
          limit: itemsPerPage,
          search: searchQuery
        }
      });
      
      setData(response.data.data);
      setTotalItems(response.data.pagination.totalItems);
      setTotalPages(response.data.pagination.totalPages);
      setCurrentPage(response.data.pagination.currentPage);
    } catch (error) {
      console.error("Error fetching data:", error);
      setSnackbarMessage("Error fetching data!");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      if (error?.message && error?.message?.includes("Unauthorized")) {
        navigate("/login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      if (editId) {
        await api.put(`${apiBaseURL}/${editId}`, formData);
        setSnackbarMessage("Record updated successfully!");
      } else {
        await api.post(apiBaseURL, formData);
        setSnackbarMessage("Record added successfully!");
      }
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setShowModal(false);
      setFormData({ code: "", description: "", tolerance: "" });
      setEditId(null);
      fetchData(currentPage, search);
    } catch (error) {
      console.error("Error saving data:", error);
      setSnackbarMessage("Error saving data!");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  // Delete record
  const handleDelete = async () => {
    try {
      await api.delete(`${apiBaseURL}/${deleteId}`);
      setSnackbarMessage("Record deleted successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setShowDeleteModal(false);
      fetchData(currentPage, search);
    } catch (error) {
      console.error("Error deleting record:", error);
      setSnackbarMessage("Error deleting record!");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setDeleteId(null);
    }
  };

  // Open delete confirmation modal
  const confirmDelete = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  // Edit record
  const handleEdit = (record) => {
    setFormData(record);
    setEditId(record._id);
    setShowModal(true);
  };

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData(1, search);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [search]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      fetchData(page, search);
    }
  };

  // Handle Snackbar close
  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  return (
    <>
      <Navbar />
      <div className="button_pom_top">
        <Button
          variant="contained"
          color="primary"
          onClick={() => setShowModal(true)}
          disabled={isLoading}
        >
          Add Point of measure
        </Button>
      </div>
      <div className="table-container_pom">
        <h4 className="btn_pom_css">Points of Measure</h4>

        <div className="search_input_main">
          <span className="search_label_pom">Search:</span>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search code, description or tolerance..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={isLoading}
            sx={{ width: 300 }}
          />
        </div>
        
        {isLoading ? (
          <div className="loading-indicator">Loading...</div>
        ) : (
          <>
            <table className="custom-table_pom">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Description</th>
                  <th>Tolerance</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.length > 0 ? (
                  data.map((row, index) => (
                    <tr key={index}>
                      <td>{row?.code}</td>
                      <td>{row?.description}</td>
                      <td>{row?.tolerance}</td>
                      <td>
                        <Button
                          onClick={() => handleEdit(row)}
                          variant="outlined"
                          color="primary"
                          size="small"
                          disabled={isLoading}
                          sx={{ mr: 1 }}
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => confirmDelete(row?._id)}
                          variant="outlined"
                          color="error"
                          size="small"
                          disabled={isLoading}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="no-data">
                      No records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            
            <div className="pagination_all_pom">
              <p className="pagination">
                Page {currentPage} of {totalPages} (Total: {totalItems})
              </p>
              <div className="pagination">
                <Button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1 || isLoading}
                  variant="outlined"
                  size="small"
                >
                  First
                </Button>
                <Button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || isLoading}
                  variant="outlined"
                  size="small"
                  sx={{ mx: 1 }}
                >
                  Previous
                </Button>
                <Button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || isLoading}
                  variant="outlined"
                  size="small"
                  sx={{ mr: 1 }}
                >
                  Next
                </Button>
                <Button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages || isLoading}
                  variant="outlined"
                  size="small"
                >
                  Last
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Add/Edit Modal */}
      <Dialog
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setFormData({ code: "", description: "", tolerance: "" });
          setEditId(null);
        }}
      >
        <DialogTitle>
          {editId ? "Edit Point of Measure" : "Add Point of Measure"}
        </DialogTitle>
        <DialogContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <TextField
              margin="normal"
              fullWidth
              label="Code"
              value={formData?.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value })
              }
              required
              disabled={isLoading}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Description"
              value={formData?.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              required
              disabled={isLoading}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Tolerance"
              value={formData?.tolerance}
              onChange={(e) =>
                setFormData({ ...formData, tolerance: e.target.value })
              }
              required
              disabled={isLoading}
            />
            <DialogActions>
              <Button
                onClick={() => {
                  setShowModal(false);
                  setFormData({ code: "", description: "", tolerance: "" });
                  setEditId(null);
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isLoading}
              >
                {editId ? "Update" : "Save"}
              </Button>
            </DialogActions>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Modal */}
      <Dialog
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this record? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowDeleteModal(false)}
            color="primary"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            autoFocus
            disabled={isLoading}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default PointOfMeasure;