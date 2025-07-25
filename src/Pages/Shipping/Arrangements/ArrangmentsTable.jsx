import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Typography,
  Chip,
  Select,
  MenuItem,
  TextField,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Button,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import {
  Add as AddIcon,
  FileDownload as FileDownloadIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import "./ArrangmentTable.css";
import Navbar from "../../../Navbar/Navbar";
import ModalPdffile from "./ModalPdffile";
import ModalPdfwithPrice from "./ModalPdfwithPrice";
import api from "../../../ApiServices/api";
import { useNavigate } from "react-router-dom";

function ArrangementTable() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  const [selectedVendor, setSelectedVendor] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [arrangements, setArrangements] = useState([]);
  const [filters, setFilters] = useState({
    arranged: true,
    inTransit: true,
    received: true,
  });
  const [expandedRows, setExpandedRows] = useState({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [arrangementToDelete, setArrangementToDelete] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [modalData, setModalData] = useState([]);
  const [openModalWithPrice, setOpenModalWithPrice] = useState(false);
  const [modalDataWithPrice, setModalDataWithPrice] = useState([]);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/vendors");
      setVendors(response.data);
    } catch (error) {
      console.error("Error fetching vendors:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchArrangements = async (vendorId) => {
    if (!vendorId) return;
    setLoading(true);
    try {
      const response = await api.get(`/api/arrangements/vendor/${vendorId}`);
      setArrangements(response.data.data || []);
    } catch (error) {
      console.error("Error fetching arrangements:", error);
      setArrangements([]);
       if (error?.message && error?.message?.includes("Unauthorized")) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    if (selectedVendor) {
      fetchArrangements(selectedVendor);
    } else {
      setArrangements([]);
    }
  }, [selectedVendor]);

  const handleVendorChange = (e) => {
    setSelectedVendor(e.target.value);
    setExpandedRows({});
  };

  const handleExpandRow = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getStatusChip = (status) => {
    const colors = {
      Arranged: "info",
      "In Transit": "primary",
      Received: "success",
      "Arranged/Not Yet Shipped": "warning",
      "Ready to Ship": "secondary",
    };
    return <Chip label={status} color={colors[status]} size="small" />;
  };

  const filteredArrangements = arrangements.filter((arrangement) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      arrangement.arrangementNumber.toLowerCase().includes(searchLower) ||
      arrangement.destination.toLowerCase().includes(searchLower);

    const selectedStatuses = [];
    if (filters.arranged) selectedStatuses.push("Arranged/Not Yet Shipped");
    if (filters.inTransit) selectedStatuses.push("In Transit");
    if (filters.received) selectedStatuses.push("Received");

    const matchesStatus =
      selectedStatuses.length > 0 &&
      selectedStatuses.includes(arrangement.shippingStatus);

    return matchesSearch && matchesStatus;
  });

  const calculateTotals = () => {
    let qtyOrdered = 0;
    let shippingQty = 0;
    let totalCBM = 0;
    let masterPackQty = 0;
    let totalAmount = 0;

    filteredArrangements.forEach((arrangement) => {
      arrangement.selectedASN.forEach((asn) => {
        asn.selectedItemDetails.forEach((item) => {
          qtyOrdered += item.quantity;
          shippingQty += item.quantity;
          totalCBM += item.total_cbm;
          masterPackQty += item.number_of_master_polybags_per_master_carton;

          // Calculate amount if unit price exists
          if (item.work_order_quotes?.[0]?.unitPrice) {
            totalAmount += item.work_order_quotes[0].unitPrice * item.quantity;
          }
        });
      });
    });

    return { qtyOrdered, shippingQty, totalCBM, masterPackQty, totalAmount };
  };

  const totals = calculateTotals();

  const handleDeleteClick = (arrangementId) => {
    setArrangementToDelete(arrangementId);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!arrangementToDelete) return;

    try {
      await api.delete(`/api/arrangements/${arrangementToDelete}`);
      if (selectedVendor) {
        fetchArrangements(selectedVendor);
      }
      setDeleteModalOpen(false);
      setArrangementToDelete(null);
    } catch (error) {
      console.error("Error deleting arrangement:", error);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setArrangementToDelete(null);
  };

  const userRole = localStorage.getItem("role");

  return (
    <>
      <Navbar />
      <Box sx={{ p: 3 }}>
        <Paper elevation={2}>
          <Box>
            <Typography variant="h6" sx={{ background: "#d2f1ff", pl: 2 }}>
              Arrangements
            </Typography>

            <Box
              sx={{
                display: "flex",
                gap: 2,
                alignItems: "center",
                background: "#d2f1ff",
                pl: 2,
                flexWrap: "wrap",
                pt: 1,
                pb: 1,
              }}
            >
              <Select
                value={selectedVendor}
                onChange={handleVendorChange}
                label="Vendor"
                displayEmpty
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="">Select Vendor</MenuItem>
                {loading ? (
                  <MenuItem disabled>
                    <CircularProgress size={24} />
                  </MenuItem>
                ) : (
                  vendors?.map((vendor) => (
                    <MenuItem key={vendor?._id} value={vendor?._id}>
                      {vendor?.name}
                    </MenuItem>
                  ))
                )}
              </Select>

              <TextField
                placeholder="Search by Arrangement # or Destination"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                sx={{ minWidth: 250 }}
              />

              <Box sx={{ display: "flex", gap: 1 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters?.arranged}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          arranged: e.target.checked,
                        }))
                      }
                    />
                  }
                  label="Arranged"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters?.inTransit}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          inTransit: e.target.checked,
                        }))
                      }
                    />
                  }
                  label="In Transit"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters?.received}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          received: e.target.checked,
                        }))
                      }
                    />
                  }
                  label="Received"
                />
              </Box>
            </Box>

            <TableContainer
              sx={{
                maxHeight: 600,
                position: "relative",
                overflowX: "auto",
              }}
              className="table_container_arrangmenttable"
            >
              <Table stickyHeader sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" />
                    <TableCell>Arrangement #</TableCell>
                    <TableCell>Ship Date</TableCell>
                    <TableCell>Arrival Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Destination</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredArrangements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        {loading ? (
                          <CircularProgress size={24} />
                        ) : (
                          "No Data Available"
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredArrangements?.map((arrangement) => (
                      <React.Fragment key={arrangement?._id}>
                        <TableRow>
                          <TableCell padding="checkbox">
                            <IconButton
                              size="small"
                              onClick={() => handleExpandRow(arrangement?._id)}
                              className="red-button"
                            >
                              {expandedRows[arrangement?._id] ? "-" : "+"}
                            </IconButton>
                          </TableCell>
                          <TableCell>
                            {arrangement?.arrangementNumber}
                          </TableCell>
                          <TableCell>
                            {new Date(
                              arrangement?.shipDate
                            ).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {new Date(
                              arrangement?.arrivalDate
                            ).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {getStatusChip(arrangement?.shippingStatus)}
                          </TableCell>
                          <TableCell>{arrangement?.destination}</TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              display: "flex",
                              justifyContent: "center",
                              gap: 1,
                            }}
                          >
                            <Tooltip title="Download PDF" arrow>
                              <IconButton
                                color="warning"
                                size="small"
                                onClick={() => {
                                  setModalData(arrangement);
                                  setOpenModal(true);
                                }}
                              >
                                <FileDownloadIcon />
                              </IconButton>
                            </Tooltip>
                            {userRole === "admin" && (
                              <>
                                <Tooltip title="Download PDF with Price" arrow>
                                  <IconButton
                                    color="primary"
                                    size="small"
                                    onClick={() => {
                                      setModalDataWithPrice(arrangement);
                                      setOpenModalWithPrice(true);
                                    }}
                                  >
                                    <FileDownloadIcon />
                                  </IconButton>
                                </Tooltip>

                                <Tooltip title="Delete Arrangement" arrow>
                                  <IconButton
                                    color="error"
                                    size="small"
                                    onClick={() =>
                                      handleDeleteClick(arrangement._id)
                                    }
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                        {expandedRows[arrangement?._id] && (
                          <TableRow>
                            <TableCell colSpan={7} sx={{ p: 0 }}>
                              <Box sx={{ overflowX: "auto" }}>
                                <Table size="small" sx={{ minWidth: 1800 }}>
                                  <TableHead sx={{ background: "#f1e0f3" }}>
                                    <TableRow>
                                      <TableCell>ASN #</TableCell>
                                      <TableCell>Contract #</TableCell>
                                      <TableCell>Order #</TableCell>
                                      <TableCell>Vendor</TableCell>
                                      <TableCell>Style #</TableCell>
                                      <TableCell>Sample Status</TableCell>
                                      <TableCell>Loading Date</TableCell>
                                      <TableCell>Vessel ETD</TableCell>
                                      <TableCell>Unit Price</TableCell>
                                      <TableCell>Amount</TableCell>
                                      <TableCell>Qty Ordered</TableCell>
                                      <TableCell>Shipping Qty</TableCell>
                                      <TableCell>CBM</TableCell>
                                      <TableCell>Inner Pack</TableCell>
                                      <TableCell>Master Pack Qty</TableCell>
                                      <TableCell>Ticketed</TableCell>
                                      <TableCell>ASN Comments</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {arrangement?.selectedASN?.map((asn) =>
                                      asn?.selectedItemDetails?.map(
                                        (item, itemIndex) => (
                                          <TableRow
                                            key={`${asn?._id}-${itemIndex}`}
                                          >
                                            <TableCell>
                                              {asn?.asnNumber}
                                            </TableCell>
                                            <TableCell>
                                              {item?.customer_po_number || "-"}
                                            </TableCell>
                                            <TableCell>
                                              {item?.workOrder_Id
                                                ?.workOrderId || "-"}
                                            </TableCell>
                                            <TableCell>
                                              {asn?.vendor?.name || "-"}
                                            </TableCell>

                                            <TableCell>
                                              {item?.style_number || "-"}
                                            </TableCell>
                                            <TableCell>
                                              {item?.workOrder_Id?.sampleStatus?.join(
                                                ", "
                                              ) || "-"}
                                            </TableCell>
                                            <TableCell>
                                              {asn?.loadingDate
                                                ? new Date(
                                                    asn.loadingDate
                                                  ).toLocaleDateString()
                                                : "-"}
                                            </TableCell>
                                            <TableCell>
                                              {asn?.vesselETD
                                                ? new Date(
                                                    asn.vesselETD
                                                  ).toLocaleDateString()
                                                : "-"}
                                            </TableCell>
                                            <TableCell>
                                              {item?.work_order_quotes?.[0]
                                                ?.unitPrice
                                                ? `$${item.work_order_quotes[0].unitPrice.toFixed(
                                                    2
                                                  )}`
                                                : "-"}
                                            </TableCell>
                                            <TableCell>
                                              {item?.work_order_quotes?.[0]
                                                ?.unitPrice && item?.quantity
                                                ? `$${(
                                                    item.work_order_quotes[0]
                                                      .unitPrice * item.quantity
                                                  ).toFixed(2)}`
                                                : "-"}
                                            </TableCell>
                                            <TableCell>
                                              {item?.quantity || "-"}
                                            </TableCell>
                                            <TableCell>
                                              {item?.quantity || "-"}
                                            </TableCell>
                                            <TableCell>
                                              {item?.total_cbm || "-"}
                                            </TableCell>
                                            <TableCell>
                                              {item?.number_of_pieces_per_master_carton ||
                                                "-"}
                                            </TableCell>
                                            <TableCell>
                                              {item?.number_of_master_polybags_per_master_carton ||
                                                "-"}
                                            </TableCell>
                                            <TableCell>
                                              {item?.price_tickets
                                                ? "Yes"
                                                : "No"}
                                            </TableCell>
                                            <TableCell>
                                              {asn?.comments || "-"}
                                            </TableCell>
                                          </TableRow>
                                        )
                                      )
                                    )}
                                  </TableBody>
                                </Table>
                              </Box>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Footer */}
            <Box
              sx={{
                position: "sticky",
                bottom: 0,
                zIndex: 1,
                mt: 2,
                p: 2,
                borderTop: 1,
                borderColor: "divider",
                background: "#d2f1ff",
              }}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
                  gap: 4,
                  alignItems: "center",
                  height: "auto",
                }}
              >
                <Typography variant="subtitle2">
                  Totals (Arranged / In Transit)
                </Typography>
                <Typography variant="body2">
                  Qty Ordered: {totals?.qtyOrdered}
                </Typography>
                <Typography variant="body2">
                  Shipping Qty: {totals?.shippingQty}
                </Typography>
                <Typography variant="body2">CBM: {totals?.totalCBM}</Typography>
                <Typography variant="body2">
                  Master Pack Qty: {totals?.masterPackQty}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
                  gap: 4,
                  alignItems: "center",
                  height: "auto",
                  borderTop: 1,
                  borderColor: "divider",
                  pt: 1,
                }}
              >
                <Typography variant="subtitle2">
                  Totals (Ready to Ship)
                </Typography>
                <Typography variant="body2">
                  Qty Ordered: {totals?.qtyOrdered}
                </Typography>
                <Typography variant="body2">
                  Qty Ready to Ship: {totals?.shippingQty}
                </Typography>
                <Typography variant="body2">CBM: {totals?.totalCBM}</Typography>
                <Typography variant="body2">
                  Master Pack Qty: {totals?.masterPackQty}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
                  gap: 4,
                  alignItems: "center",
                  height: "auto",
                  borderTop: 1,
                  borderColor: "divider",
                  pt: 1,
                }}
              >
                <Typography variant="subtitle2">Totals (Open)</Typography>
                <Typography variant="body2">
                  Qty Ordered: {totals?.qtyOrdered}
                </Typography>
                <Typography variant="body2">
                  Qty Open: {totals?.shippingQty}
                </Typography>
                <Typography variant="body2">CBM: {totals?.totalCBM}</Typography>
                <Typography variant="body2">
                  Master Pack Qty: {totals?.masterPackQty}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>

      <ModalPdffile
        open={openModal}
        data={modalData}
        onClose={() => setOpenModal(false)}
      />

      <ModalPdfwithPrice
        open={openModalWithPrice}
        data={modalDataWithPrice}
        onClose={() => setOpenModalWithPrice(false)}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteModalOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Delete Arrangement?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this arrangement? This action cannot
            be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default ArrangementTable;
