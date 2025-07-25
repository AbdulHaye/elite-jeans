import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Typography,
  Box,
} from "@mui/material";
import Navbar from "../../../Navbar/Navbar";
import api from "../../../ApiServices/api";

const getAllTechPacks = async () => {
  try {
    const response = await api.get("/api/digital-patterns/");
    return response.data.data;
  } catch (error) {
    console.error("Error fetching tech packs:", error);
    
    throw error;
  }
};

const DigitalPattern = () => {
  const [techPacks, setTechPacks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const fetchTechPacks = useCallback(async () => {
    try {
      const data = await getAllTechPacks();
      setTechPacks(data);
    } catch (error) {
      console.error("Failed to fetch tech packs:", error.message);
    }
  }, []);

  useEffect(() => {
    fetchTechPacks();
  }, [fetchTechPacks]);

  // Handle file display
  const renderFile = (file) => {
    if (!file) return "N/A";
    if (file.endsWith(".txt")) {
      return (
        <Typography variant="body2" color="primary">
          {file}
        </Typography>
      );
    }
    return (
      <a href={file} target="_blank" rel="noopener noreferrer">
        Open File
      </a>
    );
  };

  // Filter data based on search term
  const filteredTechPacks = techPacks.filter((row) =>
    Object.values(row).some(
      (value) =>
        typeof value === "string" &&
        value.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <>
      <Navbar />
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: "bold" }}>
          Digital Pattern Library
        </Typography>

        {/* Search Input Field */}
        <TextField
  label="Search"
  variant="outlined"
  sx={{ mb: 2, width: "300px" }}
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
/>

        {/* Table to Display Tech Packs */}
        <TableContainer
          component={Paper}
          sx={{ borderRadius: 2, boxShadow: 3 }}
        >
          <Table sx={{ minWidth: 650, borderCollapse: "collapse" }}>
            <TableHead>
              <TableRow>
                {[
                  "Style #",
                  "Workorder #",
                  "File",
                  "User Name",
                  "Description",
                  "Upload Date",
                ].map((header) => (
                  <TableCell
                    key={header}
                    sx={{
                      fontWeight: "bold",
                      backgroundColor: "#f4f6f8",
                      color: "#5c6bc0",
                    }}
                  >
                    {header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredTechPacks.length > 0 ? (
                filteredTechPacks.map((row) => (
                  <TableRow key={row._id}>
                    <TableCell>{row.styleNumber || "N/A"}</TableCell>
                    <TableCell>
                      {row.workOrder_Id?.workOrderId || "N/A"}
                    </TableCell>
                    <TableCell>{renderFile(row.file)}</TableCell>
                    <TableCell>{row.user || "N/A"}</TableCell>
                    <TableCell>{row.description || "N/A"}</TableCell>
                    <TableCell>
                      {row.uploadDate
                        ? new Date(row.uploadDate).toLocaleString()
                        : "N/A"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="textSecondary">
                      No data available
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </>
  );
};

export default DigitalPattern;
