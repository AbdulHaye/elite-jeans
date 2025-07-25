import React, { useState } from "react";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import DoneIcon from "@mui/icons-material/Done";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Tooltip from "@mui/material/Tooltip";
import api from "../../../../../../../ApiServices/api";
import { useNavigate } from "react-router-dom";
import { useConfirmationDialog } from "../../../../../../../Components/dialog/ConfirmationDialogProvider";

function GradedSpec2Table({
  specId,
  copiedPOMs,
  realPOMs,
  onDataUpdate,
  size,
}) {
  const excludedFields = [
    "Final",
    "FirstPP",
    "Initial",
    "Rev1",
    "Rev2",
    "SecondPP",
    "Ship",
    "ThirdPP",
    "updatedAt",
    "_id",
    "specTemplateId",
    "createdAt",
  ];

  const navigate = useNavigate();
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAllGrading, setShowAllGrading] = useState(false);
  const [snackbarState, setSnackbarState] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const showConfirmationDialog = useConfirmationDialog();
  const [isAddingSize, setIsAddingSize] = useState(false);
  const [newSizeName, setNewSizeName] = useState("");
  const [newSizeValues, setNewSizeValues] = useState({});
  const [activeSizeCell, setActiveSizeCell] = useState(null);

  const getDisplayFields = (item) => {
    if (!item) return [];
    return Object.keys(item).filter(
      (field) =>
        !excludedFields.includes(field) &&
        !["code", "description", "tolerance"].includes(field)
    );
  };

  const handleCloseSnackbar = () => {
    setSnackbarState((prev) => ({ ...prev, open: false }));
  };

  const handleEditClick = (rowIndex) => {
    setEditingRowIndex(rowIndex);
    setEditFormData({ ...realPOMs[rowIndex] });
  };

  const handleDeletePomClick = async (rowIndex) => {
    const confirmation = await showConfirmationDialog({
      message: `Are you sure you want to delete "${copiedPOMs[rowIndex]?.code}"?`,
    });

    if (confirmation) {
      setIsSubmitting(true);
      try {
        const response = await api.post(
          `/api/copied-samples/${specId}/deleteCopiedPom`,
          {
            pomId: copiedPOMs[rowIndex]?._id,
          }
        );

        setSnackbarState({
          open: true,
          message: response.data?.message || "POM deleted successfully!",
          severity: "success",
        });
        onDataUpdate?.();
      } catch (e) {
        setSnackbarState({
          open: true,
          message: response.data?.message || "Failed to delete POM",
          severity: "error",
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingRowIndex(null);
    setEditingField(null);
    setEditFormData({});
  };

  const handleInputChange = (field, value) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
    setEditingField(field);
  };

  const handleSave = async (rowIndex) => {
    if (!realPOMs[rowIndex]?._id || !editingField) return;

    setIsSubmitting(true);
    try {
      const payload = {
        pomId: realPOMs[rowIndex]._id,
        field: editingField,
        newValue: editFormData[editingField],
      };

      const response = await api.put(
        `/api/copied-samples/${specId}/realpomsupdateCopiedSampleGradedSpecs`,
        payload
      );

      setSnackbarState({
        open: true,
        message: response.data?.message || "Data updated successfully!",
        severity: "success",
      });

      onDataUpdate?.();
    } catch (error) {
      console.error("Error saving data:", error);
      setSnackbarState({
        open: true,
        message: error.response?.data?.message || "Failed to update data",
        severity: "error",
      });
      if (error.response?.status === 401) {
        navigate("/login");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBlur = async (rowIndex) => {
    if (editingRowIndex === rowIndex && editingField) {
      await handleSave(rowIndex);
    }
  };

  const handleFieldFocus = (field) => {
    setEditingField(field);
  };

  const toggleAllGrading = () => {
    if (showAllGrading && editingRowIndex !== null) {
      handleCancelEdit();
    }
    setShowAllGrading(!showAllGrading);
  };

  const isHighlightedColumn = (field) => {
    return size && field.toLowerCase() === size.toLowerCase();
  };

  const handleDeleteSizeClick = async (index) => {
    const size = getDisplayFields(copiedPOMs[0])[index];
    const confirm = await showConfirmationDialog({
      message: `Are you sure you want to delete size: "${size}"?`,
    });

    if (confirm) {
      setIsSubmitting(true);
      try {
        const response = await api.delete(
          `/api/copied-samples/${specId}/delete-size/${size}`
        );

        setSnackbarState({
          open: true,
          message: response.data?.message || "Size deleted successfully!",
          severity: "success",
        });
        onDataUpdate?.();
      } catch (e) {
        setSnackbarState({
          open: true,
          message: response.data?.message || "Failed to delete size!",
          severity: "error",
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleAddSizeClick = (index) => {
    setIsAddingSize(true);
    setActiveSizeCell(index);
    setNewSizeName("");
    setNewSizeValues({});
  };

  const handleNewSizeValueChange = (rowId, value) => {
    setNewSizeValues((prev) => ({ ...prev, [rowId]: value }));
  };

  const handleSaveNewSize = async () => {
    if (!newSizeName.trim()) {
      setSnackbarState({
        open: true,
        message: "Please enter a name for the new size.",
        severity: "warning",
      });
      return;
    }

    try {
      const values = copiedPOMs.map((row) => newSizeValues[row._id] || "");

      const response = await api.post(
        `/api/copied-samples/${specId}/add-size`,
        {
          size: newSizeName,
          values,
        }
      );

      setSnackbarState({
        open: true,
        message: response.data?.message || "New size added successfully!",
        severity: "success",
      });
      onDataUpdate?.();
      setIsAddingSize(false);
      setNewSizeName("");
      setNewSizeValues({});
      setActiveSizeCell(null);
    } catch (error) {
      setSnackbarState({
        open: true,
        message:
          error.response?.data?.message || "Failed to add new size column",
        severity: "error",
      });
    }
  };

  const handleCancelAddSize = () => {
    setIsAddingSize(false);
    setNewSizeName("");
    setNewSizeValues({});
    setActiveSizeCell(null);
  };

  return (
    <Paper sx={{ padding: 2, overflowX: "auto" }}>
      <Snackbar
        open={snackbarState.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity={snackbarState.severity}>{snackbarState.message}</Alert>
      </Snackbar>

      <Box
        sx={{ display: "flex", justifyContent: "flex-start", mb: 2, gap: 1 }}
      >
        <Button
          variant="contained"
          onClick={toggleAllGrading}
          color={showAllGrading ? "error" : "primary"}
          disabled={isAddingSize}
        >
          {showAllGrading ? "Hide Grading" : "Show Grading"}
        </Button>
      </Box>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f0f0f0" }}>
            {/* <th
              style={{ padding: 8, border: "1px solid #ccc", width: 50 }}
            ></th> */}
            <th style={{ padding: 8, border: "1px solid #ccc" }}>Code</th>
            <th style={{ padding: 8, border: "1px solid #ccc" }}>
              Description
            </th>
            <th style={{ padding: 8, border: "1px solid #ccc" }}>Tol (+/-)</th>
            {copiedPOMs?.[0] &&
              getDisplayFields(copiedPOMs[0]).map((field, index) => (
                <th
                  key={field}
                  style={{
                    padding: 8,
                    border: "1px solid #ccc",
                    backgroundColor: isHighlightedColumn(field)
                      ? "#ffeb3b"
                      : "inherit",
                    textAlign: "center",
                  }}
                >
                  {field}
                  {index < getDisplayFields(copiedPOMs[0]).length - 1 && (
                    <IconButton
                      onClick={() => handleDeleteSizeClick(index)}
                      aria-label="delete"
                      size="small"
                      color="error"
                      disabled={isAddingSize}
                    >
                      <CloseIcon fontSize="inherit" />
                    </IconButton>
                  )}

                  {index === getDisplayFields(copiedPOMs[0]).length - 1 &&
                    !showAllGrading && (
                      <IconButton
                        size="small"
                        onClick={() => handleAddSizeClick(index + 1)}
                        color="primary"
                        sx={{ ml: 1 }}
                      >
                        <AddIcon />
                      </IconButton>
                    )}
                </th>
              ))}

            {isAddingSize && (
              <th
                style={{
                  padding: 8,
                  border: "1px solid #ccc",
                  background: "#e3f2fd",
                }}
              >
                <TextField
                  size="small"
                  placeholder="Size Name"
                  value={newSizeName}
                  onChange={(e) => setNewSizeName(e.target.value)}
                />

                <Tooltip title="Save">
                  <IconButton
                    size="small"
                    onClick={handleSaveNewSize}
                    disabled={isSubmitting}
                    color="success"
                  >
                    <SaveIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Cancel">
                  <IconButton
                    size="small"
                    onClick={handleCancelAddSize}
                    disabled={isSubmitting}
                    color="error"
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </th>
            )}

            <th style={{ padding: 8, border: "1px solid #ccc", width: 100 }}>
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {copiedPOMs?.length > 0 ? (
            copiedPOMs.map((row, rowIndex) => (
              <React.Fragment key={row._id || rowIndex}>
                <tr>
                  <td style={{ padding: 8, border: "1px solid #ddd" }}>
                    {row?.code || "N/A"}
                  </td>
                  <td style={{ padding: 8, border: "1px solid #ddd" }}>
                    {row?.description || "N/A"}
                  </td>
                  <td style={{ padding: 8, border: "1px solid #ddd" }}>
                    {row?.tolerance ?? "N/A"}
                  </td>
                  {getDisplayFields(row).map((field) => (
                    <td
                      key={field}
                      style={{
                        padding: 8,
                        border: "1px solid #ddd",
                        backgroundColor: isHighlightedColumn(field)
                          ? "#fff9c4"
                          : "inherit",
                      }}
                    >
                      {row[field] || ""}
                    </td>
                  ))}
                  {isAddingSize && (
                    <td
                      style={{
                        padding: 8,
                        border: "1px solid #ddd",
                        background: "#e3f2fd",
                      }}
                    >
                      <TextField
                        size="small"
                        value={newSizeValues[row._id] || ""}
                        onChange={(e) =>
                          handleNewSizeValueChange(row._id, e.target.value)
                        }
                      />
                    </td>
                  )}

                  {isAddingSize ? (
                    <td style={{ padding: 8, border: "1px solid #ddd" }} />
                  ) : (
                    <td style={{ padding: 8, border: "1px solid #ddd" }}>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleEditClick(rowIndex)}
                          disabled={
                            isSubmitting ||
                            (showAllGrading &&
                              editingRowIndex !== null &&
                              editingRowIndex !== rowIndex)
                          }
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleDeletePomClick(rowIndex)}
                          disabled={
                            isSubmitting ||
                            (showAllGrading &&
                              editingRowIndex !== null &&
                              editingRowIndex !== rowIndex)
                          }
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </td>
                  )}
                </tr>

                {(showAllGrading || editingRowIndex === rowIndex) && (
                  <tr>
                    <td
                      colSpan={3}
                      style={{ padding: 8, border: "1px solid #ddd" }}
                    >
                      Grading Rules
                    </td>
                    {getDisplayFields(row).map((field) => (
                      <td
                        key={field}
                        style={{
                          padding: 8,
                          border: "1px solid #ddd",
                          backgroundColor: isHighlightedColumn(field)
                            ? "#fff9c4"
                            : "inherit",
                        }}
                      >
                        <TextField
                          value={
                            editingRowIndex === rowIndex
                              ? editFormData[field] || ""
                              : realPOMs[rowIndex]?.[field] || ""
                          }
                          onChange={(e) =>
                            editingRowIndex === rowIndex &&
                            handleInputChange(field, e.target.value)
                          }
                          onBlur={() => handleBlur(rowIndex)}
                          onFocus={() => handleFieldFocus(field)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleBlur(rowIndex);
                          }}
                          variant="outlined"
                          size="small"
                          fullWidth
                          disabled={
                            editingRowIndex !== rowIndex || isSubmitting
                          }
                          InputLabelProps={{ shrink: true }}
                          sx={{
                            backgroundColor:
                              editingRowIndex === rowIndex ? "#fff" : "#f9f9f9",
                          }}
                        />
                      </td>
                    ))}

                    <td style={{ padding: 8, border: "1px solid #ddd" }}>
                      {editingRowIndex === rowIndex && !showAllGrading && (
                        <Tooltip title="Save">
                          <IconButton
                            size="small"
                            onClick={handleCancelEdit}
                            disabled={isSubmitting}
                            color="success"
                          >
                            <DoneIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))
          ) : (
            <tr>
              <td
                colSpan={
                  5 +
                  (copiedPOMs?.[0] ? getDisplayFields(copiedPOMs[0]).length : 0)
                }
                style={{ padding: 8, textAlign: "center" }}
              >
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Paper>
  );
}

export default GradedSpec2Table;
