import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  TableSortLabel,
  Box,
  Tooltip,
  IconButton,
  Popover,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import Navbar from "../../../Navbar/Navbar";
import ASNDialog from "../Modal/Shipping/ASNDialog";
import ArrangementDialog from "../Modal/Arrangement/ArrangementDialog";
import axios from "axios";
import { cleanDigitSectionValue } from "@mui/x-date-pickers/internals/hooks/useField/useField.utils";
import api from "../../../ApiServices/api";
import { useNavigate } from "react-router-dom";
import { sortByColumn } from "../../../utils/sortUtils";
import DescriptionIcon from "@mui/icons-material/Description"; // Notepad icon
import LocalShippingIcon from "@mui/icons-material/LocalShipping"; // Truck icon
import {
  ArrowDropDown as ArrowDropDownIcon,
  Edit as EditIcon,
} from "@mui/icons-material";

const StyledButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(1),
}));

const statusOptions = [
  { name: "open", label: "Open", apiValue: "open" },
  { name: "readyToShip", label: "Ready to Ship", apiValue: "Ready to Ship" },
  {
    name: "Arranged/Not Yet Shipped",
    label: "Arranged/Not Yet Shipped",
    apiValue: "Arranged/Not Yet Shipped",
  },
  { name: "inTransit", label: "In Transit", apiValue: "In Transit" },
  { name: "received", label: "Received", apiValue: "Received" },
];

const columnToKeyMap = {
  "Order #": {
    key: "workOrder_Id.workOrderId",
    type: "string",
  },
  "Style #": {
    key: "style_number",
    type: "string",
  },
  Client: {
    key: "client_Id.name",
    type: "string",
  },
  "Sample Status": {
    key: "work_order_quotes[0].status",
    type: "string",
  },
  "Qty Ordered": {
    key: "quantity",
    type: "string",
  },
  "Qty / Carton": {
    key: "number_of_pieces_per_master_carton",
    type: "string",
  },
  "Total Cartons": {
    key: "",
    type: "string",
  },
  CBM: {
    key: "total_cbm",
    type: "string",
  },
  Vendor: {
    key: "workOrder_Id.vendor.name",
    type: "string",
  },
  ETD: {
    key: "workOrder_Id.etd",
    type: "date",
  },
  "ASN #": {
    key: "",
    type: "string",
  },
  "Ship - Arrival Date": {
    key: "",
    type: "date",
  },
  Status: {
    key: "status",
    type: "string",
  },
};

const columns = Object.keys(columnToKeyMap);

