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
import StyleDetailModal from "../../../../TechPack/Modals/WorkOrder/StyleDetail/StyleDetail";
import { useParams } from "react-router-dom";
import StyleImage from "../../../../../Components/StyleDetail/styleImage";
import api from "../../../../../ApiServices/api";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

function StyleDetail(category) {
  const { id } = useParams();
  const techPackId = id;
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const isMediumScreen = useMediaQuery(theme.breakpoints.between("sm", "md"));

  const [styleDetail, setStyleDetail] = useState(null);
  const [modalIsOpenEdit, setModalIsOpenEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const openModalEdit = () => setModalIsOpenEdit(true);
  const closeModalEdit = () => setModalIsOpenEdit(false);

  const handlePostSubmitEdit = () => {
    fetchStyleDetail();
    closeModalEdit();
  };

  const fetchStyleDetail = async () => {
    if (!techPackId) return;

    setIsLoading(true);
    try {
      const response = await api.post(
        `/api/work-orders/styled-detail-by-work-orders`,
        {
          workOrder_Id: techPackId,
          category_Id: category?.category?._id,
        }
      );
      setStyleDetail(response?.data?.data[0] || null);
    } catch (err) {
      console.error("Error fetching style details:", err);
      setStyleDetail(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStyleDetail();
  }, [techPackId]);

  const isDataAvailable = styleDetail && Object.keys(styleDetail).length > 0;
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
              <Box ml={2}>Loading style details...</Box>
            </Box>
          </TableCell>
        </TableRow>
      );
    }

    if (!styleDetail?.dynamicAttributes) {
      return (
        <TableRow>
          <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
            No style details found
          </TableCell>
        </TableRow>
      );
    }

    const attributes = Object.entries(styleDetail.dynamicAttributes);

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
                    Style Detail
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
                          "Edit Style Detail"
                        )
                      ) : isSmallScreen ? (
                        "Add"
                      ) : (
                        "Add Style Detail"
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

      <StyleDetailModal
        isOpen={modalIsOpenEdit}
        closeModal={closeModalEdit}
        onSubmit={handlePostSubmitEdit}
        techPackData={styleDetail}
        techPackId={techPackId}
        category_Id={category?.category?._id}
      />

      {styleDetail?.dynamicAttributes && (
        <Box mt={4}>
          <StyleImage
            techPackId={techPackId}
            styleDetail={styleDetail}
            category_Id={category?.category?._id}
          />
        </Box>
      )}
    </Box>
  );
}

export default StyleDetail;