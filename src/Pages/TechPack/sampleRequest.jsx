import React, { useState, useEffect } from "react";
import axios from "axios";
import "./sampleRequest.css";
import SampleRequestModal from "./SampleRequestModal";
import Button from "@mui/material/Button";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import api from "../../ApiServices/api";

const SampleRequestList = ({ techPackId }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toISOString().split("T")[0];
  };

  const [sampleRequests, setSampleRequests] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [requestToDelete, setRequestToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const techpackId = techPackId;

  const fetchSampleRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post(
        `/api/work-orders/sample-requests-by-work-orders`,
        { id: techpackId }
      );
      setSampleRequests(response?.data?.data || []);
    } catch (error) {
      // console.error("Error fetching sample requests", error);
      // setError("No Data Found");
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setCurrentRequest(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (request) => {
    setCurrentRequest(request);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (request) => {
    setRequestToDelete(request);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(
        `/api/work-orders/create-sample-request/${requestToDelete._id}`
      );
      await fetchSampleRequests();
      showSnackbar("Sample request deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting sample request", error);
      showSnackbar("Failed to delete sample request", "error");
    } finally {
      setIsDeleteModalOpen(false);
      setRequestToDelete(null);
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setRequestToDelete(null);
  };

  const handleFormSubmit = async (data) => {
    try {
      const submissionData = {
        ...data,
        techpack_Id: techpackId,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
      };

      if (currentRequest) {
        await api.put(
          `/api/work-orders/create-sample-request/${currentRequest._id}`,
          submissionData
        );
        showSnackbar("Sample request updated successfully", "success");
      } else {
        await api.post(
          "/api/work-orders/create-sample-request",
          submissionData
        );
        showSnackbar("Sample request created successfully", "success");
      }
      await fetchSampleRequests();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error submitting form data", error);
      showSnackbar("Failed to submit form data", "error");
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  useEffect(() => {
    fetchSampleRequests();
  }, [techpackId]);


  const userRole = localStorage.getItem("role");
  return (
    <div className="container">
      <div className="table-container_sample">
        <div className="table-header_sample">
          <h5>Sample Request</h5>
           {(userRole === 'admin' || userRole === 'general') && (
            <Button
            variant="contained"
            onClick={handleAddClick}
            startIcon={<AddIcon />}
            sx={{
              backgroundColor: "#1976d2",
              color: "white",
              "&:hover": {
                backgroundColor: "#1565c0",
              },
              textTransform: "none",
              borderRadius: "4px",
              padding: "8px 16px",
            }}
          >
            Add
          </Button>
)}
         
        </div>

        {loading ? (
          <div className="status-message">Loading...</div>
        ) : error ? (
          <div className="status-message error-message">{error}</div>
        ) : sampleRequests.length === 0 ? (
          <div className="status-message no-data-message">No data found</div>
        ) : (
          <table className="custom-table_sample">
            <thead>
              <tr>
                <th>Style #</th>
                <th>Size</th>
                <th>Quantity</th>
                <th>Sample Type</th>
                <th>Due Date</th>
                <th>Comments</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sampleRequests.map((request) => (
                <tr key={request._id}>
                  <td>{request.styleNumber}</td>
                  <td>{request.size}</td>
                  <td>{request.quantity}</td>
                  <td>{request.sampleType}</td>
                  <td>{formatDate(request.dueDate)}</td>
                  <td>{request.comments}</td>
                  <td>{request.status}</td>
                  <td>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => handleEditClick(request)}
                      sx={{ mr: 1 }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDeleteClick(request)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <SampleRequestModal
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleFormSubmit}
          request={currentRequest}
        />
      )}

      {isDeleteModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>Are you sure you want to delete this sample request?</h2>
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              sx={{ mt: 2 }}
            >
              <Button
                variant="contained"
                color="error"
                sx={{ mr: 2 }}
                onClick={confirmDelete}
              >
                Yes, Delete
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={cancelDelete}
              >
                No, Cancel
              </Button>
            </Box>
          </div>
        </div>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default SampleRequestList;