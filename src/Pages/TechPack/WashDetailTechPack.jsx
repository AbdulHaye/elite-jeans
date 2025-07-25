import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@mui/material";
import WashImageTechPack from "./SampleSpecs/WashImageTechPack";
import WashDetailTechpackModal from "./SampleSpecs/WashDetailTechpackModal";
import api from "../../ApiServices/api";

function WashDetailTechPack({ techPackId, categoryId }) {
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
          techpack_Id: techPackId,
          category_Id: categoryId,
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
  return (
    <>
      <div className="container">
        <div className="style-detail-container">
          <table className="style-detail-table">
            <thead>
              <tr>
                <th colSpan="4" className="style-detail-header">
                  <div
                    className="style-detail-header_div"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      width: "100%",
                      gap: "16px",
                    }}
                  >
                    <span>Color Detail & Wash Detail</span>
                    <span>
                     {(userRole === 'admin' || userRole === 'general') && (
                      <Button
                        variant="contained"
                        sx={{
                          backgroundColor: "#1976D2",
                          color: "white",
                          fontSize: "16px",
                          padding: "8px 16px",
                          borderRadius: "8px",
                          textTransform: "none",
                          "&:hover": {
                            backgroundColor: "#1565C0",
                          },
                        }}
                        onClick={openModalEdit}
                        disabled={isLoading}
                      >
                        {isLoading
                          ? "Loading..."
                          : isDataAvailable
                          ? "Edit Color and Wash Detail"
                          : "Add Color and Wash Detail"}
                      </Button>
)}
                  
                    </span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="4">Loading color and wash details...</td>
                </tr>
              ) : washDetail?.dynamicAttributes ? (
                Object.entries(washDetail.dynamicAttributes)
                  .reduce((rows, [key, value], index) => {
                    const rowIndex = Math.floor(index / 2);
                    if (!rows[rowIndex]) {
                      rows[rowIndex] = [];
                    }
                    rows[rowIndex].push({ key, value });
                    return rows;
                  }, [])
                  .map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map(({ key, value }, colIndex) => (
                        <React.Fragment key={colIndex}>
                          <td className="label_style">{key}</td>
                          <td className="value_style">{value}</td>
                        </React.Fragment>
                      ))}
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan="4">No color and wash details found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
{console.log( "for wash detail :",categoryId)}
        <WashDetailTechpackModal
          isOpen={modalIsOpenEdit}
          closeModal={closeModalEdit}
          onSubmit={handlePostSubmitEdit}
          techPackData={washDetail}
          techPackId={techPackId}
          category= {categoryId}

        />
      </div>
      {washDetail?.dynamicAttributes && (
      <WashImageTechPack techPackId={techPackId} washDetail={washDetail}  category= {categoryId} />
    )}
    </>
  );
}

export default WashDetailTechPack;