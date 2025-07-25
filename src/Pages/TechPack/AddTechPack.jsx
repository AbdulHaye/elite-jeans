import DeleteIcon from "@mui/icons-material/Delete";
import LoopIcon from "@mui/icons-material/Loop";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from "@mui/material";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../ApiServices/api";
import { deleteTechPack } from "../../ApiServices/apiService";
import Navbar from "../../Navbar/Navbar";
import { sortByColumn } from "../../utils/sortUtils";
import AddModal from "./AddModal";

const columnToKeyMap = {
  "Pack ID": {
    key: "techPackId",
    type: "string",
  },
  Style: {
    key: "styleId",
    type: "string",
  },
  Vendor: {
    key: "vendor.name",
    type: "string",
  },
  Category: {
    key: "category.name",
    type: "string",
  },
  "Sub Category": {
    key: "subCategory.name",
    type: "string",
  },
  "Item Type": {
    key: "itemType.name",
    type: "string",
  },
  "Date Created": {
    key: "lastUpdated",
    type: "date",
  },
};

const columns = Object.keys(columnToKeyMap);

const AddTechPack = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  const [sortOrder, setSortOrder] = useState("asc");
  const toggleSortOrder = () => {
    setSortOrder((order) => (order == "asc" ? "desc" : "asc"));
  };

  const [selectedColumn, setSelectedColumn] = useState(columns[0]);
  const [techPacks, setTechPacks] = useState([]);
  const [sortedTechPacks, setSortedTechPacks] = useState(techPacks);

  useEffect(() => {
    setSortedTechPacks(sortByColumn(techPacks, columnToKeyMap[selectedColumn], sortOrder));
  }, [selectedColumn, techPacks, sortOrder]);

  const [isLoading, setIsLoading] = useState(true);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 10,
  });

  const [repeatConfirmModalOpen, setRepeatConfirmModalOpen] = useState(false);
  const [selectedTechPackId, setSelectedTechPackId] = useState(null);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 800);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  useEffect(() => {
    fetchTechPacks(1);
  }, [debouncedSearch]);

  const fetchTechPacks = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await api.get(
        `/api/techPack/filtered/sp/f?search=${debouncedSearch}&page=${page}`
      );
      setTechPacks(response.data.data);
      setPagination({
        page: response.data.pagination.page,
        pages: response.data.pagination.pages,
        total: response.data.pagination.total,
        limit: 10,
      });
    } catch (error) {
      console.error("Failed to fetch tech packs:", error.message);
      if (error?.message && error?.message?.includes("Unauthorized")) {
        navigate("/login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = () => setModalIsOpen(true);
  const closeModal = () => setModalIsOpen(false);

  const handlePostSubmit = (newTechPack) => {
    setTechPacks((prevTechPacks) => [...prevTechPacks, newTechPack]);
    fetchTechPacks();
  };

  const handleClick = (techPackId) => {
    const url = `/tech-pack-detail/${techPackId}`;
    window.open(url, "_blank");
  };

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleClickRepeattechpack = async (techPackId) => {
    try {
      const response = await api.post(`/api/techPack/repeat/${techPackId}`);
      console.log("Tech pack repeated successfully:", response.data);

      setSnackbar({
        open: true,
        message: "Tech Pack repeated successfully!",
        severity: "success",
      });

      fetchTechPacks();
    } catch (error) {
      console.error("Error repeating tech pack:", error);

      setSnackbar({
        open: true,
        message: "Failed to repeated Tech Pack. Please try again.",
        severity: "error",
      });
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const handleDeleteClick = (techPackId) => {
    setSelectedId(techPackId);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedId) return;

    try {
      await deleteTechPack(selectedId);
      setTechPacks((prev) =>
        prev.filter((techPack) => techPack._id !== selectedId)
      );
      setSuccessMessage("Tech pack deleted successfully!");
    } catch (error) {
      console.error("Failed to delete tech pack:", error.message);
    } finally {
      setIsModalOpen(false);
      setSelectedId(null);
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  const cancelDelete = () => {
    setIsModalOpen(false);
    setSelectedId(null);
  };

  const handleConfirmRepeat = async () => {
    setRepeatConfirmModalOpen(false);
    const techPackId = selectedTechPackId;
    setSelectedTechPackId(null);

    if (!techPackId) return;

    try {
      const response = await api.post(`/api/techPack/repeat/${techPackId}`);
      console.log("Tech pack repeated successfully:", response.data?.data?.techPack?._id);

      setSnackbar({
        open: true,
        message: "Tech Pack repeated successfully!",
        severity: "success",
      });
      navigate(`/tech-pack-detail/${response.data?.data?.techPack?._id}`);
      fetchTechPacks();
    } catch (error) {
      console.error("Error repeating tech pack:", error);
      setSnackbar({
        open: true,
        message: "Failed to repeat Tech Pack. Please try again.",
        severity: "error",
      });
    }
  };

  const CustomPagination = ({ pagination, onPageChange }) => {
    const { page, pages } = pagination;

    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
        <Button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          sx={{ mx: 1 }}
        >
          Previous
        </Button>

        {Array.from({ length: pages }, (_, i) => i + 1).map((pageNum) => (
          <Button
            key={pageNum}
            variant={pageNum === page ? "contained" : "outlined"}
            onClick={() => onPageChange(pageNum)}
            sx={{ mx: 0.5, minWidth: 32 }}
          >
            {pageNum}
          </Button>
        ))}

        <Button
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
          sx={{ mx: 1 }}
        >
          Next
        </Button>
      </Box>
    );
  };
  const userRole = localStorage.getItem("role");
  return (
    <>
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
      <Navbar />
      <Box sx={{ p: 2, mt: 3 }}>
        <Box
          display="flex"
          justifyContent="flex-start"
          alignItems="center"
          gap={2}
          mb={2}
        >
          {(userRole === "admin" || userRole === "general") && (
            <Button variant="contained" color="primary" onClick={openModal}>
              Add Tech Pack
            </Button>
          )}

          <TextField
            id="search-techpack"
            variant="outlined"
            size="small"
            placeholder="Search Tech Packs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Typography variant="body2" color="text.secondary">
            Total: {pagination.total}
          </Typography>
        </Box>

        <AddModal
          isOpen={modalIsOpen}
          closeModal={closeModal}
          onSubmit={handlePostSubmit}
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
                  <TableCell colSpan={8} align="center">
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
                      onClick={() => handleClick(row._id)}
                      sx={{ cursor: "pointer" }}
                    >
                      {row?.techPackId || "N/A"}
                    </TableCell>

                    <TableCell
                      onClick={() => handleClick(row._id)}
                      sx={{ cursor: "pointer" }}
                    >
                      {row?.styleId || "N/A"}
                    </TableCell>
                    <TableCell>{row?.vendor?.name || "N/A"}</TableCell>
                    <TableCell>{row?.category?.name || "N/A"}</TableCell>
                    <TableCell>{row?.subCategory?.name || "N/A"}</TableCell>
                    <TableCell>{row?.itemType?.name || "N/A"}</TableCell>
                    <TableCell>{row?.lastUpdated?.split("T")[0]}</TableCell>
                    <TableCell>
                      <Box display="flex" gap={0.5}>
                        <Tooltip title="Pack Detail" arrow>
                          <IconButton
                            color="primary"
                            onClick={() => handleClick(row._id)}
                            aria-label="Pack detail"
                            size="small"
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {(userRole === "admin" || userRole === "general") && (
                          <Tooltip title="Repeat Pack" arrow>
                            <IconButton
                              color="success"
                              onClick={() => {
                                setSelectedTechPackId(row._id);
                                setRepeatConfirmModalOpen(true);
                              }}
                              aria-label="repeat pack"
                              size="small"
                            >
                              <LoopIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {(userRole === "admin" || userRole === "general") && (
                          <Tooltip title="Delete Pack" arrow>
                            <IconButton
                              key={row._id}
                              color="error"
                              onClick={() => handleDeleteClick(row._id)}
                              aria-label="delete pack"
                              size="small"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={8}
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

        <CustomPagination
          pagination={pagination}
          onPageChange={(newPage) => {
            fetchTechPacks(newPage);
          }}
        />
      </Box>

      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>Are you sure you want to delete this tech pack?</h2>
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              sx={{ mt: 2 }}
            >
              <Button
                variant="contained"
                color="error"
                sx={{ mr: 2 }}
                onClick={confirmDelete}
              >
                Yes, Delete
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={cancelDelete}
              >
                No, Cancel
              </Button>
            </Box>
          </div>
        </div>
      )}

      {repeatConfirmModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>Are you sure you want to repeat this tech pack?</h2>
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              sx={{ mt: 2 }}
            >
              <Button
                variant="contained"
                color="primary"
                sx={{ mr: 2 }}
                onClick={handleConfirmRepeat}
              >
                Yes, Repeat
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => {
                  setRepeatConfirmModalOpen(false);
                  setSelectedTechPackId(null);
                }}
              >
                No, Cancel
              </Button>
            </Box>
          </div>
        </div>
      )}
    </>
  );
};

export default AddTechPack;
