import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
} from "@mui/material";
import WashDetailModal from "../../../../../TechPack/Modals/WorkOrder/WashDetail/washDetail";
import WashImage from "./washImage";
import api from "../../../../../../ApiServices/api";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

function WashDetail({ techPackId, category }) {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const isMediumScreen = useMediaQuery(theme.breakpoints.between("sm", "md"));

  const [washDetail, setWashDetail] = useState(null);
  const [modalIsOpenEdit, setModalIsOpenEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const openModalEdit = () => setModalIsOpenEdit(true);
  const closeModalEdit = () => setModalIsOpenEdit(false);

  const handlePostSubmitEdit = (newData) => {
    setWashDetail(newData);
    closeModalEdit();
  };

  const fetchWashDetail = async () => {
    if (!techPackId) return;

    setIsLoading(true);
    try {
      const response = await api.post(
        `/api/work-orders/wash-detail/getByWorkOrder`,
        {
          workOrder_Id: techPackId,
          category_Id: category?._id,
        }
      );
      setWashDetail(response.data.data[0] || null);
    } catch (err) {
      console.error("Error fetching wash details:", err);
      setWashDetail(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWashDetail();
  }, [techPackId]);

  const isDataAvailable = washDetail && Object.keys(washDetail).length > 0;
  const userRole = localStorage.getItem("role");

  const renderTableContent = () => {
    if (isLoading) {
      return (
        <TableRow>
          <TableCell colSpan={4} align="center">
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              py={4}
            >
              <CircularProgress size={24} />
              <Box ml={2}>Loading color and wash details...</Box>
            </Box>
          </TableCell>
        </TableRow>
      );
    }

    if (!washDetail?.dynamicAttributes) {
      return (
        <TableRow>
          <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
            No Color and wash details found
          </TableCell>
        </TableRow>
      );
    }

    const attributes = Object.entries(washDetail.dynamicAttributes);

    if (isSmallScreen) {
      // Mobile view - single column
      return attributes.map(([key, value], index) => (
        <TableRow key={index}>
          <TableCell sx={{ fontWeight: "bold", width: "40%" }}>{key}</TableCell>
          <TableCell>{value}</TableCell>
        </TableRow>
      ));
    } else {
      // Desktop/tablet view - two columns
      return Array(Math.ceil(attributes.length / 2))
        .fill()
        .map((_, rowIndex) => {
          const firstItem = attributes[rowIndex * 2];
          const secondItem = attributes[rowIndex * 2 + 1];

          return (
            <TableRow key={rowIndex}>
              {firstItem && (
                <>
                  <TableCell sx={{ fontWeight: "bold", width: "20%" }}>
                    {firstItem[0]}
                  </TableCell>
                  <TableCell sx={{ width: "30%" }}>{firstItem[1]}</TableCell>
                </>
              )}
              {secondItem && (
                <>
                  <TableCell sx={{ fontWeight: "bold", width: "20%" }}>
                    {secondItem[0]}
                  </TableCell>
                  <TableCell sx={{ width: "30%" }}>{secondItem[1]}</TableCell>
                </>
              )}
              {!secondItem && (
                <>
                  <TableCell colSpan={2} />
                </>
              )}
            </TableRow>
          );
        });
    }
  };
  return (
    <Box
      sx={{
        width: isSmallScreen ? "92%" : "98%",
        overflowX: "auto",
        mb: 4,
        mx: 2,
      }}
    >
      <TableContainer component={Paper} elevation={2}>
        <Table sx={{ minWidth: isSmallScreen ? 300 : 650 }}>
          <TableHead>
            <TableRow>
              <TableCell
                colSpan={isSmallScreen ? 2 : 4}
                sx={{
                  backgroundColor: "#f5f5f5",
                  color: "primary.contrastText",
                  py: 2,
                }}
              >
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: "bold",
                      fontSize: isSmallScreen ? "0.875rem" : "1rem",
                      color: "black",
                    }}
                  >
                    Color Detail & Wash Detail
                  </Typography>
                  {(userRole === "admin" || userRole === "general") && (
                    <Button
                      variant="contained"
                      size={isSmallScreen ? "small" : "medium"}
                      onClick={openModalEdit}
                      disabled={isLoading}
                      sx={{
                        textTransform: "none",
                        minWidth: isSmallScreen ? 80 : 120,
                        fontSize: isSmallScreen ? "0.75rem" : "0.875rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {isLoading ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : isDataAvailable ? (
                        isSmallScreen ? (
                          "Edit"
                        ) : (
                          "Edit Color Detail & Wash Detail"
                        )
                      ) : isSmallScreen ? (
                        "Add"
                      ) : (
                        "Add Color Detail & Wash Detail"
                      )}
                    </Button>
                  )}
                </Box>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>{renderTableContent()}</TableBody>
        </Table>
      </TableContainer>

      <WashDetailModal
        isOpen={modalIsOpenEdit}
        closeModal={closeModalEdit}
        onSubmit={handlePostSubmitEdit}
        techPackData={washDetail}
        techPackId={techPackId}
        category={category?._id}
      />

      {washDetail?.dynamicAttributes && (
        <Box mt={4}>
          <WashImage
            techPackId={techPackId}
            washDetail={washDetail}
            category={category?._id}
          />
        </Box>
      )}
    </Box>
  );
}

export default WashDetail;
