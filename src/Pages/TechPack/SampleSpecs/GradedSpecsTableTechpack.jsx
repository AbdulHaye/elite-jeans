import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Modal,
  Alert,
  Snackbar,
  Checkbox,
  Grid,
  Paper,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import axios from "axios";
import {
  Add,
  Save,
  Delete as DeleteIcon,
  ContentCopy as ContentCopyIcon,
  ContentPaste as ContentPasteIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";
// import LibraryItemsModal from "./AddFromLibraryModal";
// import api from "../../../../../../ApiServices/api";
import LibraryItemsModal from "../../WorkOrder/components/detailWorkOrder/component/SampleGraded/AddFromLibraryModal";
import api from "../../../ApiServices/api";

// Helper function to convert decimal to fraction
const decimalToFraction = (decimal) => {
  if (decimal === null || decimal === undefined || decimal === "") return "";

  const num = parseFloat(decimal);
  if (isNaN(num)) return "";

  // Check if it's a whole number
  if (num % 1 === 0) {
    return num.toString();
  }

  // Common fractions
  const fractions = [
    { decimal: 0.125, fraction: "1/8" },
    { decimal: 0.25, fraction: "1/4" },
    { decimal: 0.375, fraction: "3/8" },
    { decimal: 0.5, fraction: "1/2" },
    { decimal: 0.625, fraction: "5/8" },
    { decimal: 0.75, fraction: "3/4" },
    { decimal: 0.875, fraction: "7/8" },
  ];

  // Check for exact matches
  for (const frac of fractions) {
    if (Math.abs(num - frac.decimal) < 0.001) {
      return num < 0 ? `-${frac.fraction}` : frac.fraction;
    }
    if (Math.abs(num + frac.decimal) < 0.001) {
      return `-${frac.fraction}`;
    }
  }

  // For other decimals, round to 2 decimal places
  return num.toFixed(2);
};

const GradedSpecsTableTechpack = ({
  workOrderkId,
  specId,
  datesdata,
  samplesgradedspecId,
  onDataFetched,
}) => {
  // State management
  const [data, setData] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [copiedColumn, setCopiedColumn] = useState(null);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [isAddingNewRow, setIsAddingNewRow] = useState(false);
  const [newRowData, setNewRowData] = useState({
    code: "",
    description: "",
    tolerance: "",
  });
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null });

  // Date states
  const [dates, setDates] = useState({
    DesignDate: null,
    IntialDate: null,
    Finaldate: null,
    FirstPPdate: null,
    Rev1date: null,
    Rev2date: null,
    SecondPPdate: null,
    Shipdate: null,
    ThirdPPdate: null,
  });

  // Calculate difference between two values
  const calculateDifference = (item, firstField, secondField) => {
    const firstValue = parseFloat(item[firstField]);
    const secondValue = parseFloat(item[secondField]);

    if (isNaN(firstValue) || isNaN(secondValue)) return "";

    const difference = secondValue - firstValue;
    return decimalToFraction(difference);
  };

  // Column configuration
  const columns = [
    { name: "design", label: "Design" },
    { name: "Initial", label: "Initial" },
    { name: "FirstPP", label: "1st PP" },
    {
      name: "diff1",
      label: "diff +/-",
      isDiff: true,
      fields: ["Initial", "FirstPP"],
    },
    { name: "Rev1", label: "Rev1" },
    { name: "SecondPP", label: "2nd PP" },
    {
      name: "diff2",
      label: "diff +/-",
      isDiff: true,
      fields: ["Rev1", "SecondPP"],
    },
    { name: "Rev2", label: "Rev2" },
    { name: "ThirdPP", label: "3rd PP" },
    {
      name: "diff3",
      label: "diff +/-",
      isDiff: true,
      fields: ["Rev2", "ThirdPP"],
    },
    { name: "Final", label: "Final" },
    { name: "Ship", label: "Ship." },
  ];

  // Helper functions
  const showNotification = (message, severity) => {
    setNotification({ open: true, message, severity });
  };

  const handleError = (error, message) => {
    console.error(message, error);
    showNotification(message, "error");
  };

  // Data fetching
  const fetchData = async () => {
    try {
      const response = await api.get(
        `/api/copied-poms/${samplesgradedspecId}/${specId}/`
      );
      setData(response?.data?.data || []);
      if (onDataFetched) {
        onDataFetched(response?.data?.data || [], samplesgradedspecId);
      }
    } catch (error) {
      handleError(error, "Failed to fetch data");
    }
  };

  useEffect(() => {
    const initializeDates = () => {
      if (datesdata) {
        const newDates = {};
        Object.keys(dates).forEach((key) => {
          newDates[key] = datesdata[key] ? dayjs(datesdata[key]) : null;
        });
        setDates(newDates);
      }
    };

    initializeDates();
    fetchData();
  }, [datesdata, samplesgradedspecId, specId]);

  // Selection handlers
  const handleSelectAll = () => setSelectedItems(data.map((item) => item._id));
  const handleUnselectAll = () => setSelectedItems([]);
  const handleCheckboxChange = (itemId) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Delete operations
  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/delete/${id}`);
      fetchData();
      showNotification("Item deleted successfully", "success");
    } catch (error) {
      handleError(error, "Failed to delete item");
    } finally {
      setDeleteModal({ open: false, id: null });
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) {
      showNotification("No items selected!", "warning");
      return;
    }

    try {
      await api.delete("/api/delete-multiple", {
        data: { deletedIds: selectedItems },
      });
      showNotification("Selected items deleted successfully!", "success");
      fetchData();
      setSelectedItems([]);
    } catch (error) {
      handleError(error, "Failed to delete selected items!");
    }
  };

  // Field operations
  const handleFieldUpdate = async (id, field, value) => {
    try {
      await api.put(`/api/update/${id}`, { [field]: value });
      fetchData();
    } catch (error) {
      handleError(error, "Failed to update field");
    }
  };

  // Column operations
  const handleColumnOperation = async (operation, columnName) => {
    if (operation === "copy") {
      setCopiedColumn({
        name: columnName,
        data: data.map((item) => item[columnName]),
      });
      showNotification(`Column ${columnName} copied!`, "success");
      return;
    }

    if (operation === "paste" && !copiedColumn) {
      showNotification("No column copied to paste!", "warning");
      return;
    }

    try {
      const updates = data.map((item, index) => ({
        id: item._id,
        [columnName]: operation === "clear" ? "" : copiedColumn.data[index],
      }));

      await api.put("/api/update-multiple", { updates });
      fetchData();
      showNotification(
        `Column ${columnName} ${
          operation === "clear" ? "cleared" : "pasted"
        } successfully!`,
        "success"
      );
    } catch (error) {
      handleError(error, `Failed to ${operation} column!`);
    }
  };

  // Date operations
  const handleDateChange = async (date, field) => {
    const newDates = { ...dates, [field]: date };
    setDates(newDates);

    try {
      await api.put(`/api/sampleGradedSpecs/${samplesgradedspecId}`, {
        [field]: date ? date.format("YYYY-MM-DD") : null,
      });
      showNotification("Date updated successfully!", "success");
    } catch (error) {
      handleError(error, "Failed to update date");
      // Revert to previous date if update fails
      setDates((prev) => ({ ...prev, [field]: dates[field] }));
    }
  };

  // New row operations
  const handleAddNewRow = () => setIsAddingNewRow(true);

  const handleNewRowChange = (e) => {
    setNewRowData({ ...newRowData, [e.target.name]: e.target.value });
  };

  const handleSaveNewRow = async () => {
    try {
      await api.post(
        `/api/copied-poms/${samplesgradedspecId}/${specId}/`,
        newRowData
      );
      fetchData();
      setIsAddingNewRow(false);
      setNewRowData({ code: "", description: "", tolerance: "" });
      showNotification("New item added successfully!", "success");
    } catch (error) {
      handleError(error, "Failed to add new item");
    }
  };

  const handleCancelNewRow = () => {
    setIsAddingNewRow(false);
    setNewRowData({ code: "", description: "", tolerance: "" });
  };
  const userRole = localStorage.getItem('role');
  return (
    <div>
      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={3000}
        onClose={() => setNotification((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setNotification((prev) => ({ ...prev, open: false }))}
          severity={notification.severity}
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>

      {/* Main Table */}
      <Box sx={{ width: "100%", mt: 5, overflowX: "auto" }}>
  <TableContainer component={Paper} sx={{ minWidth: 1850 }}>
    <Table>
      <TableHead>
        {/* Action Buttons Row */}
        <TableRow>
          {(userRole === 'admin' || userRole === 'general') && (
            <TableCell colSpan={2} align="left">
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleSelectAll}
                >
                  Select All
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleUnselectAll}
                >
                  Unselect All
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  color="error"
                  onClick={handleDeleteSelected}
                >
                  Delete Selected
                </Button>
              </Box>
            </TableCell>
          )}
          <TableCell colSpan={columns.length} align="right">
            {/* Removed the Save Dates button */}
          </TableCell>
        </TableRow>

        {/* Column Headers */}
        <TableRow>
          <TableCell sx={{ width: "30%", minWidth: 300 }} align="center">
            <b>Sample Status</b>
          </TableCell>
          {columns.map((col) => (
            <TableCell key={col.name || col.label} align="center">
              <b>{col.label}</b>
            </TableCell>
          ))}
          <TableCell align="center"></TableCell>
        </TableRow>

        {/* Date Pickers Row */}
        <TableRow>
          <TableCell sx={{ width: "30%", minWidth: 300 }} align="center">
            Date
          </TableCell>
          <TableCell align="center">
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Design"
                value={dates.DesignDate}
                onChange={(newDate) =>
                  handleDateChange(newDate, "DesignDate")
                }
                slotProps={{
                  textField: {
                    sx: {
                      width: "100px",
                      "& .MuiInputBase-root": {
                        height: "30px",
                        fontSize: "9px",
                        paddingRight: "5px",
                      },
                      "& .MuiFormLabel-root": {
                        fontSize: "10px",
                        transform: "translate(14px, 9px) scale(1)",
                        "&.Mui-focused, &.MuiFormLabel-filled": {
                          transform: "translate(14px, -9px) scale(0.75)",
                        }
                      },
                      "& .MuiInputBase-input": {
                        padding: "8px 5px 8px 5px",
                      }
                    },
                  },
                }}
              />
            </LocalizationProvider>
          </TableCell>
          <TableCell align="center">
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Initial"
                value={dates.IntialDate}
                onChange={(newDate) =>
                  handleDateChange(newDate, "IntialDate")
                }
                slotProps={{
                  textField: {
                    sx: {
                      width: "100px",
                      "& .MuiInputBase-root": {
                        height: "30px",
                        fontSize: "9px",
                        paddingRight: "5px",
                      },
                      "& .MuiFormLabel-root": {
                        fontSize: "10px",
                        transform: "translate(14px, 9px) scale(1)",
                        "&.Mui-focused, &.MuiFormLabel-filled": {
                          transform: "translate(14px, -9px) scale(0.75)",
                        }
                      },
                      "& .MuiInputBase-input": {
                        padding: "8px 5px 8px 5px",
                      }
                    },
                  },
                }}
              />
            </LocalizationProvider>
          </TableCell>
          <TableCell align="center">
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="1st PP"
                value={dates.FirstPPdate}
                onChange={(newDate) =>
                  handleDateChange(newDate, "FirstPPdate")
                }
                slotProps={{
                  textField: {
                    sx: {
                      width: "100px",
                      "& .MuiInputBase-root": {
                        height: "30px",
                        fontSize: "9px",
                        paddingRight: "5px",
                      },
                      "& .MuiFormLabel-root": {
                        fontSize: "10px",
                        transform: "translate(14px, 9px) scale(1)",
                        "&.Mui-focused, &.MuiFormLabel-filled": {
                          transform: "translate(14px, -9px) scale(0.75)",
                        }
                      },
                      "& .MuiInputBase-input": {
                        padding: "8px 5px 8px 5px",
                      }
                    },
                  },
                }}
              />
            </LocalizationProvider>
          </TableCell>
          <TableCell align="center"></TableCell>
          <TableCell align="center">
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Rev1"
                value={dates.Rev1date}
                onChange={(newDate) =>
                  handleDateChange(newDate, "Rev1date")
                }
                slotProps={{
                  textField: {
                    sx: {
                      width: "100px",
                      "& .MuiInputBase-root": {
                        height: "30px",
                        fontSize: "9px",
                        paddingRight: "5px",
                      },
                      "& .MuiFormLabel-root": {
                        fontSize: "10px",
                        transform: "translate(14px, 9px) scale(1)",
                        "&.Mui-focused, &.MuiFormLabel-filled": {
                          transform: "translate(14px, -9px) scale(0.75)",
                        }
                      },
                      "& .MuiInputBase-input": {
                        padding: "8px 5px 8px 5px",
                      }
                    },
                  },
                }}
              />
            </LocalizationProvider>
          </TableCell>
          <TableCell align="center">
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="2nd PP"
                value={dates.SecondPPdate}
                onChange={(newDate) =>
                  handleDateChange(newDate, "SecondPPdate")
                }
                slotProps={{
                  textField: {
                    sx: {
                      width: "100px",
                      "& .MuiInputBase-root": {
                        height: "30px",
                        fontSize: "9px",
                        paddingRight: "5px",
                      },
                      "& .MuiFormLabel-root": {
                        fontSize: "10px",
                        transform: "translate(14px, 9px) scale(1)",
                        "&.Mui-focused, &.MuiFormLabel-filled": {
                          transform: "translate(14px, -9px) scale(0.75)",
                        }
                      },
                      "& .MuiInputBase-input": {
                        padding: "8px 5px 8px 5px",
                      }
                    },
                  },
                }}
              />
            </LocalizationProvider>
          </TableCell>
          <TableCell align="center"></TableCell>
          <TableCell align="center">
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Rev2"
                value={dates.Rev2date}
                onChange={(newDate) =>
                  handleDateChange(newDate, "Rev2date")
                }
                slotProps={{
                  textField: {
                    sx: {
                      width: "100px",
                      "& .MuiInputBase-root": {
                        height: "30px",
                        fontSize: "9px",
                        paddingRight: "5px",
                      },
                      "& .MuiFormLabel-root": {
                        fontSize: "10px",
                        transform: "translate(14px, 9px) scale(1)",
                        "&.Mui-focused, &.MuiFormLabel-filled": {
                          transform: "translate(14px, -9px) scale(0.75)",
                        }
                      },
                      "& .MuiInputBase-input": {
                        padding: "8px 5px 8px 5px",
                      }
                    },
                  },
                }}
              />
            </LocalizationProvider>
          </TableCell>
          <TableCell align="center">
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="3rd PP"
                value={dates.ThirdPPdate}
                onChange={(newDate) =>
                  handleDateChange(newDate, "ThirdPPdate")
                }
                slotProps={{
                  textField: {
                    sx: {
                      width: "100px",
                      "& .MuiInputBase-root": {
                        height: "30px",
                        fontSize: "9px",
                        paddingRight: "5px",
                      },
                      "& .MuiFormLabel-root": {
                        fontSize: "10px",
                        transform: "translate(14px, 9px) scale(1)",
                        "&.Mui-focused, &.MuiFormLabel-filled": {
                          transform: "translate(14px, -9px) scale(0.75)",
                        }
                      },
                      "& .MuiInputBase-input": {
                        padding: "8px 5px 8px 5px",
                      }
                    },
                  },
                }}
              />
            </LocalizationProvider>
          </TableCell>
          <TableCell align="center"></TableCell>
          <TableCell align="center">
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Final"
                value={dates.Finaldate}
                onChange={(newDate) =>
                  handleDateChange(newDate, "Finaldate")
                }
                slotProps={{
                  textField: {
                    sx: {
                      width: "100px",
                      "& .MuiInputBase-root": {
                        height: "30px",
                        fontSize: "9px",
                        paddingRight: "5px",
                      },
                      "& .MuiFormLabel-root": {
                        fontSize: "10px",
                        transform: "translate(14px, 9px) scale(1)",
                        "&.Mui-focused, &.MuiFormLabel-filled": {
                          transform: "translate(14px, -9px) scale(0.75)",
                        }
                      },
                      "& .MuiInputBase-input": {
                        padding: "8px 5px 8px 5px",
                      }
                    },
                  },
                }}
              />
            </LocalizationProvider>
          </TableCell>
          <TableCell align="center">
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Ship"
                value={dates.Shipdate}
                onChange={(newDate) =>
                  handleDateChange(newDate, "Shipdate")
                }
                slotProps={{
                  textField: {
                    sx: {
                      width: "100px",
                      "& .MuiInputBase-root": {
                        height: "30px",
                        fontSize: "9px",
                        paddingRight: "5px",
                      },
                      "& .MuiFormLabel-root": {
                        fontSize: "10px",
                        transform: "translate(14px, 9px) scale(1)",
                        "&.Mui-focused, &.MuiFormLabel-filled": {
                          transform: "translate(14px, -9px) scale(0.75)",
                        }
                      },
                      "& .MuiInputBase-input": {
                        padding: "8px 5px 8px 5px",
                      }
                    },
                  },
                }}
              />
            </LocalizationProvider>
          </TableCell>
          <TableCell align="center"></TableCell>
        </TableRow>

        {/* Column Operations Row */}
        <TableRow>
          <TableCell sx={{ width: "30%", minWidth: 300 }} align="center">
            <Grid container spacing={2}>
              <Grid item xs={1}></Grid>
              <Grid item xs={3}>
                <Typography variant="subtitle1" sx={{ fontSize: "12px" }}>
                  Code
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle1" sx={{ fontSize: "12px" }}>
                  Point of Measure Description
                </Typography>
              </Grid>
              <Grid item xs={2}>
                <Typography variant="subtitle1" sx={{ fontSize: "12px" }}>
                  Tol (+/-)
                </Typography>
              </Grid>
            </Grid>
          </TableCell>

          {columns.map((col) => (
            <TableCell key={`actions-${col.name}`} align="center">
              {col.name && !col.isDiff && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 0.3,
                  }}
                >
                  <Tooltip title="Copy">
                    <IconButton
                      size="small"
                      onClick={() =>
                        handleColumnOperation("copy", col.name)
                      }
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Paste">
                    <IconButton
                      size="small"
                      onClick={() =>
                        handleColumnOperation("paste", col.name)
                      }
                    >
                      <ContentPasteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Clear">
                    <IconButton
                      size="small"
                      onClick={() =>
                        handleColumnOperation("clear", col.name)
                      }
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </TableCell>
          ))}
          <TableCell align="center"></TableCell>
        </TableRow>
      </TableHead>

      {/* Table Body */}
      <TableBody>
        {/* Existing Rows */}
        {data.map((item) => (
          <TableRow key={item._id}>
            <TableCell sx={{ width: "30%", minWidth: 300 }} align="center">
              <Grid container spacing={2}>
                <Grid item xs={1}>
                  <Checkbox
                    checked={selectedItems.includes(item._id)}
                    onChange={() => handleCheckboxChange(item._id)}
                    sx={{ transform: "scale(.5)", ml: -3, mt: -1 }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    value={item?.code || ""}
                    onChange={(e) =>
                      handleFieldUpdate(item._id, "code", e.target.value)
                    }
                    size="small"
                    multiline
                    sx={{
                      "& .MuiInputBase-root": {
                        minHeight: "auto",
                        alignItems: "flex-start",
                        padding: 0,
                      },
                      "& .MuiInputBase-input": {
                        fontSize: "12px",
                        padding: "4px 6px",
                        lineHeight: "1.2",
                        whiteSpace: "normal",
                        wordWrap: "break-word",
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    value={item?.description || ""}
                    onChange={(e) =>
                      handleFieldUpdate(
                        item._id,
                        "description",
                        e.target.value
                      )
                    }
                    size="small"
                    multiline
                    sx={{
                      "& .MuiInputBase-root": {
                        minHeight: "auto",
                        alignItems: "flex-start",
                        padding: 0,
                      },
                      "& .MuiInputBase-input": {
                        fontSize: "12px",
                        padding: "4px 6px",
                        lineHeight: "1.2",
                        whiteSpace: "normal",
                        wordWrap: "break-word",
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    value={item?.tolerance || ""}
                    onChange={(e) =>
                      handleFieldUpdate(
                        item._id,
                        "tolerance",
                        e.target.value
                      )
                    }
                    size="small"
                    multiline
                    sx={{
                      "& .MuiInputBase-root": {
                        minHeight: "auto",
                        alignItems: "flex-start",
                        padding: 0,
                      },
                      "& .MuiInputBase-input": {
                        fontSize: "12px",
                        padding: "4px 6px",
                        lineHeight: "1.2",
                        whiteSpace: "normal",
                        wordWrap: "break-word",
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </TableCell>

            {columns.map((col) => {
              if (col.isDiff) {
                const diffValue = calculateDifference(
                  item,
                  col.fields[0],
                  col.fields[1]
                );
                return (
                  <TableCell
                    key={`${col.name}-${item._id}`}
                    align="center"
                  >
                    <Box
                      sx={{
                        width: "25px",
                        height: "30px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        border: "1px solid rgba(224, 224, 224, 1)",
                        borderRadius: "4px",
                        backgroundColor: "rgba(0, 0, 0, 0.04)",
                      }}
                    >
                      {diffValue}
                    </Box>
                  </TableCell>
                );
              }

              if (!col.name) {
                return (
                  <TableCell
                    key={`empty-${item._id}`}
                    align="center"
                  ></TableCell>
                );
              }

              return (
                <TableCell key={`${col.name}-${item._id}`} align="center">
                  <TextField
                    label=""
                    value={item[col.name] || ""}
                    onChange={(e) =>
                      handleFieldUpdate(
                        item._id,
                        col.name,
                        e.target.value
                      )
                    }
                    sx={{
                      width: "100px",
                      "& .MuiInputBase-root": {
                        height: "30px",
                        fontSize: "12px",
                      },
                    }}
                  />
                </TableCell>
              );
            })}

            <TableCell align="center">
              <IconButton
                size="small"
                onClick={() =>
                  setDeleteModal({ open: true, id: item._id })
                }
              >
                <DeleteIcon />
              </IconButton>
            </TableCell>
          </TableRow>
        ))}

        {/* New Row Form */}
        {isAddingNewRow && (
          <TableRow>
            <TableCell sx={{ width: "25%", minWidth: 300 }} align="center">
              <Grid container spacing={2}>
                <Grid item xs={1}></Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    name="code"
                    value={newRowData.code}
                    onChange={handleNewRowChange}
                    size="small"
                    sx={{
                      "& .MuiInputBase-root": { height: "30px" },
                      "& .MuiInputBase-input": { fontSize: "12px" },
                    }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    name="description"
                    value={newRowData.description}
                    onChange={handleNewRowChange}
                    size="small"
                    sx={{
                      "& .MuiInputBase-root": { height: "30px" },
                      "& .MuiInputBase-input": { fontSize: "12px" },
                    }}
                  />
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    name="tolerance"
                    value={newRowData.tolerance}
                    onChange={handleNewRowChange}
                    size="small"
                    sx={{
                      "& .MuiInputBase-root": { height: "30px" },
                      "& .MuiInputBase-input": { fontSize: "12px" },
                    }}
                  />
                </Grid>
              </Grid>
            </TableCell>

            {columns.map((col, idx) => (
              <TableCell key={`new-${idx}`} align="center"></TableCell>
            ))}
            <TableCell align="center">
              <Box sx={{ display: "flex", gap: 1 }}>
                <IconButton
                  size="small"
                  onClick={handleSaveNewRow}
                  color="primary"
                >
                  <Save fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={handleCancelNewRow}
                  color="error"
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </Box>
            </TableCell>
          </TableRow>
        )}

        {/* Empty State */}
        {data.length === 0 && !isAddingNewRow && (
          <TableRow>
            <TableCell colSpan={columns.length + 2} align="center">
              No data available
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </TableContainer>

  {/* Add Buttons */}
  <Box
    sx={{
      p: 2,
      borderTop: 1,
      borderColor: "divider",
      display: "flex",
      gap: 1,
    }}
  >
    <Button
      variant="outlined"
      size="small"
      startIcon={<Add />}
      onClick={handleAddNewRow}
    >
      Add Point of Measure
    </Button>
    <Button
      variant="outlined"
      size="small"
      startIcon={<Add />}
      onClick={() => setIsLibraryModalOpen(true)}
    >
      Add from Library
    </Button>
  </Box>
</Box>

      {/* Library Modal */}
      <LibraryItemsModal
        open={isLibraryModalOpen}
        handleClose={() => {
          fetchData(); // First call your data refresh function
          setIsLibraryModalOpen(false); // Then close the modal
        }}
        sampleSpecsId={samplesgradedspecId}
        techPackId={specId}
        onSuccess={fetchData}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null })}
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
            borderRadius: 2,
            p: 4,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Are you sure you want to delete this item?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            This action cannot be undone.
          </Typography>
          <Box
            sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}
          >
            <Button
              variant="outlined"
              onClick={() => setDeleteModal({ open: false, id: null })}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => handleDelete(deleteModal.id)}
            >
              Delete
            </Button>
          </Box>
        </Box>
      </Modal>
    </div>
  );
};

export default GradedSpecsTableTechpack;
