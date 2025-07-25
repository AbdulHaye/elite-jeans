import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Button,
  Typography,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from "@mui/material";
import Navbar from "../../Navbar/Navbar";
import ViewQuoteModal from "./Modal/ViewQuoteModal";
import AddPriceModal from "./Modal/AddPriceModal";
import WorkOrder from "./WorkOrder";
import api from "../../ApiServices/api";
import { useNavigate } from "react-router-dom";

const Quote = () => {
  const [vendorFilter, setVendorFilter] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [vendors, setVendors] = useState([]);
  const [vendorData, setVendorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState(null);
  const [quoteData, setQuoteData] = useState(null);
  const [isAddPriceModalOpen, setIsAddPriceModalOpen] = useState(false);
  const [selectedTechPackId, setSelectedTechPackId] = useState(null);
  const [userType, setUserType] = useState(null);
  const [userVendorIds, setUserVendorIds] = useState([]);

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUserType(parsedUser.type);
      setUserVendorIds(parsedUser.vendor || []);
      
      // If user is vendor and has vendor IDs, set the first one as default filter
      if (parsedUser.type === "vendor" && parsedUser.vendor?.length > 0) {
        setVendorFilter(parsedUser.vendor[0]);
      }
    }
  }, []);

  const openAddPriceModal = (techPackId) => {
    setSelectedTechPackId(techPackId);
    setIsAddPriceModalOpen(true);
  };

  const closeAddPriceModal = () => setIsAddPriceModalOpen(false);

  const openModal = (quoteId) => {
    setSelectedQuoteId(quoteId);
    setIsModalOpen(true);
    fetchQuoteData(quoteId);
  };
  const navigate = useNavigate();
  const closeModal = () => setIsModalOpen(false);

  const handleVendorChange = (event) => {
    const vendorId = event.target.value;
    setVendorFilter(vendorId);
    fetchVendorData(vendorId);
  };

  const handleSearchChange = (event) => setSearchFilter(event.target.value);

  const fetchQuoteData = async (quoteId) => {
    try {
      const response = await api.get(`/api/techPack/quote/${quoteId}`);
      setQuoteData(response.data);
    } catch (error) {
      console.error("Error fetching quote data:", error);
      setQuoteData(null);
       if (error?.message && error?.message?.includes("Unauthorized")) {
        navigate("/login");
      }
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await api.get("/api/vendors");
      let vendorNames = response.data;

      // If user is vendor, filter vendors to only show their assigned vendors
      if (userType === "vendor" && userVendorIds.length > 0) {
        vendorNames = vendorNames.filter(vendor => 
          userVendorIds.includes(vendor._id)
        );
      }

      setVendors(vendorNames);

      if (vendorNames.length > 0) {
        // If vendorFilter is not set (or invalid), set it to the first available vendor
        if (!vendorFilter || !vendorNames.some(v => v._id === vendorFilter)) {
          const firstVendorId = vendorNames[0]._id;
          setVendorFilter(firstVendorId);
          fetchVendorData(firstVendorId);
        } else {
          // If vendorFilter is already set and valid, just fetch the data
          fetchVendorData(vendorFilter);
        }
      }
    } catch (error) {
      console.error("Error fetching vendors:", error);
      setError("Error fetching vendors");
       if (error?.message && error?.message?.includes("Unauthorized")) {
        navigate("/login");
      }
    }
  };

  const fetchVendorData = async (vendorId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/techPack/vendor/${vendorId}`);
      setVendorData(response.data);
    } catch (error) {
      console.error("Error fetching vendor data:", error);
      setError("No data found");
       if (error?.message && error?.message?.includes("Unauthorized")) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Invalid Date";
    const date = new Date(dateString);
    if (isNaN(date)) return "Invalid Date";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const filteredVendorData = vendorData?.filter((item) =>
    item?.techPackId?.toString().includes(searchFilter)
  );

  useEffect(() => {
    fetchVendors();
  }, [userType, userVendorIds]);

  const handleSubmitSent = () => {
    fetchVendorData(vendorFilter);
  };

  const refreshVendorData = () => {
    fetchVendorData(vendorFilter);
  };

  return (
    <>
      <Navbar />
      <Box sx={{ padding: 2 }}>
        {/* Vendor selection - show dropdown for non-vendors or vendors with multiple vendors */}
        {(userType !== "vendor" || (userType === "vendor" && vendors.length > 1)) && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <FormControl variant="outlined" style={{ minWidth: 150 }}>
              <InputLabel id="vendor-select-label">Vendor</InputLabel>
              <Select
                labelId="vendor-select-label"
                id="vendor-select"
                value={vendorFilter}
                onChange={handleVendorChange}
                label="Vendor"
              >
                {vendors?.map((vendor) => (
                  <MenuItem key={vendor?._id} value={vendor?._id}>
                    {vendor?.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}

        {/* Show current vendor name for vendors with only one vendor */}
        {userType === "vendor" && vendors.length === 1 && (
          <Typography variant="h6" sx={{ mb: 2 }}>
            Vendor: {vendors[0]?.name}
          </Typography>
        )}

        <h2>TechPack</h2>
        <Grid container spacing={2}>
          {loading ? (
            <Grid item xs={12}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "200px",
                }}
              >
                <Typography variant="h6" color="textSecondary">
                  Loading...
                </Typography>
              </Box>
            </Grid>
          ) : error ? (
            <Grid item xs={12}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "200px",
                }}
              >
                <Typography variant="h6" color="error">
                  {error}
                </Typography>
              </Box>
            </Grid>
          ) : filteredVendorData?.length === 0 ? (
            <Grid item xs={12}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "200px",
                }}
              >
                <Typography variant="h6" color="textSecondary">
                  No Data Found
                </Typography>
              </Box>
            </Grid>
          ) : (
            filteredVendorData?.map((item) => (
              <Grid item xs={12} sm={12} md={12} lg={6} xl={4} key={item.id}>
                <Box
                  sx={{
                    display: { xs: "inline-grid", sm: "flex" },
                    alignItems: "flex-start",
                    backgroundColor: "#f9ffe6",
                    borderRadius: 2,
                    border: "1px solid #dcdcdc",
                    overflow: "hidden",
                    height: "100%",
                  }}
                >
                  <Box
                    component="img"
                    src={item?.pictures[0]?.imageUrl}
                    alt={item?.pictures[0]?.imageName}
                    sx={{
                      width: { xs: "100%", sm: 100 },
                      height: "100%",
                      objectFit: "cover",
                      borderRight: "1px solid #dcdcdc",
                    }}
                  />
                  <Box sx={{ flex: 1, padding: 2 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontSize: "1rem",
                        fontWeight: 600,
                        marginBottom: 1,
                      }}
                    >
                      TechPack #{item?.techPackId}
                    </Typography>
                    <Typography variant="subtitle2" sx={{ marginBottom: 1 }}>
                      {item.code}
                    </Typography>
                    <Table size="small" sx={{ marginBottom: 2 }}>
                      <TableBody>
                        <TableRow>
                          <TableCell
                            sx={{
                              padding: "4px 8px",
                              fontWeight: 600,
                              border: "none",
                            }}
                          >
                            Vendor
                          </TableCell>
                          <TableCell
                            sx={{
                              padding: "4px 8px",
                              fontWeight: 600,
                              border: "none",
                            }}
                          >
                            Date
                          </TableCell>
                          <TableCell
                            sx={{
                              padding: "4px 8px",
                              fontWeight: 600,
                              border: "none",
                            }}
                          >
                            Fabric
                          </TableCell>
                          <TableCell
                            sx={{
                              padding: "4px 8px",
                              fontWeight: 600,
                              border: "none",
                            }}
                          >
                            Notes
                          </TableCell>
                          <TableCell
                            sx={{
                              padding: "4px 8px",
                              fontWeight: 600,
                              border: "none",
                            }}
                          >
                            Price
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell
                            sx={{ padding: "4px 8px", border: "none" }}
                          >
                            {item.vendor?.name || "N/A"}
                          </TableCell>
                          <TableCell
                            sx={{ padding: "4px 8px", border: "none" }}
                          >
                            {formatDate(
                              item?.tech_pack_quote[0]?.date || "N/A"
                            )}
                          </TableCell>
                          <TableCell
                            sx={{ padding: "4px 8px", border: "none" }}
                          >
                            {item?.tech_pack_quote[0]?.fabric}
                          </TableCell>
                          <TableCell
                            sx={{ padding: "4px 8px", border: "none" }}
                          >
                            {item?.tech_pack_quote[0]?.notes}
                          </TableCell>
                          <TableCell
                            sx={{ padding: "4px 8px", border: "none" }}
                          >
                            {item?.tech_pack_quote[0]?.price}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 1,
                      }}
                    >
                      <Button
                        variant="contained"
                        size="small"
                        sx={{ textTransform: "none" }}
                        onClick={() => openModal(item?._id)}
                      >
                        View Quote
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        color="secondary"
                        sx={{ textTransform: "none" }}
                        onClick={() => openAddPriceModal(item?._id)}
                      >
                        Add Price
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </Grid>
            ))
          )}
        </Grid>

        <h2>WorkOrder</h2>
        <WorkOrder vendorData1={vendorData} vendorId={vendorFilter} />

        <ViewQuoteModal
          open={isModalOpen}
          handleClose={closeModal}
          quoteData={quoteData}
          vendorId={vendorFilter}
          setQuoteData={setQuoteData}
          selectedQuoteId={selectedQuoteId}
          onDeleteSuccess={refreshVendorData} 
          refreshfetchQuoteData={fetchQuoteData} 
        />
        <AddPriceModal
          open={isAddPriceModalOpen}
          handleClose={closeAddPriceModal}
          techPackId={selectedTechPackId}
          handleSubmitSent={handleSubmitSent}
        />
      </Box>
    </>
  );
};

export default Quote;