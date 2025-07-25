import React, { useState, useEffect } from "react";
import SampleRequestModal from "../../../../../TechPack/Modals/WorkOrder/SampleRequest/SampleRequestModal";
import "./SampleRequest.css";
import { useParams } from "react-router-dom";
import { Button, Snackbar, Alert, Box, Modal, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import api from "../../../../../../ApiServices/api";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DesignCommentLogsModal from "./DesignCommentLogsModal";

const SampleRequestList = ({ techPackId }) => {
  const [sampleRequests, setSampleRequests] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("info");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState(null);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [selectedStyleNumber, setSelectedStyleNumber] = useState(null);
  const [styleName, setstyleName] = useState(null);

  const handleViewLogs = (styleNumber, name) => {
    setSelectedStyleNumber(styleNumber);
    setstyleName(name);
    setShowLogsModal(true);
  };
  const workOrder_Id = techPackId;

  const fetchSampleRequests = async () => {
    try {
      const response = await api.post(
        `/api/work-orders/sample-requests-by-work-orders`,
        { id: workOrder_Id }
      );
      setSampleRequests(response.data.data);
    } catch (error) {
      // console.error("Error fetching sample requests", error);
      // showSnackbar("Error fetching sample requests", "error");
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

  const handleDeleteClick = (id) => {
    const request = sampleRequests.find((req) => req._id === id);
    setRequestToDelete(request);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirmation = async () => {
    try {
      await api.delete(`/api/sample-requests/${requestToDelete._id}`);
      fetchSampleRequests();
      showSnackbar("Sample request deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting sample request", error);
      showSnackbar("Error deleting sample request", "error");
    } finally {
      setShowDeleteModal(false);
      setRequestToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setRequestToDelete(null);
    showSnackbar("Delete action was canceled", "info");
  };

  const handleFormSubmit = async (data) => {
    try {
      if (currentRequest) {
        await api.put(
          `/api/work-orders/create-sample-request/${currentRequest._id}`,
          data
        );
        showSnackbar("Sample request updated successfully", "success");
      } else {
        await api.post("/api/work-orders/create-sample-request", data);
        showSnackbar("Sample request added successfully", "success");
      }
      fetchSampleRequests();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error submitting form data", error);
      showSnackbar("Error submitting form data", "error");
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  useEffect(() => {
    if (workOrder_Id) {
      fetchSampleRequests();
    }
  }, [workOrder_Id]);

  const userRole = localStorage.getItem("role");

  return (
    <div className="sample-request-container">
      <div className="sample-request-header">
        <h5>Sample Request</h5>
        {(userRole === "admin" || userRole === "general") && (
          <Button
            variant="contained"
            className="add-sample-request-button"
            onClick={handleAddClick}
          >
            + Add Sample Request
          </Button>
        )}
      </div>
      
      <div className="table-responsive-wrapper">
        <table className="sample-request-table">
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
            {sampleRequests?.length > 0 ? (
              sampleRequests?.map((request) => (
                <tr key={request?._id}>
                  <td data-label="Style #">{request?.styleNumber}</td>
                  <td data-label="Size">{request?.size}</td>
                  <td data-label="Quantity">{request?.quantity}</td>
                  <td data-label="Sample Type">{request?.sampleType}</td>
                  <td data-label="Due Date">
                    {new Date(request?.dueDate)?.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </td>
                  <td data-label="Comments">{request?.comments}</td>
                  <td data-label="Status">{request?.status}</td>
                  <td data-label="Action">
                    {(userRole === "admin" || userRole === "general") && (
                      <div className="action-buttons">
                        <button
                          className="edit-button"
                          onClick={() => handleEditClick(request)}
                          aria-label="Edit"
                        >
                          <EditIcon />
                          <span className="tooltip-text">Edit</span>
                        </button>
                        <button
                          className="delete-button"
                          onClick={() => handleDeleteClick(request._id)}
                          aria-label="Delete"
                        >
                          <DeleteIcon />
                          <span className="tooltip-text">Delete</span>
                        </button>
                        <button
                          className="view-button"
                          onClick={() =>
                            handleViewLogs(request.styleId, request.styleNumber)
                          }
                          aria-label="View Logs"
                        >
                          <VisibilityIcon />
                          <span className="tooltip-text">View Logs</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="8"
                  className="no-data-message"
                >
                  No data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <SampleRequestModal
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleFormSubmit}
          request={currentRequest}
          workOrderId={workOrder_Id}
        />
      )}

      <Modal
        open={showDeleteModal}
        onClose={cancelDelete}
        aria-labelledby="delete-confirmation-modal"
        aria-describedby="delete-confirmation-modal-description"
      >
        <Box className="delete-confirmation-modal">
          <Typography variant="h6" id="delete-confirmation-modal" gutterBottom>
            Are you sure you want to delete this sample request?
          </Typography>
          <Box className="delete-confirmation-buttons">
            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteConfirmation}
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
        </Box>
      </Modal>

      <Snackbar
        open={snackbarOpen}
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

      <DesignCommentLogsModal
        open={showLogsModal}
        handleClose={() => setShowLogsModal(false)}
        styleNumber={selectedStyleNumber}
        name={styleName}
      />
    </div>
  );
};

export default SampleRequestList;