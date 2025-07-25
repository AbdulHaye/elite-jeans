import React, { useEffect, useState } from "react";
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
import StyleImage from "./styleImage";
import StyleDetailTechpeck from "./StyleDetailTechpeck";
import api from "../../ApiServices/api";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

function StyleDetail({ techPackId, categoryId }) {
  const [styleDetail, setStyleDetail] = useState(null);
  const [dynamicAttributes, setDynamicAttributes] = useState([]);
  const [modalIsOpenEdit, setModalIsOpenEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddMode, setIsAddMode] = useState(true);

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const openModalEdit = () => setModalIsOpenEdit(true);
  const closeModalEdit = () => setModalIsOpenEdit(false);

  const handlePostSubmitEdit = (newData) => {
    setStyleDetail(newData);
    setIsAddMode(false);
    closeModalEdit();
    fetchStyleDetail();
  };

  const fetchStyleDetail = async () => {
    if (!techPackId) return;

    setIsLoading(true);
    try {
      const response = await api.post(
        `/api/work-orders/styled-detail-by-work-orders`,
        {
          techpack_Id: techPackId,
          category_Id: categoryId,
        }
      );
      const data = response.data.data[0] || null;
      setStyleDetail(data);

      if (data?.dynamicAttributes) {
        const attributes = Object.entries(data.dynamicAttributes).map(
          ([key, value]) => ({ key, value })
        );
        setDynamicAttributes(attributes);
        setIsAddMode(false);
      } else {
        setDynamicAttributes([]);
        setIsAddMode(true);
      }
    } catch (err) {
      console.error("Error fetching style details:", err);
      setStyleDetail(null);
      setDynamicAttributes([]);
      setIsAddMode(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStyleDetail();
  }, [techPackId]);

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

    if (dynamicAttributes.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
            No style details found
          </TableCell>
        </TableRow>
      );
    }

    if (isSmallScreen) {
      // Mobile view - single column
      return dynamicAttributes.map((attr, index) => (
        <TableRow key={index}>
          <TableCell sx={{ fontWeight: "bold", width: "40%" }}>
            {attr.key}
          </TableCell>
          <TableCell>{attr.value || "N/A"}</TableCell>
        </TableRow>
      ));
    } else {
      // Desktop/tablet view - two columns
      return Array(Math.ceil(dynamicAttributes.length / 2))
        .fill()
        .map((_, rowIndex) => {
          const firstItem = dynamicAttributes[rowIndex * 2];
          const secondItem = dynamicAttributes[rowIndex * 2 + 1];

          return (
            <TableRow key={rowIndex}>
              {firstItem && (
                <>
                  <TableCell sx={{ fontWeight: "bold", width: "20%" }}>
                    {firstItem.key}
                  </TableCell>
                  <TableCell sx={{ width: "30%" }}>
                    {firstItem.value || "N/A"}
                  </TableCell>
                </>
              )}
              {secondItem && (
                <>
                  <TableCell sx={{ fontWeight: "bold", width: "20%" }}>
                    {secondItem.key}
                  </TableCell>
                  <TableCell sx={{ width: "30%" }}>
                    {secondItem.value || "N/A"}
                  </TableCell>
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

  const userRole = localStorage.getItem("role");
  const isDataAvailable = dynamicAttributes.length > 0;

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
                      ) : isAddMode ? (
                        isSmallScreen ? (
                          "Add"
                        ) : (
                          "Add Style Detail"
                        )
                      ) : isSmallScreen ? (
                        "Edit"
                      ) : (
                        "Edit Style Detail"
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

      <StyleDetailTechpeck
        isOpen={modalIsOpenEdit}
        closeModal={closeModalEdit}
        onSubmit={handlePostSubmitEdit}
        techPackData={styleDetail}
        techPackId={techPackId}
        isAddMode={isAddMode}
        categoryId={categoryId}
      />

      {styleDetail?.dynamicAttributes && (
        <Box mt={4}>
          <StyleImage
            techPackId={techPackId}
            styleDetail={styleDetail}
            categoryId={categoryId}
          />
        </Box>
      )}
    </Box>
  );
}

export default StyleDetail;