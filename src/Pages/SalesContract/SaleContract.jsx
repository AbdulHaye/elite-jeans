import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  InputLabel,
  FormControl,
  Tooltip,
  IconButton,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import Navbar from "../../Navbar/Navbar";
import axios from "axios";
import AddSalesContractModal from "./Modal/AddSalesContractModal";
import "./SaleContract.css";
import EditSalesContractModal from "./Modal/EditSalesContractModal";
import ModalSalesContractPdf from "./ModalSalesContractPdf";
import EditIcon from "@mui/icons-material/Edit";
import DownloadIcon from "@mui/icons-material/Download";
import api from "../../ApiServices/api";

const StyledButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(1),
}));

const SaleContract = () => {
  const [salesContracts, setSalesContracts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalEditOpen, setModalEditOpen] = useState(false);
  const [contractToEdit, setContractToEdit] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpenPdf, setModalOpenPdf] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [isFetchingSalesContracts, setIsFetchingSalesContracts] =
    useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchAllSalesContract = async () => {
    try {
      setIsFetchingSalesContracts(true);
      setErrorMessage("");
      const selectedVendorObj = vendors.find((v) => v._id === selectedVendor);
      const vendorName = selectedVendorObj ? selectedVendorObj.name : "";

      const response = await api.get(
        "/api/work-orders/salesContract/get/all",
        {
          params: {
            vendorName: vendorName,
            search: searchQuery,
          },
        }
      );
      setSalesContracts(response.data.data);
    } catch (err) {
      if (err.response) {
        if (err.response.status === 404) {
          setErrorMessage("Data not found");
          setSalesContracts([]);
        } else {
          setErrorMessage("An error occurred while fetching data");
        }
      } else {
        setErrorMessage("Network error. Please check your connection.");
      }
      console.error(err, "error show");
    } finally {
      setIsFetchingSalesContracts(false);
    }
  };

  useEffect(() => {
    fetchAllSalesContract();
  }, [selectedVendor, searchQuery, vendors]);

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

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleVendorChange = (e) => {
    setSelectedVendor(e.target.value);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleOpenModal = (contract = null) => {
    setContractToEdit(contract);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setContractToEdit(null);
  };

  const handleOpenEditModal = (contract = null) => {
    setContractToEdit(contract);
    setModalEditOpen(true);
  };

  const handleCloseEditModal = () => {
    setModalEditOpen(false);
    setContractToEdit(null);
  };

  const handleCreateContractResponse = () => {
    fetchAllSalesContract();
  };

  const handleUpdateContractResponse = () => {
    fetchAllSalesContract();
  };

  return (
    <>
      <Navbar />
      <div style={{ padding: "20px" }}>
        <div style={{ border: "1px solid #91d5ff" }}>
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 1,
              padding: "10px 0",
              borderBottom: "1px solid #ddd",
              boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.1)",
              backgroundColor: "#d2f1ff",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "start",
                alignItems: "center",
                gap: "20px",
                padding: "0 20px",
              }}
            >
              <StyledButton
                variant="contained"
                color="primary"
                onClick={() => handleOpenModal()}
                style={{ height: "56px" }}
              >
                + Add Sales Contracts
              </StyledButton>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "20px",
                  flexGrow: 1,
                }}
              >
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel id="vendor-select-label" shrink>
                    Vendor
                  </InputLabel>
                  <Select
                    labelId="vendor-select-label"
                    id="vendor-select"
                    value={selectedVendor}
                    onChange={handleVendorChange}
                    label="Vendor"
                    displayEmpty
                  >
                    <MenuItem value="">
                      <em>All Vendors</em>
                    </MenuItem>
                    {loading ? (
                      <MenuItem disabled>
                        <CircularProgress size={20} />
                      </MenuItem>
                    ) : (
                      vendors?.map((vendor) => (
                        <MenuItem key={vendor?._id} value={vendor?._id}>
                          {vendor?.name}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>

                <TextField
                  placeholder="Search contracts..."
                  variant="outlined"
                  size="small"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  style={{ width: 250 }}
                  InputProps={{
                    style: { height: "46px" },
                  }}
                />
              </div>
            </div>
          </div>

          <TableContainer
            component={Paper}
            className="table-container_saleContract"
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Contract #</TableCell>
                  <TableCell>Contract Date</TableCell>
                  <TableCell>Vendor</TableCell>
                  <TableCell>Order #</TableCell>
                  <TableCell>Style #</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isFetchingSalesContracts ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : errorMessage ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      {errorMessage}
                    </TableCell>
                  </TableRow>
                ) : salesContracts?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No data found
                    </TableCell>
                  </TableRow>
                ) : (
                  salesContracts?.map((contract, index) => (
                    <TableRow
                      key={index}
                      style={{
                        backgroundColor: index % 2 === 0 ? "#f0faff" : "white",
                      }}
                    >
                      <TableCell>{contract?.contractNo}</TableCell>
                      <TableCell>
                        {contract?.contractDate
                          ? new Date(
                              contract?.contractDate
                            ).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>{contract?.vendorId?.name}</TableCell>
                      <TableCell>
                        {contract?.workOrderquoteId[0]?.workOrder_Id
                          ?.workOrderId || "N/A"}
                      </TableCell>
                      <TableCell>
                        {contract?.workOrderquoteId[0]?.style_number || "N/A"}
                      </TableCell>
                      <TableCell style={{ color: "green" }}>
                        {contract?.status || "N/A"}
                      </TableCell>
                      <TableCell>
                        <div style={{ display: "flex", gap: "5px" }}>
                          <Tooltip title="Edit Contract">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEditModal(contract)}
                            >
                              <EditIcon
                                fontSize="small"
                                sx={{ color: "#1976d2" }}
                              />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Download PDF">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedContract(contract);
                                setModalOpenPdf(true);
                              }}
                            >
                              <DownloadIcon
                                fontSize="small"
                                sx={{ color: "#2e7d32" }}
                              />
                            </IconButton>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </div>

      <ModalSalesContractPdf
        open={modalOpenPdf}
        pdfData={selectedContract}
        onClose={() => {
          setModalOpenPdf(false);
          setSelectedContract(null);
        }}
      />

      <AddSalesContractModal
        open={modalOpen}
        onClose={handleCloseModal}
        onCreateContractResponse={handleCreateContractResponse}
      />

      <EditSalesContractModal
        open={modalEditOpen}
        onClose={handleCloseEditModal}
        onUpdateContractResponse={handleUpdateContractResponse}
        contractToEdit={contractToEdit}
      />
    </>
  );
};

export default SaleContract;
