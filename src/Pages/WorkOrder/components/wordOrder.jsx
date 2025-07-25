import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  Button,
  Typography,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Checkbox,
  ListItemText,
} from "@mui/material";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ReplayIcon from "@mui/icons-material/Replay";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import LoopIcon from "@mui/icons-material/Loop";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Box,
  Pagination,
  TextField,
  TableSortLabel,
} from "@mui/material";
import AddWorkOrder from "../../TechPack/Modals/WorkOrder/addWorkOrder";
import Navbar from "../../../Navbar/Navbar";
import "./workorderstyle.css";
import api from "../../../ApiServices/api";
import { sortByColumn } from "../../../utils/sortUtils";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 1000,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
};
const confirmModalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  borderRadius: "4px",
  boxShadow: 24,
  p: 4,
};

const columnToKeyMap = {
  "Order#": {
    key: "workOrderId",
    type: "string",
  },
  "Style#": {
    key: "stylenumber",
    type: "array",
  },
  "Customer PO#": {
    key: "customer_po_number",
    type: "string",
  },
  "Sample Status": {
    key: "sampleStatus",
    type: "array",
  },
  Vendor: {
    key: "vendor.name",
    type: "string",
  },
  "Shipping Status": {
    key: "shippingStatus",
    type: "array",
  },
  "Date Created": {
    key: "createdAt",
    type: "date",
  },
  ETD: {
    key: "etd",
    type: "date",
  },
};

// Format date for display (DD-MM-YYYY)
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

// Convert search date from DD-MM-YYYY to YYYY-MM-DD
const convertSearchDate = (dateString) => {
  if (!dateString) return "";
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
    const [day, month, year] = dateString.split("-");
    return `${year}-${month}-${day}`;
  }
  return dateString;
};

const columns = Object.keys(columnToKeyMap);

