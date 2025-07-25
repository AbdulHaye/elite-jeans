import React, { useState } from "react";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Tooltip from "@mui/material/Tooltip";
import api from "../../../ApiServices/api";
import { useNavigate } from "react-router-dom";

function GradedSpecsTable2Techpack({
  TechPackId,
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
  const [showAllGrading, setShowAllGrading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbarState, setSnackbarState] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  const handleCloseSnackbar = () => {
    setSnackbarState((prev) => ({ ...prev, open: false }));
  };

  const getDisplayFields = (item) => {
    if (!item) return [];
    return Object.keys(item).filter(
      (field) =>
        !excludedFields.includes(field) &&
        !["code", "description", "tolerance"].includes(field)
    );
  };

  const handleEditClick = (rowIndex) => {
    setEditingRowIndex(rowIndex);
    setEditFormData({ ...realPOMs[rowIndex] });
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
      setEditingRowIndex(null);
      setEditingField(null);
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
        >
          {showAllGrading ? "Hide Grading" : "Show Grading"}
        </Button>
      </Box>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f0f0f0" }}>
            <th
              style={{ padding: 8, border: "1px solid #ccc", width: 50 }}
            ></th>
            <th style={{ padding: 8, border: "1px solid #ccc" }}>Code</th>
            <th style={{ padding: 8, border: "1px solid #ccc" }}>
              Description
            </th>
            <th style={{ padding: 8, border: "1px solid #ccc" }}>Tol (+/-)</th>
            {copiedPOMs?.[0] &&
              getDisplayFields(copiedPOMs[0]).map((field) => (
                <th
                  key={field}
                  style={{
                    padding: 8,
                    border: "1px solid #ccc",
                    backgroundColor: isHighlightedColumn(field)
                      ? "#ffeb3b"
                      : "inherit",
                  }}
                >
                  {field}
                </th>
              ))}
            <th
              style={{ padding: 8, border: "1px solid #ccc", width: 100 }}
            ></th>
          </tr>
        </thead>

        <tbody>
          {copiedPOMs?.length > 0 ? (
            copiedPOMs.map((row, rowIndex) => (
              <React.Fragment key={row._id || rowIndex}>
                <tr>
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
                  </td>
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
                  <td style={{ padding: 8, border: "1px solid #ddd" }}>
                    {editingRowIndex === rowIndex && !showAllGrading && (
                      <Tooltip title="Cancel">
                        <IconButton
                          size="small"
                          onClick={handleCancelEdit}
                          disabled={isSubmitting}
                          color="error"
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </td>
                </tr>

                {(showAllGrading || editingRowIndex === rowIndex) && (
                  <tr>
                    <td
                      colSpan={4}
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
                    <td style={{ padding: 8, border: "1px solid #ddd" }}></td>
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

export default GradedSpecsTable2Techpack;
