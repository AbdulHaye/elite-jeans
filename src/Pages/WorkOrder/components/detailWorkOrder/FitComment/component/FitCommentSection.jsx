import React, { useEffect, useState } from "react";
import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Tabs,
  Tab,
  TextField,
  Box,
  Modal,
  Typography,
  Paper,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  CircularProgress,
  DialogActions,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import api from "../../../../../../ApiServices/api";

function FitCommentSection({ workOrderId }) {
  const [selectedTab, setSelectedTab] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [comment, setComment] = useState("");
  const [completedBy, setCompletedBy] = useState("");
  const [approvalStatus, setApprovalStatus] = useState("");
  const [date, setDate] = useState("");
  const [images, setImages] = useState({
    front_view: [],
    back_view: [],
    side_view: [],
    additional_pictures: [],
  });
  const [sampleStatus, setSampleStatus] = useState([]);
  const [sampleRequestingStatus, setSampleRequestingStatus] = useState([]);
  const [fitComments, setFitComments] = useState(null);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [modalSampleStatus, setModalSampleStatus] = useState("");
  const [modalSampleRequestingStatus, setModalSampleRequestingStatus] =
    useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedRequestingStatus, setSelectedRequestingStatus] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [openImageModal, setOpenImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [styleNumbers, setStyleNumbers] = useState([]);
  const [selectedStyleNumber, setSelectedStyleNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState({
    front_view: [],
    back_view: [],
    side_view: [],
    additional_pictures: [],
  });
  const [apiError, setApiError] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [actionCallback, setActionCallback] = useState(null);

  const tabNames = ["PP1", "PP2", "PP3", "Shipping", "Other"];
  const tabLabels = ["1st PP", "2nd PP", "3rd PP", "Shipping", "Other"];

  useEffect(() => {
    fetchStyleNumbers();
    fetchSampleStatus();
    fetchSampleRequestingStatus();
  }, [workOrderId]);

  useEffect(() => {
    if (selectedStyleNumber) {
      fetchFitComments();
    } else {
      setFitComments(null);
      setApiError(false);
    }
  }, [selectedStyleNumber, workOrderId]);

  // Check for unsaved changes in the edit form
  useEffect(() => {
    if (isEditing) {
      const currentTabData = getCurrentTabData();
      const hasChanges =
        comment !== (currentTabData?.comments || "") ||
        completedBy !== (currentTabData?.comment_completed_by || "") ||
        approvalStatus !== (currentTabData?.approval_status || "") ||
        date !==
          (currentTabData?.date
            ? new Date(currentTabData.date).toISOString().split("T")[0]
            : "") ||
        JSON.stringify(images) !==
          JSON.stringify({
            front_view: currentTabData?.images?.front_view || [],
            back_view: currentTabData?.images?.back_view || [],
            side_view: currentTabData?.images?.side_view || [],
            additional_pictures:
              currentTabData?.images?.additional_pictures || [],
          }) ||
        Object.values(fileList).some((files) => files.length > 0);

      setUnsavedChanges(hasChanges);
    } else {
      setUnsavedChanges(false);
    }
  }, [comment, completedBy, approvalStatus, date, images, fileList, isEditing]);

  // Check for unsaved changes in create modal
  useEffect(() => {
    if (openCreateModal) {
      const hasChanges = modalSampleStatus !== "" || modalSampleRequestingStatus !== "";
      setUnsavedChanges(hasChanges);
    }
  }, [modalSampleStatus, modalSampleRequestingStatus, openCreateModal]);

  const fetchStyleNumbers = async () => {
    try {
      const response = await api.get(
        `/api/work-orders/item-detail/workorders/${workOrderId}/style-numbers`
      );
      setStyleNumbers(response.data.data || []);
      if (response.data.data && response.data.data.length > 0) {
        setSelectedStyleNumber(response?.data?.data[0]?.id);
      }
    } catch (err) {
      console.error("Error fetching style numbers:", err);
      setStyleNumbers([]);
      setSnackbar({
        open: true,
        message: "Failed to fetch style numbers",
        severity: "error",
      });
    }
  };

  const fetchSampleStatus = async () => {
    try {
      const response = await api.get("/api/sampleStatus");
      setSampleStatus(response?.data || []);
    } catch (err) {
      console.error("Error fetching sample status:", err);
      setSampleStatus([]);
    }
  };

  const fetchSampleRequestingStatus = async () => {
    try {
      const response = await api.get("/api/sampleRequestingStatus");
      setSampleRequestingStatus(response?.data || []);
    } catch (error) {
      console.error("Error fetching sample requesting status:", error);
      setSampleRequestingStatus([]);
    }
  };

  const fetchFitComments = async () => {
    if (!selectedStyleNumber) return;

    setLoading(true);
    setApiError(false);
    try {
      const response = await api.get(
        `/api/fitComments/${workOrderId}/${selectedStyleNumber}`
      );

      if (response.data && response.data._id) {
        setFitComments(response.data);
        setSelectedStatus(
          response.data.sampleStatus_id?.sampleStatus?.name || "N/A"
        );
        setSelectedRequestingStatus(
          response.data.sampleRequestingStatus_id?.sampleRequestingStatus
            ?.name || "N/A"
        );
      } else {
        setFitComments(null);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setFitComments(null);
        setApiError(true);
      } else {
        console.error("Error fetching fit comments:", err);
        setFitComments(null);
        setApiError(true);
        setSnackbar({
          open: true,
          message: "Fit comments data not found",
          severity: "error",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFitComment = async () => {
    try {
      const payload = {
        workOrder_Id: workOrderId,
        styleNumber: selectedStyleNumber,
        sampleStatus_id: sampleStatus.find(
          (status) => status?.sampleStatus?.name === modalSampleStatus
        )?._id,
        sampleRequestingStatus_id: sampleRequestingStatus.find(
          (status) =>
            status.sampleRequestingStatus?.name === modalSampleRequestingStatus
        )?._id,
      };

      await api.post("/api/fitComments", payload);

      setOpenCreateModal(false);
      setSnackbar({
        open: true,
        message: "Fit comment created successfully",
        severity: "success",
      });

      await fetchFitComments();
    } catch (error) {
      console.error("Error creating fit comment:", error);
      setSnackbar({
        open: true,
        message:
          error.response?.data?.message || "Failed to create fit comment",
        severity: "error",
      });
    }
  };

  const handleTabChange = (event, newValue) => {
    if (unsavedChanges) {
      setActionCallback(() => () => {
        setSelectedTab(newValue);
        setIsEditing(false);
        resetForm();
        setUnsavedChanges(false);
      });
      setShowConfirmation(true);
    } else {
      setSelectedTab(newValue);
      setIsEditing(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setComment("");
    setCompletedBy("");
    setApprovalStatus("");
    setDate("");
    setImages({
      front_view: [],
      back_view: [],
      side_view: [],
      additional_pictures: [],
    });
    setFileList({
      front_view: [],
      back_view: [],
      side_view: [],
      additional_pictures: [],
    });
  };

  const getCurrentTabData = () => {
    if (!fitComments) return null;
    const currentTabName = tabNames[selectedTab];
    return fitComments[currentTabName] || null;
  };

  const handleAddClick = () => {
    setIsEditing(true);
    resetForm();
  };

  const handleEditClick = () => {
    const currentTabData = getCurrentTabData();
    if (currentTabData) {
      setIsEditing(true);
      setComment(currentTabData?.comments || "");
      setCompletedBy(currentTabData?.comment_completed_by || "");
      setApprovalStatus(currentTabData?.approval_status || "");

      const dateFromApi = currentTabData?.date
        ? new Date(currentTabData?.date)
        : null;
      const formattedDate = dateFromApi
        ? dateFromApi?.toISOString().split("T")[0]
        : "";
      setDate(formattedDate);

      setImages({
        front_view: currentTabData?.images?.front_view || [],
        back_view: currentTabData?.images?.back_view || [],
        side_view: currentTabData?.images?.side_view || [],
        additional_pictures: currentTabData?.images?.additional_pictures || [],
      });
    }
  };

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setSelectedStatus(newStatus);
    try {
      const statusId = sampleStatus.find(
        (s) => s.sampleStatus?.name === newStatus
      )?._id;

      await api.put(`/api/fitComments/${workOrderId}/${selectedStyleNumber}`, {
        sampleStatus_id: statusId,
      });

      setSnackbar({
        open: true,
        message: "Sample status updated successfully",
        severity: "success",
      });
      fetchFitComments();
    } catch (error) {
      console.error("Error updating status:", error);
      setSnackbar({
        open: true,
        message: "Failed to update status",
        severity: "error",
      });
      // Revert the UI if API call fails
      setSelectedStatus(
        fitComments?.sampleStatus_id?.sampleStatus?.name || "N/A"
      );
    }
  };

  const handleRequestingStatusChange = async (e) => {
    const newStatus = e.target.value;
    setSelectedRequestingStatus(newStatus);
    try {
      const statusId = sampleRequestingStatus.find(
        (s) => s.sampleRequestingStatus?.name === newStatus
      )?._id;

      await api.put(`/api/fitComments/${workOrderId}/${selectedStyleNumber}`, {
        sampleRequestingStatus_id: statusId,
      });

      setSnackbar({
        open: true,
        message: "Sample requesting status updated successfully",
        severity: "success",
      });
      fetchFitComments();
    } catch (error) {
      console.error("Error updating requesting status:", error);
      setSnackbar({
        open: true,
        message: "Failed to update requesting status",
        severity: "error",
      });
      // Revert the UI if API call fails
      setSelectedRequestingStatus(
        fitComments?.sampleRequestingStatus_id?.sampleRequestingStatus?.name ||
          "N/A"
      );
    }
  };

  const updateFitComment = async (updateData) => {
    try {
      await api.put(`/api/fitComments/${workOrderId}/${selectedStyleNumber}`, {
        ...updateData,
      });
      fetchFitComments();
      setSnackbar({
        open: true,
        message: "Fit comment updated successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error updating fit comment:", error);
      setSnackbar({
        open: true,
        message: "Failed to update fit comment",
        severity: "error",
      });
    }
  };

  const handleImageUpload = (e, viewType) => {
    const files = Array.from(e.target.files);
    setFileList((prev) => ({
      ...prev,
      [viewType]: [...prev[viewType], ...files],
    }));

    const newImages = files.map((file) => URL.createObjectURL(file));
    setImages((prev) => ({
      ...prev,
      [viewType]: [...prev[viewType], ...newImages],
    }));
  };

  const handleImageClick = (img) => {
    setSelectedImage(img);
    setOpenImageModal(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleSaveClick = async () => {
    try {
      const currentTabName = tabNames[selectedTab];
      const formData = new FormData();

      formData.append("stage", currentTabName);
      formData.append("date", date);
      formData.append("comment_completed_by", completedBy);
      formData.append("approval_status", approvalStatus);
      formData.append("comments", comment);

      // Append all files for each view type
      Object.entries(fileList).forEach(([viewType, files]) => {
        files.forEach((file) => {
          formData.append(viewType, file);
        });
      });

      await api.put(
        `/api/fitComments/${workOrderId}/${selectedStyleNumber}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      fetchFitComments();
      setIsEditing(false);
      resetForm();
      setSnackbar({
        open: true,
        message: "Comment saved successfully",
        severity: "success",
      });
      return true; // Return true to indicate success
    } catch (error) {
      console.error("Error saving data:", error);
      setSnackbar({
        open: true,
        message: "Failed to save comment",
        severity: "error",
      });
      return false; // Return false to indicate failure
    }
  };

  const handleCloseCreateModal = () => {
    if (unsavedChanges) {
      setActionCallback(() => () => {
        setOpenCreateModal(false);
        setModalSampleStatus("");
        setModalSampleRequestingStatus("");
        setUnsavedChanges(false);
      });
      setShowConfirmation(true);
    } else {
      setOpenCreateModal(false);
      setModalSampleStatus("");
      setModalSampleRequestingStatus("");
    }
  };

  const handleCancelClick = () => {
    if (unsavedChanges) {
      setActionCallback(() => () => {
        setIsEditing(false);
        resetForm();
        setUnsavedChanges(false);
      });
      setShowConfirmation(true);
    } else {
      setIsEditing(false);
      resetForm();
    }
  };

  const handleConfirmAction = () => {
    if (actionCallback) {
      actionCallback();
    }
    setShowConfirmation(false);
    setActionCallback(null);
  };

  const handleCancelAction = () => {
    setShowConfirmation(false);
    setActionCallback(null);
  };

  const currentTabData = getCurrentTabData();

  const renderFieldWithFallback = (value) => {
    return value || "N/A";
  };

  const renderImageSection = (viewType, label) => (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        {label}:
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
        {images[viewType]?.map((img, index) => (
          <img
            key={index}
            src={img}
            alt={`${label} ${index}`}
            style={{
              width: 120,
              height: 120,
              objectFit: "cover",
              borderRadius: 1,
              cursor: "pointer",
            }}
            onClick={() => handleImageClick(img)}
          />
        ))}
      </Box>
      <Button variant="contained" component="label">
        Upload {label}
        <input
          type="file"
          hidden
          multiple
          onChange={(e) => handleImageUpload(e, viewType)}
        />
      </Button>
    </Box>
  );

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <div className="Heading_fit_comment" style={{ marginBottom: "35px" }}>
        <h2>Fit Comments</h2>
      </div>

      {/* Style Number Selector */}
      <Box sx={{ mb: 3 }}>
        <FormControl sx={{ width: "25%" }}>
          <InputLabel id="style-number-label">Style Number</InputLabel>
          <Select
            labelId="style-number-label"
            value={selectedStyleNumber}
            onChange={(e) => setSelectedStyleNumber(e.target.value)}
            label="Style Number"
            disabled={loading}
          >
            {styleNumbers?.map((style) => (
              <MenuItem key={style?.id} value={style?.id}>
                {style?.number}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && !selectedStyleNumber && styleNumbers.length > 0 && (
        <Typography variant="body1" sx={{ mb: 2 }}>
          Please select a style number to view or create fit comments.
        </Typography>
      )}

      {!loading && styleNumbers.length === 0 && (
        <Typography variant="body1" sx={{ mb: 2 }}>
          No style numbers available for this work order. Please create item detail First!
        </Typography>
      )}

      {/* Show Create Button when API returns 404 */}
      {!loading && apiError && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 3 }}>
          <Typography variant="body1">
            No fit comments found for selected style 
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setOpenCreateModal(true)}
            sx={{ width: "fit-content" }}
          >
            Create Fit Comment
          </Button>
        </Box>
      )}

      {/* Create Fit Comment Modal */}
      <Modal
        open={openCreateModal}
        onClose={handleCloseCreateModal}
        aria-labelledby="create-fit-comment-modal"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 1,
          }}
        >
          <Typography variant="h6" component="h2" gutterBottom>
            Create Fit Comment for {selectedStyleNumber}
          </Typography>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="modal-sample-status-label">
              Sample Status
            </InputLabel>
            <Select
              labelId="modal-sample-status-label"
              value={modalSampleStatus}
              onChange={(e) => setModalSampleStatus(e.target.value)}
              label="Sample Status"
            >
              {sampleStatus?.map((status) => (
                <MenuItem key={status?._id} value={status?.sampleStatus?.name}>
                  {status?.sampleStatus?.name || "N/A"}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="modal-sample-requesting-label">
              Sample Requesting
            </InputLabel>
            <Select
              labelId="modal-sample-requesting-label"
              value={modalSampleRequestingStatus}
              onChange={(e) => setModalSampleRequestingStatus(e.target.value)}
              label="Sample Requesting"
            >
              {sampleRequestingStatus?.map((option) => (
                <MenuItem
                  key={option?._id}
                  value={option?.sampleRequestingStatus?.name}
                >
                  {option?.sampleRequestingStatus?.name || "N/A"}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
            <Button variant="outlined" onClick={handleCloseCreateModal}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateFitComment}
              disabled={!modalSampleStatus || !modalSampleRequestingStatus}
            >
              Create
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Display existing fit comments */}
      {!loading && !apiError && fitComments && (
        <>
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <FormControl sx={{ width: "25%" }}>
              <InputLabel id="sample-status-label">Sample Status</InputLabel>
              <Select
                labelId="sample-status-label"
                value={selectedStatus}
                onChange={handleStatusChange}
                label="Sample Status"
              >
                {sampleStatus?.map((status) => (
                  <MenuItem
                    key={status?._id}
                    value={status?.sampleStatus?.name}
                  >
                    {status?.sampleStatus?.name || "N/A"}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ width: "25%" }}>
              <InputLabel id="sample-requesting-label">
                Sample Requesting
              </InputLabel>
              <Select
                labelId="sample-requesting-label"
                value={selectedRequestingStatus}
                onChange={handleRequestingStatusChange}
                label="Sample Requesting"
              >
                {sampleRequestingStatus?.map((option) => (
                  <MenuItem
                    key={option?._id}
                    value={option?.sampleRequestingStatus?.name}
                  >
                    {option?.sampleRequestingStatus?.name || "N/A"}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
          >
            {tabLabels?.map((label, index) => (
              <Tab key={index} label={label} />
            ))}
          </Tabs>

          <Box sx={{ p: 2, border: 1, borderColor: "divider", borderTop: 0 }}>
            {!isEditing ? (
              <>
                {currentTabData ? (
                  <>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body1">
                        <strong>Date:</strong>{" "}
                        {currentTabData?.date
                          ? new Date(currentTabData?.date)?.toLocaleDateString()
                          : "N/A"}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Completed By:</strong>{" "}
                        {renderFieldWithFallback(
                          currentTabData?.comment_completed_by
                        )}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Approval Status:</strong>{" "}
                        {renderFieldWithFallback(
                          currentTabData?.approval_status
                        )}
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 1 }}>
                        <strong>Comments:</strong>{" "}
                        {renderFieldWithFallback(currentTabData?.comments)}
                      </Typography>
                    </Box>

                    {currentTabData.images && (
                      <>
                        {currentTabData.images.front_view?.length > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>
                              Front View:
                            </Typography>
                            <Box
                              sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}
                            >
                              {currentTabData.images.front_view.map(
                                (img, index) => (
                                  <img
                                    key={index}
                                    src={img}
                                    alt={`Front view ${index}`}
                                    style={{
                                      width: "160px",
                                      height: "auto",
                                      objectFit: "cover",
                                      borderRadius: 1,
                                      cursor: "pointer",
                                    }}
                                    onClick={() => handleImageClick(img)}
                                  />
                                )
                              )}
                            </Box>
                          </Box>
                        )}

                        {currentTabData.images.back_view?.length > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>
                              Back View:
                            </Typography>
                            <Box
                              sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}
                            >
                              {currentTabData.images.back_view.map(
                                (img, index) => (
                                  <img
                                    key={index}
                                    src={img}
                                    alt={`Back view ${index}`}
                                    style={{
                                      width: "160px",
                                      height: "auto",
                                      objectFit: "cover",
                                      borderRadius: 1,
                                      cursor: "pointer",
                                    }}
                                    onClick={() => handleImageClick(img)}
                                  />
                                )
                              )}
                            </Box>
                          </Box>
                        )}

                        {currentTabData.images.side_view?.length > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>
                              Side View:
                            </Typography>
                            <Box
                              sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}
                            >
                              {currentTabData.images.side_view.map(
                                (img, index) => (
                                  <img
                                    key={index}
                                    src={img}
                                    alt={`Side view ${index}`}
                                    style={{
                                      width: "160px",
                                      height: "auto",
                                      objectFit: "cover",
                                      borderRadius: 1,
                                      cursor: "pointer",
                                    }}
                                    onClick={() => handleImageClick(img)}
                                  />
                                )
                              )}
                            </Box>
                          </Box>
                        )}

                        {currentTabData.images.additional_pictures?.length >
                          0 && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>
                              Additional Pictures:
                            </Typography>
                            <Box
                              sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}
                            >
                              {currentTabData.images.additional_pictures.map(
                                (img, index) => (
                                  <img
                                    key={index}
                                    src={img}
                                    alt={`Additional picture ${index}`}
                                    style={{
                                      width: "160px",
                                      height: "auto",
                                      objectFit: "cover",
                                      borderRadius: 1,
                                      cursor: "pointer",
                                    }}
                                    onClick={() => handleImageClick(img)}
                                  />
                                )
                              )}
                            </Box>
                          </Box>
                        )}
                      </>
                    )}

                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleEditClick}
                      sx={{ mt: 2 }}
                    >
                      Edit
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAddClick}
                  >
                    Add
                  </Button>
                )}
              </>
            ) : (
              <Box component="form" sx={{ mt: 2 }}>
                <TextField
                  label="Date"
                  type="date"
                  fullWidth
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  onClick={(e) => e.target.showPicker()}
                  sx={{ mb: 2 }}
                  required
                  inputProps={{
                    max: new Date().toISOString().split("T")[0],
                  }}
                />

                <TextField
                  label="Completed By"
                  fullWidth
                  value={completedBy}
                  onChange={(e) => setCompletedBy(e.target.value)}
                  sx={{ mb: 2 }}
                  required
                />

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="approval-status-label">
                    Approval Status
                  </InputLabel>
                  <Select
                    labelId="approval-status-label"
                    value={approvalStatus}
                    onChange={(e) => setApprovalStatus(e.target.value)}
                    label="Approval Status"
                    required
                  >
                    <MenuItem value="Approved">Approved</MenuItem>
                    <MenuItem value="Approved with Corrections">
                      Approved with Corrections
                    </MenuItem>
                    <MenuItem value="Rejected">Rejected</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Comments"
                  fullWidth
                  multiline
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  sx={{ mb: 2 }}
                  required
                />

                {renderImageSection("front_view", "Front View")}
                {renderImageSection("back_view", "Back View")}
                {renderImageSection("side_view", "Side View")}
                {renderImageSection(
                  "additional_pictures",
                  "Additional Pictures"
                )}

                <Box
                  sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}
                >
                  <Button variant="outlined" onClick={handleCancelClick}>
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSaveClick}
                    disabled={
                      !date || !completedBy || !approvalStatus || !comment
                    }
                  >
                    Save
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        </>
      )}

      {/* Image Preview Modal */}
      <Dialog
        open={openImageModal}
        onClose={() => setOpenImageModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <IconButton
            edge="end"
            color="inherit"
            onClick={() => setOpenImageModal(false)}
            aria-label="close"
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            p: 4,
          }}
        >
          <img
            src={selectedImage}
            alt="Enlarged preview"
            style={{
              maxWidth: "100%",
              maxHeight: "80vh",
              objectFit: "contain",
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Confirmation Dialog */}
      <Dialog
        open={showConfirmation}
        onClose={handleCancelAction}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Unsaved Changes</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            You have unsaved changes. Are you sure you want to leave without saving?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelAction}>Cancel</Button>
          <Button onClick={handleConfirmAction} color="primary" autoFocus>
            Discard Changes
          </Button>
          {isEditing && (
            <Button
              onClick={async () => {
                const success = await handleSaveClick();
                if (success) {
                  setShowConfirmation(false);
                  setActionCallback(null);
                }
              }}
              color="primary"
              variant="contained"
            >
              Save Changes
            </Button>
          )}
        </DialogActions>
      </Dialog>

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
    </Paper>
  );
}

export default FitCommentSection;