const WorkOrder = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  const [styleId, setStyleId] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [subcategories, setSubcategories] = useState([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [itemTypes, setItemTypes] = useState([]);
  const [selectedItemType, setSelectedItemType] = useState("");
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [fromCreatedDate, setFromCreatedDate] = useState("");
  const [toCreatedDate, setToCreatedDate] = useState("");
  const [fromETDDate, setFromETDDate] = useState("");
  const [toETDDate, setToETDDate] = useState("");
  const [selectedDesignStatus, setSelectedDesignStatus] = useState([]);
  const [selectedFitStatus, setSelectedFitStatus] = useState([]);
  const [selectedShippingStatus, setSelectedShippingStatus] = useState([]);

  const [sortOrder, setSortOrder] = useState("asc");
  const toggleSortOrder = () => {
    setSortOrder((order) => (order == "asc" ? "desc" : "asc"));
  };

  const [selectedColumn, setSelectedColumn] = useState(columns[0]);
  const [techPacks, setTechPacks] = useState([]);
  const [sortedTechPacks, setSortedTechPacks] = useState(techPacks);

  useEffect(() => {
    setSortedTechPacks(
      sortByColumn(techPacks, columnToKeyMap[selectedColumn], sortOrder)
    );
  }, [selectedColumn, techPacks, sortOrder]);

  const [isLoading, setIsLoading] = useState(true);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [repeatConfirmModalOpen, setRepeatConfirmModalOpen] = useState(false);
  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
  const [selectedTechPackId, setSelectedTechPackId] = useState(null);

  const handlestyleIdChange = (event) => {
    setStyleId(event.target.value);
  };

  // Fetch all dropdown data
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const responses = await Promise.all([
          api.get("/api/vendors"),
          api.get("/api/categories"),
          api.get("/api/subcategories"),
          api.get("/api/item-types"),
          api.get("/api/classes"),
          api.get("/api/clients"),
        ]);

        setVendors(responses[0].data);
        setCategories(responses[1].data);
        setSubcategories(responses[2].data);
        setItemTypes(responses[3].data);
        setClasses(responses[4].data);
        setClients(responses[5].data);
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
      }
    };

    fetchDropdownData();
  }, []);

  // Handle all dropdown changes
  const handleVendorChange = (event) => setSelectedVendor(event.target.value);
  const handleCategoryChange = (event) =>
    setSelectedCategory(event.target.value);
  const handleSubcategoryChange = (event) =>
    setSelectedSubcategory(event.target.value);
  const handleItemTypeChange = (event) =>
    setSelectedItemType(event.target.value);
  const handleClassChange = (event) => setSelectedClass(event.target.value);
  const handleClientChange = (event) => setSelectedClient(event.target.value);
  const handleFromCreatedDateChange = (event) =>
    setFromCreatedDate(event.target.value);
  const handleToCreatedDateChange = (event) =>
    setToCreatedDate(event.target.value);
  const handleFromETDDateChange = (event) => setFromETDDate(event.target.value);
  const handleToETDDateChange = (event) => setToETDDate(event.target.value);
  const handleDesignStatusChange = (event) =>
    setSelectedDesignStatus(event.target.value);
  const handleFitStatusChange = (event) =>
    setSelectedFitStatus(event.target.value);
  const handleShippingStatusChange = (event) =>
    setSelectedShippingStatus(event.target.value);

  const resetAllFields = () => {
    setSelectedVendor("");
    setSelectedCategory("");
    setSelectedSubcategory("");
    setSelectedItemType("");
    setSelectedClass("");
    setSelectedClient("");
    setFromCreatedDate("");
    setToCreatedDate("");
    setFromETDDate("");
    setToETDDate("");
    setStyleId("");
    setSelectedDesignStatus([]);
    setSelectedFitStatus([]);
    setSelectedShippingStatus([]);
  };

  const getAllWorkOrder = async (page = 1, search = "", filters = {}) => {
    try {
      const response = await api.get(
        search
          ? `/api/work-orders/search?search=${search}`
          : `/api/work-orders/search`,
        {
          params: {
            ...filters,
            page,
            limit: 10,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching work order:", error);
      if (error?.message && error?.message?.includes("Unauthorized")) {
        navigate("/login");
      }
      throw error;
    }
  };

  const fetchTechPacks = useCallback(
    async (page = 1, search = "", filters = {}) => {
      setIsLoading(true);
      try {
        // Convert date formats in search term if needed
        let processedSearch = search;
        if (search.includes("-")) {
          processedSearch = search
            .split(" ")
            .map((term) => {
              if (/^\d{2}-\d{2}-\d{4}$/.test(term)) {
                return convertSearchDate(term);
              }
              return term;
            })
            .join(" ");
        }

        const data = await getAllWorkOrder(page, processedSearch, filters);
        setTechPacks(data.data);
        setTotalPages(data.pagination.totalPages);
        setCurrentPage(data.pagination.currentPage);
        setTotalRecords(data.pagination.totalRecords);
      } catch (error) {
        console.error("Failed to fetch tech packs:", error.message);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const filters = {
      vendor: selectedVendor,
      category: selectedCategory,
      subCategory: selectedSubcategory,
      itemType: selectedItemType,
      class: selectedClass,
      client: selectedClient,
      lastUpdatedFrom: fromCreatedDate,
      lastUpdatedTo: toCreatedDate,
      etdFrom: fromETDDate,
      etdTo: toETDDate,
      styleId: styleId,
      design_status: selectedDesignStatus,
      fit_status: selectedFitStatus,
      shippping_status: selectedShippingStatus,
    };

    fetchTechPacks(currentPage, searchTerm, filters);
  }, [
    currentPage,
    searchTerm,
    selectedVendor,
    selectedCategory,
    selectedSubcategory,
    selectedItemType,
    selectedClass,
    selectedClient,
    fromCreatedDate,
    toCreatedDate,
    fromETDDate,
    toETDDate,
    styleId,
    selectedDesignStatus,
    selectedFitStatus,
    selectedShippingStatus,
    fetchTechPacks,
  ]);

  const openModal = () => setModalIsOpen(true);
  const closeModal = () => setModalIsOpen(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleClick = (techPackId) => {
    window.open(`/work-order-detail/${techPackId}`, "_blank");
  };

  const handleRepeatClick = (techPackId) => {
    setSelectedTechPackId(techPackId);
    setRepeatConfirmModalOpen(true);
  };

  const handleDeleteClick = (techPackId) => {
    setSelectedTechPackId(techPackId);
    setDeleteConfirmModalOpen(true);
  };

  const handleConfirmRepeat = async () => {
    if (!selectedTechPackId) return;

    try {
      const response = await api.post(
        `/api/work-orders/repeat-workorder/${selectedTechPackId}`
      );
      fetchTechPacks(currentPage, searchTerm);
      if (response?.data) {
        navigate(`/work-order-detail/${response?.data?.data?.workOrder?._id}`);
      }
    } catch (error) {
      console.error("Error repeating work order:", error);
    } finally {
      setRepeatConfirmModalOpen(false);
      setSelectedTechPackId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedTechPackId) return;

    try {
      await api.delete(`/api/work-orders/${selectedTechPackId}`);
      fetchTechPacks(currentPage, searchTerm);
    } catch (error) {
      console.error("Error deleting work order:", error);
    } finally {
      setDeleteConfirmModalOpen(false);
      setSelectedTechPackId(null);
    }
  };

  const handlePageChange = (event, page) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };
  const getStatusColor = (status) => {
    switch (status) {
      case "Received":
        return "#4CAF50"; // Green
      case "Arranged/Not Yet Shipped":
        return "#FFC107"; // Amber
      case "Ready to Ship":
        return "#2196F3"; // Blue
      case "In Transit":
        return "#9C27B0"; // Purple
      case "Cancelled":
        return "#F44336"; // Red
      default:
        return "#607D8B"; // Default blue-grey
    }
  };
  const userRole = localStorage.getItem("role");
  return (
    <>
      <Navbar />
      <Box sx={{ p: 2, mt: 3 }}>
        <Box display="flex" justifyContent="flex-start" mb={2}>
          {(userRole === "admin" || userRole === "general") && (
            <Button variant="contained" color="primary" onClick={openModal}>
              Add Work Order
            </Button>
          )}
          <TextField
            hiddenLabel
            id="search-field"
            variant="outlined"
            size="small"
            placeholder="Search Work Order"
            value={searchTerm}
            onChange={handleSearchChange}
            className="searchfield_style"
          />
          <Button onClick={handleOpen}>Filters</Button>
          <Modal
            open={open}
            onClose={handleClose}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
          >
            <Box sx={style}>
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={4}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontSize: "10px", whiteSpace: "nowrap" }}
                      className="text_fieldname_filters"
                    >
                      Style :
                    </Typography>
                    <TextField
                      fullWidth
                      variant="outlined"
                      size="small"
                      sx={{ flex: 1 }}
                      value={styleId}
                      onChange={handlestyleIdChange}
                    />
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mt: 2,
                    }}
                  >
                    <Typography
                      className="text_fieldname_filters"
                      variant="subtitle2"
                      sx={{ fontSize: "10px", whiteSpace: "nowrap" }}
                    >
                      Vendor:
                    </Typography>
                    <FormControl fullWidth sx={{ flex: 1 }} size="small">
                      <InputLabel id="vendor-label" sx={{ fontSize: "10px" }}>
                        Select Vendor
                      </InputLabel>
                      <Select
                        labelId="vendor-label"
                        value={selectedVendor}
                        onChange={handleVendorChange}
                        size="small"
                      >
                        {vendors?.map((vendor) => (
                          <MenuItem key={vendor?._id} value={vendor?._id}>
                            {vendor?.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mt: 2,
                    }}
                  >
                    <Typography
                      className="text_fieldname_filters"
                      variant="subtitle2"
                      sx={{ fontSize: "10px", whiteSpace: "nowrap" }}
                    >
                      Category:
                    </Typography>
                    <FormControl fullWidth sx={{ flex: 1 }} size="small">
                      <InputLabel id="category-label" sx={{ fontSize: "10px" }}>
                        Select Category
                      </InputLabel>
                      <Select
                        labelId="category-label"
                        value={selectedCategory}
                        onChange={handleCategoryChange}
                        size="small"
                      >
                        {categories?.map((category) => (
                          <MenuItem key={category?._id} value={category?._id}>
                            {category?.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mt: 2,
                    }}
                  >
                    <Typography
                      className="text_fieldname_filters"
                      variant="subtitle2"
                      sx={{ fontSize: "10px", whiteSpace: "nowrap" }}
                    >
                      Subcategory:
                    </Typography>
                    <FormControl fullWidth sx={{ flex: 1 }} size="small">
                      <InputLabel
                        id="subcategory-label"
                        sx={{ fontSize: "10px" }}
                      >
                        Select Subcategory
                      </InputLabel>
                      <Select
                        labelId="subcategory-label"
                        value={selectedSubcategory}
                        onChange={handleSubcategoryChange}
                        size="small"
                      >
                        {subcategories?.map((subcategory) => (
                          <MenuItem
                            key={subcategory?._id}
                            value={subcategory?._id}
                          >
                            {subcategory?.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mt: 2,
                    }}
                  >
                    <Typography
                      className="text_fieldname_filters"
                      variant="subtitle2"
                      sx={{ fontSize: "10px", whiteSpace: "nowrap" }}
                    >
                      Item Type:
                    </Typography>
                    <FormControl fullWidth sx={{ flex: 1 }} size="small">
                      <InputLabel
                        id="item-type-label"
                        sx={{ fontSize: "10px" }}
                      >
                        Select Item Type
                      </InputLabel>
                      <Select
                        labelId="item-type-label"
                        value={selectedItemType}
                        onChange={handleItemTypeChange}
                        size="small"
                      >
                        {itemTypes?.map((itemType) => (
                          <MenuItem key={itemType?._id} value={itemType?._id}>
                            {itemType?.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mt: 2,
                    }}
                  >
                    <Typography
                      className="text_fieldname_filters"
                      variant="subtitle2"
                      sx={{ fontSize: "10px", whiteSpace: "nowrap" }}
                    >
                      Class:
                    </Typography>
                    <FormControl fullWidth sx={{ flex: 1 }} size="small">
                      <InputLabel id="class-label" sx={{ fontSize: "10px" }}>
                        Select Class
                      </InputLabel>
                      <Select
                        labelId="class-label"
                        value={selectedClass}
                        onChange={handleClassChange}
                        size="small"
                      >
                        {classes?.map((classItem) => (
                          <MenuItem key={classItem?._id} value={classItem?._id}>
                            {classItem?.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Grid>
                <Grid item xs={1}>
                  <Box></Box>
                </Grid>
                <Grid item xs={7}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mt: 0,
                    }}
                  >
                    <Typography
                      className="text_fieldname_filters"
                      variant="subtitle2"
                      sx={{ fontSize: "10px", whiteSpace: "nowrap" }}
                    >
                      Client:
                    </Typography>
                    <FormControl fullWidth sx={{ flex: 1 }} size="small">
                      <InputLabel id="client-label" sx={{ fontSize: "10px" }}>
                        Select Client
                      </InputLabel>
                      <Select
                        labelId="client-label"
                        value={selectedClient}
                        onChange={handleClientChange}
                        size="small"
                      >
                        {clients?.map((client) => (
                          <MenuItem key={client?._id} value={client?._id}>
                            {client?.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      mt: 2,
                    }}
                  >
                    <Typography
                      className="text_fieldname_filters"
                      variant="subtitle2"
                      sx={{ fontSize: "10px", whiteSpace: "nowrap" }}
                    >
                      Date Created:
                    </Typography>
                    <TextField
                      label="From"
                      type="date"
                      value={fromCreatedDate}
                      onChange={handleFromCreatedDateChange}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      size="small"
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      label="To"
                      type="date"
                      value={toCreatedDate}
                      onChange={handleToCreatedDateChange}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      size="small"
                      sx={{ flex: 1 }}
                    />
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      mt: 2,
                    }}
                  >
                    <Typography
                      className="text_fieldname_filters"
                      variant="subtitle2"
                      sx={{ fontSize: "10px", whiteSpace: "nowrap" }}
                    >
                      ETD:
                    </Typography>
                    <TextField
                      label="From"
                      type="date"
                      value={fromETDDate}
                      onChange={handleFromETDDateChange}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      size="small"
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      label="To"
                      type="date"
                      value={toETDDate}
                      onChange={handleToETDDateChange}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      size="small"
                      sx={{ flex: 1 }}
                    />
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mt: 2,
                    }}
                  >
                    <Typography
                      className="text_fieldname_filters"
                      variant="subtitle2"
                      sx={{ fontSize: "10px", whiteSpace: "nowrap" }}
                    >
                      Design Status:
                    </Typography>
                    <FormControl fullWidth sx={{ flex: 1 }} size="small">
                      <InputLabel
                        id="design-status-label"
                        sx={{ fontSize: "10px" }}
                      >
                        Select Status
                      </InputLabel>
                      <Select
                        labelId="design-status-label"
                        multiple
                        value={selectedDesignStatus}
                        onChange={handleDesignStatusChange}
                        size="small"
                        renderValue={(selected) => selected?.join(", ")}
                      >
                        <MenuItem value="Approved">
                          <Checkbox
                            checked={selectedDesignStatus?.includes("Approved")}
                          />
                          <ListItemText primary="Approved" />
                        </MenuItem>
                        <MenuItem value="Rejected">
                          <Checkbox
                            checked={selectedDesignStatus?.includes("Rejected")}
                          />
                          <ListItemText primary="Rejected" />
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mt: 2,
                    }}
                  >
                    <Typography
                      className="text_fieldname_filters"
                      variant="subtitle2"
                      sx={{ fontSize: "10px", whiteSpace: "nowrap" }}
                    >
                      Fit Status:
                    </Typography>
                    <FormControl fullWidth sx={{ flex: 1 }} size="small">
                      <InputLabel
                        id="fit-status-label"
                        sx={{ fontSize: "10px" }}
                      >
                        Select Fit Status
                      </InputLabel>
                      <Select
                        labelId="fit-status-label"
                        multiple
                        value={selectedFitStatus}
                        onChange={handleFitStatusChange}
                        size="small"
                        renderValue={(selected) => selected?.join(", ")}
                      >
                        <MenuItem value="Approved">
                          <Checkbox
                            checked={selectedFitStatus?.includes("Approved")}
                          />
                          <ListItemText primary="Approved" />
                        </MenuItem>
                        <MenuItem value="Rejected">
                          <Checkbox
                            checked={selectedFitStatus?.includes("Rejected")}
                          />
                          <ListItemText primary="Rejected" />
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mt: 2,
                    }}
                  >
                    <Typography
                      className="text_fieldname_filters"
                      variant="subtitle2"
                      sx={{ fontSize: "10px", whiteSpace: "nowrap" }}
                    >
                      Shipping Status:
                    </Typography>
                    <FormControl fullWidth sx={{ flex: 1 }} size="small">
                      <InputLabel
                        id="shipping-status-label"
                        sx={{ fontSize: "10px" }}
                      >
                        Select Shipping Status
                      </InputLabel>
                      <Select
                        labelId="shipping-status-label"
                        multiple
                        value={selectedShippingStatus}
                        onChange={handleShippingStatusChange}
                        size="small"
                        renderValue={(selected) => selected?.join(", ")}
                      >
                        <MenuItem value="Open">
                          <Checkbox
                            checked={selectedShippingStatus?.includes("Open")}
                          />
                          <ListItemText primary="Open" />
                        </MenuItem>
                        <MenuItem value="Ready to Ship">
                          <Checkbox
                            checked={selectedShippingStatus?.includes(
                              "Ready to Ship"
                            )}
                          />
                          <ListItemText primary="Ready to Ship" />
                        </MenuItem>
                        <MenuItem value="Arranged">
                          <Checkbox
                            checked={selectedShippingStatus?.includes(
                              "Arranged"
                            )}
                          />
                          <ListItemText primary="Arranged" />
                        </MenuItem>
                        <MenuItem value="In Transit">
                          <Checkbox
                            checked={selectedShippingStatus?.includes(
                              "In Transit"
                            )}
                          />
                          <ListItemText primary="In Transit" />
                        </MenuItem>
                        <MenuItem value="Received">
                          <Checkbox
                            checked={selectedShippingStatus?.includes(
                              "Received"
                            )}
                          />
                          <ListItemText primary="Received" />
                        </MenuItem>
                        <MenuItem value="Pending Approval">
                          <Checkbox
                            checked={selectedShippingStatus?.includes(
                              "Pending Approval"
                            )}
                          />
                          <ListItemText primary="Pending Approval" />
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Grid>
              </Grid>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 2,
                  mt: 2,
                }}
              >
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={resetAllFields}
                >
                  Reset
                </Button>
              </Box>
            </Box>
          </Modal>
        </Box>
        <AddWorkOrder
          isOpen={modalIsOpen}
          closeModal={closeModal}
          onSubmit={() => fetchTechPacks(currentPage, searchTerm)}
        />
        <TableContainer
          component={Paper}
          sx={{ borderRadius: 2, boxShadow: 3, overflow: "hidden" }}
        >
          <Table sx={{ minWidth: 650 }}>
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
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <CircularProgress size={24} sx={{ color: "#5c6bc0" }} />
                  </TableCell>
                </TableRow>
              ) : sortedTechPacks?.length > 0 ? (
                sortedTechPacks?.map((row) => (
                  <TableRow
                    key={row?._id}
                    sx={{
                      "&:hover": { backgroundColor: "#f5f5f5" },
                      transition: "background-color 0.3s ease",
                    }}
                  >
                    <TableCell
                      onClick={() => handleClick(row?._id)}
                      sx={{ cursor: "pointer" }}
                    >
                      {row?.workOrderId}
                    </TableCell>
                    <TableCell
                      onClick={() => handleClick(row?._id)}
                      sx={{ cursor: "pointer" }}
                    >
                      {row?.styleNumbers?.length > 0 ? (
                        <>
                          {row.styleNumbers.map((s, index) => (
                            <React.Fragment key={index}>
                              <span
                                style={{
                                  backgroundColor: "#e0e0e0", // Light gray background
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  display: "inline-block",
                                  margin: "2px 0",
                                }}
                              >
                                {s.number}
                              </span>
                              {index < row.styleNumbers.length - 1 && <br />}
                            </React.Fragment>
                          ))}
                        </>
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                    <TableCell>
                      {row?.customer_po_number?.length
                        ? [...new Set(row.customer_po_number)].join(", ")
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {/* Design Approval Status */}
                      {row?.latestDesignApprovalDate ? (
                        <Box
                          component="span"
                          sx={{
                            display: "inline-block",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            marginBottom: "4px",
                            backgroundColor:
                              row?.latestDesignApprovalStatus === "Rejected"
                                ? "#ffebee"
                                : row?.latestDesignApprovalStatus ===
                                    "Approved" ||
                                  row?.latestDesignApprovalStatus ===
                                    "Approved with Corrections"
                                ? "#e8f5e9"
                                : "#e3f2fd",
                            color:
                              row?.latestDesignApprovalStatus === "Rejected"
                                ? "#c62828"
                                : row?.latestDesignApprovalStatus ===
                                    "Approved" ||
                                  row?.latestDesignApprovalStatus ===
                                    "Approved with Corrections"
                                ? "#2e7d32"
                                : "#1565c0",
                            fontWeight: "500",
                          }}
                        >
                          Design {row?.latestDesignApprovalStatus} on{" "}
                          {formatDate(row?.latestDesignApprovalDate)}
                        </Box>
                      ) : (
                        <Box
                          component="span"
                          sx={{
                            display: "inline-block",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            marginBottom: "4px",
                            backgroundColor: "#f5f5f5",
                            color: "#9e9e9e",
                            fontStyle: "italic",
                          }}
                        >
                          Design: N/A
                        </Box>
                      )}

                      <br />

                      {/* Fit Approval Status */}
                      {row?.latestFitApprovalDate ? (
                        <Box
                          component="span"
                          sx={{
                            display: "inline-block",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            backgroundColor:
                              row?.latestFitApprovalStatus === "Rejected"
                                ? "#ffebee"
                                : row?.latestFitApprovalStatus === "Approved" ||
                                  row?.latestFitApprovalStatus ===
                                    "Approved with Corrections"
                                ? "#e8f5e9"
                                : "#e3f2fd",
                            color:
                              row?.latestFitApprovalStatus === "Rejected"
                                ? "#c62828"
                                : row?.latestFitApprovalStatus === "Approved" ||
                                  row?.latestFitApprovalStatus ===
                                    "Approved with Corrections"
                                ? "#2e7d32"
                                : "#1565c0",
                            fontWeight: "500",
                          }}
                        >
                          Fit {row?.latestFitApprovalStatus} on{" "}
                          {formatDate(row?.latestFitApprovalDate)}
                        </Box>
                      ) : (
                        <Box
                          component="span"
                          sx={{
                            display: "inline-block",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            backgroundColor: "#f5f5f5",
                            color: "#9e9e9e",
                            fontStyle: "italic",
                          }}
                        >
                          Fit: N/A
                        </Box>
                      )}
                    </TableCell>

                    <TableCell>{row?.vendor?.name}</TableCell>
                    <TableCell>
                      {row?.shippingStatus?.length > 0 ? (
                        <div>
                          {row.shippingStatus.map((status, index) => (
                            <React.Fragment key={index}>
                              <span
                                style={{
                                  backgroundColor: getStatusColor(status),
                                  padding: "4px 8px",
                                  borderRadius: "4px",
                                  color: "#fff",
                                  fontSize: "12px",
                                  display: "inline-block",
                                  marginBottom: "4px",
                                }}
                              >
                                {status}
                              </span>
                              {index < row.shippingStatus.length - 1 && <br />}
                            </React.Fragment>
                          ))}
                        </div>
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                    <TableCell>{formatDate(row?.createdAt)}</TableCell>
                    <TableCell>{formatDate(row?.etd)}</TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="View Order" arrow>
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleClick(row?._id)}
                            aria-label="view"
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {(userRole === "admin" || userRole === "general") && (
                          <>
                            <Tooltip title="Repeat Order" arrow>
                              <IconButton
                                color="success"
                                size="small"
                                onClick={() => handleRepeatClick(row?._id)}
                                aria-label="repeat order"
                              >
                                <LoopIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {userRole === "admin" && (
                              <Tooltip title="Delete Order" arrow>
                                <IconButton
                                  color="error"
                                  size="small"
                                  onClick={() => handleDeleteClick(row?._id)}
                                  aria-label="delete"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    align="center"
                    sx={{ fontStyle: "italic", color: "#757575" }}
                  >
                    No data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mt={3}
        >
          <Typography variant="body2" color="text.secondary">
            Showing {techPacks.length} of {totalRecords} records
          </Typography>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      </Box>

      {/* Repeat Confirmation Modal */}
      <Modal
        open={repeatConfirmModalOpen}
        onClose={() => {
          setRepeatConfirmModalOpen(false);
          setSelectedTechPackId(null);
        }}
        aria-labelledby="confirm-repeat-modal-title"
        aria-describedby="confirm-repeat-modal-description"
      >
        <Box sx={confirmModalStyle}>
          <Typography
            id="confirm-repeat-modal-title"
            variant="h6"
            component="h2"
          >
            Confirm Repeat
          </Typography>
          <Typography id="confirm-repeat-modal-description" sx={{ mt: 2 }}>
            Are you sure you want to repeat this work order?
          </Typography>
          <Box
            sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={handleConfirmRepeat}
            >
              Yes
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setRepeatConfirmModalOpen(false);
                setSelectedTechPackId(null);
              }}
            >
              No
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteConfirmModalOpen}
        onClose={() => {
          setDeleteConfirmModalOpen(false);
          setSelectedTechPackId(null);
        }}
        aria-labelledby="confirm-delete-modal-title"
        aria-describedby="confirm-delete-modal-description"
      >
        <Box sx={confirmModalStyle}>
          <Typography
            id="confirm-delete-modal-title"
            variant="h6"
            component="h2"
          >
            Confirm Delete
          </Typography>
          <Typography id="confirm-delete-modal-description" sx={{ mt: 2 }}>
            Are you sure you want to delete this work order? This action cannot
            be undone.
          </Typography>
          <Box
            sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}
          >
            <Button
              variant="contained"
              color="error"
              onClick={handleConfirmDelete}
            >
              Delete
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setDeleteConfirmModalOpen(false);
                setSelectedTechPackId(null);
              }}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default WorkOrder;
