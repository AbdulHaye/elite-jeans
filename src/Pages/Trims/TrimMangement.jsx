import React, { useState, useEffect } from "react";
import axios from "axios";
import "./TrimMangement.css";
import Navbar from "../../Navbar/Navbar";
import { Alert, Box, Button, Snackbar, TextField } from "@mui/material";
import { Search } from "@mui/icons-material";
import api from "../../ApiServices/api";
import { useNavigate } from "react-router-dom";

const TrimManagement = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);
  const [trims, setTrims] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    previewImage: null,
  });
  const [editTrimId, setEditTrimId] = useState(null);

  const apiEndpoint = "/api/trim";

  // Snackbar state
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertSeverity, setAlertSeverity] = useState("success");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [trimToDelete, setTrimToDelete] = useState(null);

  useEffect(() => {
    fetchTrims();
  }, [searchQuery]);

  const fetchTrims = async () => {
    try {
      const response = await api.get(
        searchQuery ? `${apiEndpoint}/search?query=${searchQuery}` : apiEndpoint
      );
      console.log(response, "trim data");
      setTrims(response.data);
    } catch (error) {
      console.error("Error fetching trims:", error);
      setAlertMessage("Error fetching trims");
      setAlertSeverity("error");
      setAlertOpen(true);

       if (error?.message && error?.message?.includes("Unauthorized")) {
        navigate("/login");
      }
    }
  };

  const handleAddOrEdit = async (e) => {
    e.preventDefault();
    const method = editTrimId ? "PUT" : "POST";
    const url = editTrimId ? `${apiEndpoint}/${editTrimId}` : apiEndpoint;

    const trimFormData = new FormData();
    trimFormData.append("name", formData.name);
    trimFormData.append("description", formData.description);
    if (formData.previewImage) {
      trimFormData.append("previewImage", formData.previewImage);
    }

    try {
      const response = await api({
        method,
        url,
        data: trimFormData,
      });

      if (response.status === 200 || response.status === 201) {
        setAlertMessage(
          editTrimId ? "Trim updated successfully!" : "Trim added successfully!"
        );
        setAlertSeverity("success");
        setAlertOpen(true);
        setShowModal(false);
        setFormData({ name: "", description: "", previewImage: null });
        setEditTrimId(null);
        fetchTrims();
      } else {
        setAlertMessage("Failed to save trim.");
        setAlertSeverity("error");
        setAlertOpen(true);
      }
    } catch (error) {
      console.error("Error saving trim:", error);
      setAlertMessage("An error occurred while saving the trim.");
      setAlertSeverity("error");
      setAlertOpen(true);
    }
  };

  const handleDelete = (id) => {
    setTrimToDelete(id);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (trimToDelete) {
      try {
        const response = await api.delete(`${apiEndpoint}/${trimToDelete}`);
        if (response.status === 200) {
          setAlertMessage("Trim deleted successfully!");
          setAlertSeverity("success");
          fetchTrims();
        } else {
          setAlertMessage("Failed to delete trim.");
          setAlertSeverity("error");
        }
      } catch (error) {
        console.error("Error deleting trim:", error);
        setAlertMessage("An error occurred while deleting the trim.");
        setAlertSeverity("error");
      } finally {
        setAlertOpen(true);
        setIsModalOpen(false);
      }
    }
  };

  const cancelDelete = () => {
    setTrimToDelete(null);
    setIsModalOpen(false);
  };

  const handleDownload = (url) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = "previewImage.png"; // Default filename
    link.click();
  };

  const openModalForEdit = (trim) => {
    setEditTrimId(trim._id);
    setFormData({
      name: trim.name,
      description: trim.description,
      previewImage: null,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ name: "", description: "", previewImage: null });
    setEditTrimId(null);
  };
  const userRole = localStorage.getItem("role");
  return (
    <>
      <Snackbar
        open={alertOpen}
        autoHideDuration={3000}
        onClose={() => setAlertOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setAlertOpen(false)}
          severity={alertSeverity}
          sx={{ width: "100%" }}
        >
          {alertMessage}
        </Alert>
      </Snackbar>

      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>Are you sure you want to delete this trim?</h2>
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

      <Navbar />
      <div className="trim-management">
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "20px",
            mb: 3,
            padding: "0 16px",
          }}
        >
          {(userRole === 'admin' || userRole === 'general') && (
            <Button
              variant="contained"
              className="add-button"
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              sx={{
                flexShrink: 0,
                width: "auto",
                minWidth: "120px",
              }}
            >
              Add Trim
            </Button>
          )}

          <TextField
            variant="outlined"
            placeholder="Search..."
            fullWidth
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              flexGrow: 1,
              maxWidth: "600px",
              "& .MuiOutlinedInput-root": {
                height: "40px",
              },
            }}
            InputProps={{
              startAdornment: <Search sx={{ color: "action.active", mr: 1 }} />,
            }}
          />
        </Box>

        <div className="trim-container">
          {trims.length > 0 ? (
            <div className="trim-grid">
              {trims?.map((trim) => (
                <div className="trim-card" key={trim?._id}>
                  <div className="card-header">
                    <h3 className="trim-title">{trim?.name || "N/A"}</h3>
                  </div>

                  <div className="card-body">
                    <div className="info-row">
                      <label className="info-label">Description</label>
                      <p className="info-value">{trim?.description || "N/A"}</p>
                    </div>

                    <div className="info-row image-row">
                      <label className="info-label">Preview Image</label>
                      <div className="image-container">
                        <img
                          src={trim?.previewImage}
                          alt="Preview"
                          className="preview-image"
                          onClick={() => handleDownload(trim?.previewImage)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="card-actions">
                    {(userRole === 'admin' || userRole === 'general') && (
                      <>
                        {" "}
                        <button
                          className="btn btn-edit"
                          onClick={() => openModalForEdit(trim)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-delete"
                          onClick={() => handleDelete(trim?._id)}
                        >
                          Delete
                        </button>
                      </>
                    )}

                    <button
                      className="btn btn-download"
                      onClick={() => handleDownload(trim?.previewImage)}
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No trims available</p>
            </div>
          )}
        </div>

        {showModal && (
          <div className="modal">
            <div className="modal-content">
              <h3>{editTrimId ? "Edit Trim" : "Add Trim"}</h3>
              <form onSubmit={handleAddOrEdit}>
                <label>
                  Name:
                  <input
                    type="text"
                    value={formData?.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </label>
                <label>
                  Description:
                  <textarea
                    value={formData?.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    required
                  ></textarea>
                </label>
                <label>
                  Preview Image:
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        previewImage: e.target.files[0],
                      })
                    }
                  />
                </label>
                <div className="modal-actions">
                  <button type="submit" className="modal-button">
                    Save
                  </button>
                  <button
                    type="button"
                    className="modal-button cancel"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default TrimManagement;

{
  /* <div className="trim-list">
          {trims.length > 0 ? (
            <table className="trim-table">
              {trims?.map((trim) => (
                <tbody key={trim?._id}>
                  <tr
                    style={{
                      backgroundColor: "#F3F4F8",
                    }}
                  >
                    <td
                      className="value_style value_style_tile_trim"
                      colSpan="3"
                    >
                      {" "}
                      {trim?.name || "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td className="label_style label_style_trim">
                      Description
                    </td>
                    <td className="value_style" colSpan="3">
                      {" "}
                      {trim?.description || "N/A"}
                    </td>
                  </tr>
                  <tr
                    style={{
                      backgroundColor: "#F3F4F8",
                    }}
                  >
                    <td className="label_style label_style_trim">
                      Preview Image
                    </td>
                    <td className="value_style" colSpan="3">
                      <img
                        src={trim?.previewImage}
                        alt="Preview"
                        className="preview-image trim_table_img"
                        onClick={() => handleDownload(trim?.previewImage)}
                        style={{ cursor: "pointer" }}
                      />
                    </td>
                  </tr>

                  <tr>
                    <td className="value_style" colSpan="3">
                      <button
                        className="action-button edit"
                        onClick={() => openModalForEdit(trim)}
                      >
                        Edit
                      </button>
                      <button
                        className="action-button delete"
                        onClick={() => handleDelete(trim?._id)}
                      >
                        Delete
                      </button>
                      <button
                        className="action-button download"
                        onClick={() => handleDownload(trim?.previewImage)}
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                </tbody>
              ))}
            </table>
          ) : (
            <p>No trims available.</p>
          )}
        </div>  */
}