const ShippingTable = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  const [openASNDialog, setOpenASNDialog] = useState(false);
  const [openArrangementDialog, setOpenArrangementDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editArrangementMode, setEditArrangementMode] = useState(false);
  const [currentASN, setCurrentASN] = useState(null);
  const [currentArrangement, setCurrentArrangement] = useState(null);

  const [sortOrder, setSortOrder] = useState("asc");
  const toggleSortOrder = () => {
    setSortOrder((order) => (order == "asc" ? "desc" : "asc"));
  };

  const [selectedColumn, setSelectedColumn] = useState(columns[0]);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [sortedData, setSortedData] = useState([]);

  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    status: [],
    etdFrom: "",
    etdTo: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/work-orders/itemdetail/filters`);
      setData(response.data.data || []);
      setFilteredData(response.data.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setData([]);
      setFilteredData([]);
      if (error?.message && error?.message?.includes("Unauthorized")) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Apply filters whenever filters or data changes
  useEffect(() => {
    const applyFilters = () => {
      let result = [...data];

      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        result = result.filter((item) => {
          // Check all fields that are displayed in the table
          const orderNumber = item.workOrder_Id?.workOrderId?.toLowerCase() || "";
          const styleNumber = item.stylenumber?.number?.toLowerCase() || "";
          const clientName = item.client_Id?.name?.toLowerCase() || "";
          const designStatus = item.latestDesignApprovalStatus?.toLowerCase() || "";
          const fitStatus = item.latestFitApprovalStatus?.toLowerCase() || "";
          const quantity = item.quantity?.toString() || "";
          const piecesPerCarton = item.number_of_pieces_per_master_carton?.toString() || "";
          const totalCartons = (item.quantity / item.number_of_pieces_per_master_carton)?.toString() || "";
          const cbm = item.total_cbm?.toString() || "";
          const vendorName = item.workOrder_Id?.vendor?.name?.toLowerCase() || "";
          const etd = item.workOrder_Id?.etd ? new Date(item.workOrder_Id.etd).toLocaleDateString().toLowerCase() : "";
          const asnNumber = item.asn?.asnNumber?.toLowerCase() || "";
          const shipDate = item.arrangement?.shipDate ? new Date(item.arrangement.shipDate).toLocaleDateString().toLowerCase() : "";
          const arrivalDate = item.arrangement?.arrivalDate ? new Date(item.arrangement.arrivalDate).toLocaleDateString().toLowerCase() : "";
          const shippingStatus = item.shippingStatus?.toLowerCase() || "";

          return (
            orderNumber.includes(searchTerm) ||
            styleNumber.includes(searchTerm) ||
            clientName.includes(searchTerm) ||
            designStatus.includes(searchTerm) ||
            fitStatus.includes(searchTerm) ||
            quantity.includes(searchTerm) ||
            piecesPerCarton.includes(searchTerm) ||
            totalCartons.includes(searchTerm) ||
            cbm.includes(searchTerm) ||
            vendorName.includes(searchTerm) ||
            etd.includes(searchTerm) ||
            asnNumber.includes(searchTerm) ||
            shipDate.includes(searchTerm) ||
            arrivalDate.includes(searchTerm) ||
            shippingStatus.includes(searchTerm)
          );
        });
      }

      // Status filter
      if (filters.status.length > 0) {
        const statusValues = filters.status.map((statusName) => {
          const option = statusOptions.find((opt) => opt.name === statusName);
          return option ? option.apiValue : statusName;
        });
        result = result.filter((item) =>
          statusValues.includes(item.shippingStatus)
        );
      }

      // Date range filter
      if (filters.etdFrom || filters.etdTo) {
        result = result.filter((item) => {
          if (!item.workOrder_Id?.etd) return false;

          const etdDate = new Date(item.workOrder_Id.etd);
          const fromDate = filters.etdFrom ? new Date(filters.etdFrom) : null;
          const toDate = filters.etdTo ? new Date(filters.etdTo) : null;

          if (fromDate && etdDate < fromDate) return false;
          if (toDate && etdDate > toDate) return false;

          return true;
        });
      }

      setFilteredData(result);
    };

    applyFilters();
  }, [data, filters]);

  // Apply sorting whenever filtered data, sort column or order changes
  useEffect(() => {
    setSortedData(
      sortByColumn(filteredData, columnToKeyMap[selectedColumn], sortOrder)
    );
  }, [filteredData, selectedColumn, sortOrder]);

  const handleOpenASNDialog = () => {
    setEditMode(false);
    setOpenASNDialog(true);
  };

  const handleCloseASNDialog = () => {
    setOpenASNDialog(false);
    fetchData();
  };

  const handleEditASN = (asn) => {
    setEditMode(true);
    setCurrentASN(asn);
    setOpenASNDialog(true);
  };

  const handleEditArrangement = (arrangement) => {
    setEditArrangementMode(true);
    setCurrentArrangement(arrangement);
    setOpenArrangementDialog(true);
  };

  const handleOpenArrangementDialog = () => {
    setEditArrangementMode(false);
    setOpenArrangementDialog(true);
  };

  const handleCloseArrangementDialog = () => {
    setOpenArrangementDialog(false);
    fetchData();
  };

  const handleSearchChange = (e) => {
    setFilters({ ...filters, search: e.target.value });
  };

  const handleCheckboxChange = (statusName) => (e) => {
    setFilters((prev) => {
      const newStatus = e.target.checked
        ? [...prev.status, statusName]
        : prev.status.filter((s) => s !== statusName);
      return { ...prev, status: newStatus };
    });
  };

  const handleDateChange = (field) => (e) => {
    setFilters({ ...filters, [field]: e.target.value });
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      status: [],
      etdFrom: "",
      etdTo: "",
    });
  };
  const userRole = localStorage.getItem("role");

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event, row) => {
    setSelectedRow(row);
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSelectedRow(null);
  };

  const [arrangementAnchorEl, setArrangementAnchorEl] = useState(null);
  const [arrangementData, setArrangementData] = useState([]);
  const [arrangementLoading, setArrangementLoading] = useState(false);

  const handleArrangementClick = async (event, row) => {
    setSelectedRow(row);
    setArrangementAnchorEl(event.currentTarget);
    setArrangementLoading(true);

    try {
      const response = await api.get(
        `/api/arrangements/getArrangementsByAsn/${row.asn._id}`
      );
      setArrangementData(response.data.data || []);
    } catch (error) {
      console.error("Error fetching arrangements:", error);
      setArrangementData([]);
    } finally {
      setArrangementLoading(false);
    }
  };

  const handleArrangementClose = () => {
    setArrangementAnchorEl(null);
    setArrangementData([]);
  };
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div>
      <Navbar />
      <div style={{ padding: "20px" }}>
        <div style={{ border: "1px solid #f6f6f6" }}>
          <div
            style={{
              top: 0,
              zIndex: 1,
              padding: "10px 0",
              border: "1px solid #f6f6f6",
              boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.1)",
              backgroundColor: "#f6f6f6",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "start",
                alignItems: "center",
                gap: "10px",
                padding: "0 20px",
                flexWrap: "wrap",
              }}
            >
              {userRole !== "read_only" && (
                <StyledButton
                  variant="contained"
                  color="primary"
                  onClick={handleOpenASNDialog}
                >
                  + Add ASN
                </StyledButton>
              )}

              {(userRole === "admin" || userRole === "general") && (
                <StyledButton
                  variant="contained"
                  color="primary"
                  onClick={handleOpenArrangementDialog}
                >
                  + Add Arrangements
                </StyledButton>
              )}

              <TextField
                placeholder="Search"
                variant="outlined"
                size="small"
                value={filters.search}
                onChange={handleSearchChange}
                style={{ minWidth: "300px" }}
              />

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "15px",
                  flexWrap: "wrap",
                }}
              >
                {statusOptions.map((option) => (
                  <FormControlLabel
                    key={option.name}
                    control={
                      <Checkbox
                        name={option.name}
                        checked={filters.status.includes(option.name)}
                        onChange={handleCheckboxChange(option.name)}
                        size="small"
                      />
                    }
                    label={option.label}
                  />
                ))}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginLeft: "15px",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <span>ETD from</span>
                  <TextField
                    type="date"
                    variant="outlined"
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    style={{ width: "150px" }}
                    value={filters.etdFrom}
                    onChange={handleDateChange("etdFrom")}
                  />
                  <span>to</span>
                  <TextField
                    type="date"
                    variant="outlined"
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    style={{ width: "150px" }}
                    value={filters.etdTo}
                    onChange={handleDateChange("etdTo")}
                  />
                </div>
                <StyledButton
                  variant="outlined"
                  color="secondary"
                  size="small"
                  onClick={handleResetFilters}
                >
                  Reset Filters
                </StyledButton>
              </div>
            </div>
          </div>

          <TableContainer
            component={Paper}
            style={{
              overflowX: "auto",
              minHeight: "400px",
              position: "relative",
            }}
          >
            {loading && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "rgba(255, 255, 255, 0.7)",
                  zIndex: 10,
                }}
              >
                <CircularProgress />
              </div>
            )}

            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  {columns.map((header) => (
                    <TableCell
                      key={header}
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "#f4f6f8",
                        color: "#5c6bc0",
                      }}
                    >
                      <TableSortLabel
                        active={selectedColumn === header}
                        onClick={() => {
                          if (selectedColumn == header) {
                            toggleSortOrder();
                          } else {
                            setSelectedColumn(header);
                          }
                        }}
                        direction={sortOrder}
                      >
                        {header}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      backgroundColor: "#f4f6f8",
                      color: "#5c6bc0",
                    }}
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedData?.map((item, index) => (
                  <>
                    <TableRow key={index}>
                      <TableCell>{item?.workOrder_Id?.workOrderId}</TableCell>
                      <TableCell>{item?.stylenumber?.number}</TableCell>
                      <TableCell>{item?.client_Id?.name}</TableCell>
                      <TableCell>
                        {`Design ${item?.latestDesignApprovalStatus || "N/A"}`}
                        {item?.latestDesignApprovalDate
                          ? ` on ${new Date(
                              item.latestDesignApprovalDate
                            ).toLocaleDateString()}`
                          : ""}
                        <br />
                        {`Fit ${item?.latestFitApprovalStatus || "N/A"}`}
                        {item?.latestFitApprovalDate
                          ? ` on ${new Date(
                              item.latestFitApprovalDate
                            ).toLocaleDateString()}`
                          : ""}
                      </TableCell>
                      <TableCell>{item?.quantity}</TableCell>
                      <TableCell>
                        {item?.number_of_pieces_per_master_carton}
                      </TableCell>
                      <TableCell>
                        {item?.quantity /
                          item?.number_of_pieces_per_master_carton}
                      </TableCell>
                      <TableCell>{item?.total_cbm}</TableCell>
                      <TableCell>{item?.workOrder_Id?.vendor?.name}</TableCell>
                      <TableCell>
                        {item?.workOrder_Id?.etd
                          ? new Date(
                              item?.workOrder_Id?.etd
                            )?.toLocaleDateString()
                          : ""}
                      </TableCell>
                      <TableCell>{item?.asn?.asnNumber}</TableCell>
                      <TableCell>
                        {item?.arrangement
                          ? new Date(
                              item?.arrangement?.shipDate
                            )?.toLocaleDateString()
                          : null}{" "}
                        {item?.arrangement ? "- " : null}
                        {item?.arrangement
                          ? new Date(
                              item?.arrangement?.arrivalDate
                            )?.toLocaleDateString()
                          : null}
                      </TableCell>
                      <TableCell>{item?.shippingStatus}</TableCell>
                      <TableCell>
                        <Box display="flex" gap={2} alignItems="center">
                          {item?.asn && (
                            <Box
                              sx={{
                                display: "flex",
                                bgcolor: "primary.light",
                                borderRadius: 2,
                                p: 0.5,
                                "& .MuiIconButton-root:hover": {
                                  bgcolor: "primary.main",
                                  "& svg": {
                                    color: "common.white",
                                  },
                                },
                              }}
                            >
                              <Tooltip title="Edit ASN">
                                <IconButton
                                  aria-label="edit ASN"
                                  onClick={() => handleEditASN(item)}
                                  size="medium"
                                  color="primary"
                                  sx={{
                                    "& svg": {
                                      fontSize: "1.2rem",
                                      fontWeight: "bold",
                                    },
                                  }}
                                  disabled={
                                    item?.arrangement && userRole === "vendor"
                                  }
                                >
                                  <DescriptionIcon sx={{ ml: 0.5 }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="View ASN Details">
                                <IconButton
                                  aria-label="show ASN details"
                                  onClick={(e) => handleClick(e, item)}
                                  size="medium"
                                  color="primary"
                                  sx={{
                                    "& svg": {
                                      fontSize: "1.4rem",
                                      transform: "translateY(1px)",
                                    },
                                  }}
                                >
                                  <ArrowDropDownIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          )}

                          {item?.arrangement && (
                            <Box
                              sx={{
                                display: "flex",
                                bgcolor: "secondary.light",
                                borderRadius: 2,
                                p: 0.5,
                                "& .MuiIconButton-root:hover": {
                                  bgcolor: "secondary.main",
                                  "& svg": {
                                    color: "common.white",
                                  },
                                },
                              }}
                            >
                              <Tooltip title="Edit Arrangement">
                                <IconButton
                                  aria-label="edit arrangement"
                                  onClick={() => handleEditArrangement(item)}
                                  size="medium"
                                  color="secondary"
                                  sx={{
                                    "& svg": {
                                      fontSize: "1.2rem",
                                      fontWeight: "bold",
                                    },
                                  }}
                                >
                                  <LocalShippingIcon sx={{ ml: 0.5 }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="View Arrangement Details">
                                <IconButton
                                  aria-label="show arrangement details"
                                  onClick={(e) =>
                                    handleArrangementClick(e, item)
                                  }
                                  size="medium"
                                  color="secondary"
                                  sx={{
                                    "& svg": {
                                      fontSize: "1.4rem",
                                      transform: "translateY(1px)",
                                    },
                                  }}
                                >
                                  <ArrowDropDownIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>

                    <Popover
                      open={open}
                      anchorEl={anchorEl}
                      onClose={handleClose}
                      anchorOrigin={{
                        vertical: "bottom",
                        horizontal: "right",
                      }}
                      transformOrigin={{
                        vertical: "top",
                        horizontal: "right",
                      }}
                      PaperProps={{
                        style: {
                          width: "800px",
                          maxHeight: "500px",
                          overflow: "auto",
                          padding: "16px",
                        },
                      }}
                    >
                      {selectedRow && (
                        <div>
                          <h3 style={{ marginBottom: "16px" }}>
                            ASN Details: {selectedRow?.asn?.asnNumber || "N/A"}
                          </h3>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ fontWeight: "bold" }}>
                                  ASN Number
                                </TableCell>
                                <TableCell sx={{ fontWeight: "bold" }}>
                                  Created Date
                                </TableCell>
                                <TableCell sx={{ fontWeight: "bold" }}>
                                  Loading Date
                                </TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              <TableRow>
                                <TableCell>
                                  {selectedRow?.asn?.asnNumber || "N/A"}
                                </TableCell>
                                <TableCell>
                                  {formatDate(selectedRow?.asn?.createdAt)}
                                </TableCell>
                                <TableCell>
                                  {formatDate(selectedRow?.asn?.loadingDate)}
                                </TableCell>
                              </TableRow>
                              <TableRow></TableRow>
                              <TableRow></TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </Popover>

                    <Popover
                      open={Boolean(arrangementAnchorEl)}
                      anchorEl={arrangementAnchorEl}
                      onClose={handleArrangementClose}
                      anchorOrigin={{
                        vertical: "bottom",
                        horizontal: "right",
                      }}
                      transformOrigin={{
                        vertical: "top",
                        horizontal: "right",
                      }}
                      PaperProps={{
                        style: {
                          width: "800px",
                          maxHeight: "500px",
                          overflow: "auto",
                          padding: "16px",
                        },
                      }}
                    >
                      <div>
                        <h3 style={{ marginBottom: "16px" }}>
                          Arrangement Details for:{" "}
                          {selectedRow?.arrangement?.arrangementNumber || "N/A"}
                        </h3>

                        {arrangementLoading ? (
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "center",
                              padding: "20px",
                            }}
                          >
                            <CircularProgress />
                          </div>
                        ) : arrangementData.length === 0 ? (
                          <p>No arrangement data found</p>
                        ) : (
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ fontWeight: "bold" }}>
                                  Arrangement #
                                </TableCell>
                                <TableCell sx={{ fontWeight: "bold" }}>
                                  Ship Date
                                </TableCell>
                                <TableCell sx={{ fontWeight: "bold" }}>
                                  Arrival Date
                                </TableCell>
                                <TableCell sx={{ fontWeight: "bold" }}>
                                  Shipping Status
                                </TableCell>
                                <TableCell sx={{ fontWeight: "bold" }}>
                                  Quantity (Arranged)
                                </TableCell>
                                <TableCell sx={{ fontWeight: "bold" }}>
                                  Actions
                                </TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {arrangementData.map((arrangement, index) => (
                                <TableRow key={index}>
                                  <TableCell>
                                    {arrangement.arrangementNumber}
                                  </TableCell>
                                  <TableCell>
                                    {formatDate(arrangement.shipDate)}
                                  </TableCell>
                                  <TableCell>
                                    {formatDate(arrangement.arrivalDate)}
                                  </TableCell>
                                  <TableCell>
                                    {arrangement.shippingStatus}
                                  </TableCell>
                                  <TableCell>
                                    {
                                      arrangement.selectedASN[0]
                                        ?.selectedItemDetails[0]?.quantity
                                    }
                                  </TableCell>
                                  <TableCell>
                                    <IconButton
                                      aria-label="edit arrangement"
                                       onClick={() => handleEditArrangement(item)}
                                      size="small"
                                      color="primary"
                                    >
                                      <EditIcon />
                                    </IconButton>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </div>
                    </Popover>
                  </>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </div>

      <ASNDialog
        open={openASNDialog}
        onClose={handleCloseASNDialog}
        editMode={editMode}
        currentASN={currentASN}
      />
      <ArrangementDialog
        open={openArrangementDialog}
        onClose={handleCloseArrangementDialog}
        editMode={editArrangementMode}
        currentArrangement={currentArrangement}
      />
    </div>
  );
};

export default ShippingTable;