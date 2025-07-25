import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import { Edit, Add, Remove } from "@mui/icons-material";
import api from "../../../../ApiServices/api";

function ASNDialog({ open, onClose, editMode, currentASN }) {
  // State variables
  const [asnNumber, setAsnNumber] = useState("");
  const [loadingDate, setLoadingDate] = useState("");
  const [vesselETD, setVesselETD] = useState("");
  const [portShippingForm, setPortShippingForm] = useState("");
  const [comments, setComments] = useState("");
  const [selectedItemDetails, setSelectedItemDetails] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState("");
  const [itemQuantities, setItemQuantities] = useState({});
  const [vendorData, setVendorData] = useState([]);
  const [editableRowData, setEditableRowData] = useState({});
  const [expandedRows, setExpandedRows] = useState({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [status, setStatus] = useState("Ready to Ship");
  const [todayDate] = useState(new Date().toLocaleDateString());

  // Helper function to format date for input[type="date"]
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - offset * 60 * 1000);
    return adjustedDate.toISOString().split("T")[0];
  };

  // Reset form to initial state
  const resetForm = () => {
    setAsnNumber("");
    setLoadingDate("");
    setVesselETD("");
    setSelectedVendor("");
    setPortShippingForm("");
    setComments("");
    setSelectedItemDetails([]);
    setVendorData([]);
    setExpandedRows({});
    setEditableRowData({});
    setStatus("Ready to Ship");
  };

  // Initialize form data
  useEffect(() => {
    if (open) {
      if (editMode && currentASN && currentASN.asn) {
        // Edit mode - populate with currentASN data
        setAsnNumber(currentASN.asn.asnNumber || "");
        setLoadingDate(formatDateForInput(currentASN.asn.loadingDate) || "");
        setVesselETD(formatDateForInput(currentASN.asn.vesselETD) || "");
        setSelectedVendor(currentASN.workOrder_Id?.vendor?._id || "");
        setPortShippingForm(currentASN.asn.portShippingForm || "");
        setComments(currentASN.asn.comments || "");
        setStatus(currentASN.asn.status || "Ready to Ship");

        // Extract selected items from currentASN
        const selectedItems = currentASN.asn.selectedItemDetails || [];
        const selectedItemIds = Array.isArray(selectedItems)
          ? selectedItems.map((item) => item._id || item)
          : [];

        // Initialize quantities for each item
        const initialQuantities = {};
        selectedItems.forEach((item) => {
          initialQuantities[item._id || item] = item.quantity || 0;
        });
        setItemQuantities(initialQuantities);

        setSelectedItemDetails(selectedItemIds);

        if (currentASN.workOrder_Id?.vendor?._id) {
          fetchVendorData(currentASN.workOrder_Id.vendor._id, selectedItemIds);
        }
      } else {
        // Add mode - reset form and fetch next ASN number
        resetForm();
        fetchAsnnextnumber();
      }
    }
  }, [open, editMode, currentASN]);

  const isItemSelected = (itemId) => {
    return selectedItemDetails.includes(itemId);
  };

  // Handle quantity change for an item
  const handleQuantityChange = (itemId, quantity) => {
    setItemQuantities((prev) => ({
      ...prev,
      [itemId]: parseInt(quantity) || 0,
    }));
  };

  // Fetch next ASN number for new ASNs
  const fetchAsnnextnumber = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/asn/asn-next-number");
      setAsnNumber(response?.data?.nextASN || "");
    } catch (error) {
      showSnackbar("Error fetching ASN next number", "error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch all vendors
  const fetchVendors = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/vendors");
      setVendors(response.data || []);
    } catch (error) {
      showSnackbar("Error fetching vendors", "error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch vendor data including items
  const fetchVendorData = async (vendorId, selectedItems = []) => {
    setLoading(true);
    try {
      const response = await api.get(`/api/asn/vendor/${vendorId}`);
      const vendorItems = response.data.data || [];

      setVendorData(vendorItems);

      // If we have selected items (edit mode), ensure they're selected
      if (selectedItems.length > 0) {
        setSelectedItemDetails(selectedItems);
      }
    } catch (error) {
      showSnackbar("Error fetching vendor data", "error");
    } finally {
      setLoading(false);
    }
  };

  // Handle vendor selection change
  const handleVendorChange = async (e) => {
    const vendorId = e.target.value;
    setSelectedVendor(vendorId);
    setVendorData([]);
    await fetchVendorData(vendorId);
  };

  // Handle item selection
  const handleItemSelection = (itemId, checked) => {
    if (checked) {
      setSelectedItemDetails([...selectedItemDetails, itemId]);
    } else {
      setSelectedItemDetails(selectedItemDetails.filter((id) => id !== itemId));
    }
  };

  // Handle edit click for item details
  const handleEditClick = (index, row) => {
    setEditableRowData({
      quantity: row.quantity,
      cbm_per_unit: row.cbm_per_unit,
      weight: row.weight,
    });
    handleExpandClick(index);
  };

  // Toggle row expansion
  const handleExpandClick = (index) => {
    setExpandedRows((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Show snackbar notification
  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Handle save/update ASN
  const handleSaveClick = async () => {
    // Basic validation
    if (
      !loadingDate ||
      !vesselETD ||
      !selectedVendor ||
      !portShippingForm ||
      selectedItemDetails.length === 0
    ) {
      showSnackbar(
        "Please fill all required fields and select at least one item",
        "error"
      );
      return;
    }

    // Prepare selected items with quantities
    const itemsWithQuantities = selectedItemDetails.map((itemId) => ({
      _id: itemId,
      quantity: itemQuantities[itemId] || 0,
    }));

    const payload = {
      asnNumber,
      loadingDate,
      vesselETD,
      vendor: selectedVendor,
      portShippingForm,
      comments,
      selectedItemDetails: itemsWithQuantities,
      status: "Ready to Ship",
    };

    try {
      if (editMode && currentASN && currentASN.asn) {
        // Update existing ASN
        const response = await api.put(
          `/api/asn/update/${currentASN.asn._id}`,
          payload
        );
        showSnackbar("ASN updated successfully!", "success");
      } else {
        // Create new ASN
        const response = await api.post("/api/asn/create", payload);
        showSnackbar("ASN created successfully!", "success");
      }
      resetForm();
      onClose();
    } catch (error) {
      console.error("Error saving ASN:", error);
      let errorMsg = error.response?.data?.message || error.message;

      // Handle case where items are already in other ASNs
      if (error.response?.data?.usedItems) {
        errorMsg += `. Items already in use: ${error.response.data.usedItems.join(
          ", "
        )}`;
      }

      // Handle quantity validation errors
      if (error.response?.data?.invalidItem) {
        const item = vendorData.find(
          (i) => i._id === error.response.data.invalidItem
        );
        errorMsg += `. Invalid quantity for item ${
          item?.stylenumber?.number || error.response.data.invalidItem
        }`;
      }

      showSnackbar(`Error saving ASN: ${errorMsg}`, "error");
    }
  };

  // Close snackbar
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Close dialog and reset form
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Fetch vendors on component mount
  useEffect(() => {
    fetchVendors();
  }, []);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>{editMode ? "Edit ASN" : "New ASN"}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              margin="dense"
              label="ASN #"
              type="text"
              fullWidth
              variant="outlined"
              value={asnNumber}
              disabled
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              margin="dense"
              label="Created Date"
              type="text"
              fullWidth
              variant="outlined"
              disabled
              value={todayDate}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              margin="dense"
              label="Loading Date*"
              type="date"
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              value={loadingDate}
              onChange={(e) => setLoadingDate(e.target.value)}
              sx={{
                "& .MuiInputBase-root": {
                  position: "relative",
                },
                "& input[type='date']::-webkit-calendar-picker-indicator": {
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: "100%",
                  height: "100%",
                  opacity: 0,
                  cursor: "pointer",
                },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              margin="dense"
              label="Vessel ETD*"
              type="date"
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              value={vesselETD}
              onChange={(e) => setVesselETD(e.target.value)}
              sx={{
                "& .MuiInputBase-root": {
                  position: "relative",
                },
                "& input[type='date']::-webkit-calendar-picker-indicator": {
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: "100%",
                  height: "100%",
                  opacity: 0,
                  cursor: "pointer",
                },
              }}
            />
          </Grid>
        </Grid>

        <Grid container spacing={2} style={{ marginTop: "16px" }}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl variant="outlined" fullWidth margin="dense">
              <InputLabel id="vendor-select-label">Vendor*</InputLabel>
              <Select
                value={selectedVendor}
                onChange={handleVendorChange}
                label="Vendor*"
              >
                {loading ? (
                  <MenuItem>
                    <CircularProgress size={24} />
                  </MenuItem>
                ) : (
                  vendors.map((vendor) => (
                    <MenuItem key={vendor._id} value={vendor._id}>
                      {vendor.name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              margin="dense"
              label="Port Shipping From*"
              type="text"
              fullWidth
              variant="outlined"
              value={portShippingForm}
              onChange={(e) => setPortShippingForm(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth variant="outlined" margin="dense">
              <InputLabel>Status</InputLabel>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                label="Status"
                disabled
              >
                <MenuItem value="Ready to Ship">Ready to Ship</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              margin="dense"
              label="Comments"
              type="text"
              fullWidth
              variant="outlined"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
          </Grid>
        </Grid>

        <TableContainer component={Paper} style={{ marginTop: "16px" }}>
          {loading && vendorData.length === 0 ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "20px",
              }}
            >
              <CircularProgress />
            </div>
          ) : (
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Select</TableCell>
                  <TableCell>Expand</TableCell>
                  <TableCell>Order#</TableCell>
                  <TableCell>Vendor</TableCell>
                  <TableCell>Style#</TableCell>
                  <TableCell>Sample Status</TableCell>
                  <TableCell>Requested ETD</TableCell>
                  <TableCell>Qty Ordered</TableCell>
                  <TableCell>Available Ordered</TableCell>
                  <TableCell>Qty / Carton</TableCell>
                  <TableCell>Total Carton</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>CBM</TableCell>
                  <TableCell>Weight (KG)</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vendorData.map((row, index) => (
                  <React.Fragment key={index}>
                    <TableRow>
                      <TableCell>
                        <Checkbox
                          checked={isItemSelected(row._id)}
                          onChange={(e) =>
                            handleItemSelection(row._id, e.target.checked)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleExpandClick(index)}
                        >
                          {expandedRows[index] ? <Remove /> : <Add />}
                        </IconButton>
                      </TableCell>
                      <TableCell>{row.workOrder_Id?.workOrderId}</TableCell>
                      <TableCell>{row.workOrder_Id?.vendor?.name}</TableCell>
                      <TableCell>{row.stylenumber?.number}</TableCell>
                      <TableCell>
                        <div
                          style={{ display: "flex", flexDirection: "column" }}
                        >
                          <div>
                            <strong>Design:</strong>{" "}
                            {row.latestDesignApprovalStatus || "N/A"}
                            {row.latestDesignApprovalDate && (
                              <span
                                style={{
                                  color: "#666",
                                  fontSize: "0.8rem",
                                  marginLeft: "8px",
                                }}
                              >
                                (
                                {new Date(
                                  row.latestDesignApprovalDate
                                ).toLocaleDateString()}
                                )
                              </span>
                            )}
                          </div>
                          <div>
                            <strong>Fit:</strong>{" "}
                            {row.latestFitApprovalStatus || "N/A"}
                            {row.latestFitApprovalDate && (
                              <span
                                style={{
                                  color: "#666",
                                  fontSize: "0.8rem",
                                  marginLeft: "8px",
                                }}
                              >
                                (
                                {new Date(
                                  row.latestFitApprovalDate
                                ).toLocaleDateString()}
                                )
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {row.workOrder_Id?.etd
                          ? new Date(row.workOrder_Id.etd).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {row.quantity}
                        <IconButton
                          size="small"
                          onClick={() => handleEditClick(index, row)}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </TableCell>
                      <TableCell>{row.available_quantity}</TableCell>
                      {console.log(row, "row of selected item ")}
                      <TableCell>
                        {row.number_of_pieces_per_master_carton}
                      </TableCell>
                      <TableCell>{row.totalCarton}</TableCell>
                      <TableCell>{row.shippingStatus}</TableCell>
                      <TableCell>{row.cbm_per_unit}</TableCell>
                      <TableCell>{row.weight}</TableCell>
                    </TableRow>

                    {expandedRows[index] && (
                      <TableRow style={{ backgroundColor: "#f5f5f5" }}>
                        <TableCell colSpan={14}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Loading Date</TableCell>
                                <TableCell>Vessel ETD</TableCell>
                                <TableCell>Comments</TableCell>
                                <TableCell>Available Ordered</TableCell>
                                <TableCell>Total Carton</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>CBM</TableCell>
                                <TableCell>Weight (KG)</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              <TableRow>
                                <TableCell>{loadingDate || "N/A"}</TableCell>
                                <TableCell>{vesselETD || "N/A"}</TableCell>
                                <TableCell>{comments || "N/A"}</TableCell>
                              <TableCell>
  <TextField
    type="text"
    size="small"
    value={itemQuantities[row._id] || 0} // Initialize with 0 instead of row.quantity
    onChange={(e) =>
      handleQuantityChange(
        row._id,
        e.target.value
      )
    }
    inputProps={{
      min: 0,
      max: row.available_quantity === null
        ? row.quantity
        : row.available_quantity,
    }}
  />
  <div
    style={{
      fontSize: "0.75rem",
      color: "#666",
    }}
  >
    Available: {row.available_quantity === null
      ? row.quantity
      : row.available_quantity}
  </div>
</TableCell>
                                <TableCell>{row.totalCarton}</TableCell>
                                <TableCell>{status}</TableCell>
                                <TableCell>
                                  <TextField
                                    type="number"
                                    size="small"
                                    value={
                                      editableRowData.cbm_per_unit ||
                                      row.cbm_per_unit
                                    }
                                    onChange={(e) =>
                                      setEditableRowData({
                                        ...editableRowData,
                                        cbm_per_unit: e.target.value,
                                      })
                                    }
                                  />
                                </TableCell>
                                <TableCell>
                                  <TextField
                                    type="number"
                                    size="small"
                                    value={editableRowData.weight || row.weight}
                                    onChange={(e) =>
                                      setEditableRowData({
                                        ...editableRowData,
                                        weight: e.target.value,
                                      })
                                    }
                                  />
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={handleSaveClick} color="primary" variant="contained">
          {editMode ? "Update ASN" : "Create ASN"}
        </Button>
      </DialogActions>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
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
    </Dialog>
  );
}

export default ASNDialog;
