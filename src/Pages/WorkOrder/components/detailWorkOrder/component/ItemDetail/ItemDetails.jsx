import React, { useState, useEffect } from "react";
import "./ItemDetails.css";
import axios from "axios";
import ItemDetailModal from "../../../../../TechPack/Modals/WorkOrder/DetailPage/ItemDetail/ItemDetailModal";
import { useParams } from "react-router-dom";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { Button } from "@mui/material";
import { ContactlessOutlined } from "@mui/icons-material";
import api from "../../../../../../ApiServices/api";

function ItemDetails() {
  const { id } = useParams();
  const workrderId = id;
  console.log(workrderId, "wororderId detailssss");

  const [itemDetail, setItemDetail] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(false);

  const fetchItemDetails = async () => {
    setIsLoading(true);
    setApiError(false);
    try {
      const response = await api.get(
        `/api/work-orders/item-detail/workorders/${workrderId}`,
        { headers: { "Content-Type": "application/json" } }
      );
      setItemDetail(response?.data?.data);
    } catch (error) {
      console.error(
        "Error fetching item details",
        error?.response?.data || error?.message
      );
      setApiError(true);
      setItemDetail([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddClick = () => {
    setCurrentRequest(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (request) => {
    setCurrentRequest(request);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/api/work-orders/item-detail/${deleteId}`);
      setSnackbarMessage("Item deleted successfully!");
      setSnackbarOpen(true);
      fetchItemDetails();
    } catch (error) {
      console.error("Error deleting sample request", error);
      setSnackbarMessage("Failed to delete item.");
      setSnackbarOpen(true);
    } finally {
      setShowDeleteModal(false);
      setSnackbarOpen(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  const handleFormSubmit = async (data) => {
    try {
      const submissionData = {
        ...data,
        workrderId,
      };
      if (currentRequest) {
        await api.put(
          `/api/work-orders/item-detail/${currentRequest?._id}`,
          submissionData
        );
      } else {
        await api.post("/api/work-orders/item-detail/create", submissionData);
      }
      setIsModalOpen(false);
      fetchItemDetails();
    } catch (error) {
      console.error("Error submitting form data", error);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  useEffect(() => {
    fetchItemDetails();
  }, [workrderId]);

  const userRole = localStorage.getItem("role");

  return (
    <div className="item-details-wrapper">
      <div className="item-details-container">
        <div className="top_item_detail">
          <span>Item Details</span>
          <span>
            {(userRole === "admin" || userRole === "general") && (
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
                onClick={handleAddClick}
              >
                + Add Item
              </Button>
            )}
          </span>
        </div>
        <div className="table-scroll-container">
          <table className="item-details-table">
            <thead>
              <tr>
                <th>Style #</th>
                <th>Size</th>
                <th>Size Scale</th>
                <th>Size Breakdown</th>
                <th>Packing Instructions</th>
                <th>Quantity</th>
                <th>Comments / Alterations</th>
                <th>Internal Comments</th>
                <th>Client Name</th>
                <th>Customer PO #</th>
                <th>Special Handling</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="12" style={{ textAlign: "center" }}>
                    Loading...
                  </td>
                </tr>
              ) : apiError ? (
                <tr>
                  <td colSpan="12" style={{ textAlign: "center" }}>
                    No data found
                  </td>
                </tr>
              ) : itemDetail && itemDetail?.length > 0 ? (
                itemDetail?.flatMap((request) => {
                  // If no package_by_size, return a single row
                  if (!request?.package_by_size?.length) {
                    return (
                      <tr key={request?._id}>
                        <td>{request?.stylenumber?.number}</td>
                        <td>No Size Available</td>
                        <td>{request?.size_scale?.name || ""}</td>
                        <td>{request?.size_break?.name || ""}</td>
                        <td>
                          {request?.number_of_cartons || request?.number_of_master_polybags_per_master_carton || request?.number_of_pieces_per_master_carton ? (
                            <div>
                              {request?.number_of_cartons && (
                                <div>Number of cartons: {request.number_of_cartons}</div>
                              )}
                              {request?.number_of_master_polybags_per_master_carton && (
                                <div>Master polybags per carton: {request.number_of_master_polybags_per_master_carton}</div>
                              )}
                              {request?.number_of_pieces_per_master_carton && (
                                <div>Pieces per carton: {request.number_of_pieces_per_master_carton}</div>
                              )}
                            </div>
                          ) : (
                            "No Packing Instructions available"
                          )}
                        </td>
                        <td>{request?.quantity || ""}</td>
                        <td>{request?.comments || ""}</td>
                        <td>{request?.internal_comments || ""}</td>
                        <td>{request?.client_Id?.name || ""}</td>
                        <td>{request?.customer_po_number || ""}</td>
                   <td>
  {Object.entries(request)
    .filter(([fieldName, value]) => 
      [
        "hanger",
        "price_tickets", 
        "individual_poly_bag"
      ].includes(fieldName)
    ) // <-- This was missing
    .filter(([fieldName, value]) => value === true)
    .map(([fieldName, value]) => {
      const displayNames = {
        hanger: "Hanger",
        price_tickets: "Price Tickets",
        individual_poly_bag: "Individual Poly Bag",
      };
      return (
        <div key={fieldName}>
          {displayNames[fieldName]}
        </div>
      );
    })
  }
</td>
                        <td>
                          {(userRole === "admin" || userRole === "general") && (
                            <div className="action-button-container">
                              <button className="edit-button">
                                <i
                                  className="fas fa-edit"
                                  onClick={() => handleEditClick(request)}
                                ></i>
                              </button>
                              <button className="delete-button">
                                <i
                                  className="fas fa-trash"
                                  onClick={() => handleDeleteClick(request?._id)}
                                ></i>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  }

                  // If package_by_size exists, create a row for each size
                  return request.package_by_size.map((pkg, index) => (
                    <tr key={`${request?._id}-${index}`}>
                      <td>{request?.stylenumber?.number}</td>
                      <td>{pkg.size}</td>
                      <td>{request?.size_scale?.name || ""}</td>
                      <td>{request?.size_break?.name || ""}</td>
                      <td>
                        <div>
                          <div>
                            Pieces per polybag:
                            {pkg.pieces_per_polybag}
                          </div>
                          <div>
                            Master polybags per carton:
                            {pkg.master_polybags_per_carton}
                          </div>
                          <div>
                            Pieces per carton:
                            {pkg.pieces_per_carton}
                          </div>
                          <div>
                            Cartons: {pkg.cartons}
                          </div>
                        </div>
                      </td>
                      <td>{pkg.quantity}</td>
                      <td>{request?.comments || ""}</td>
                      <td>{request?.internal_comments || ""}</td>
                      <td>{request?.client_Id?.name || ""}</td>
                      <td>{request?.customer_po_number || ""}</td>
                      <td>
                        {Object?.entries(request)
                          ?.filter(([fieldName, value]) =>
                            [
                              "hanger",
                              "price_tickets",
                              "individual_poly_bag",
                            ].includes(fieldName))
                          ?.filter(([fieldName, value]) => value === true)
                          ?.map(([fieldName, value]) => {
                            const displayNames = {
                              hanger: "Hanger",
                              price_tickets: "Price Tickets",
                              individual_poly_bag: "Individual Poly Bag",
                            };
                            return (
                              <div key={fieldName}>{displayNames[fieldName]}</div>
                            );
                          })}
                      </td>
                      <td>
                        {(userRole === "admin" || userRole === "general") && (
                          <div className="action-button-container">
                            <button className="edit-button">
                              <i
                                className="fas fa-edit"
                                onClick={() => handleEditClick(request)}
                              ></i>
                            </button>
                            <button className="delete-button">
                              <i
                                className="fas fa-trash"
                                onClick={() => handleDeleteClick(request?._id)}
                              ></i>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ));
                })
              ) : (
                <tr>
                  <td colSpan="12" style={{ textAlign: "center" }}>
                    No data found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Are you sure you want to delete this item?</h3>
            <div className="modal-actions">
              <button
                onClick={handleDeleteConfirm}
                className="modal-button delete"
              >
                Yes, Delete
              </button>
              <button
                type="button"
                className="modal-button cancel"
                onClick={handleDeleteCancel}
              >
                No, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Snackbar for Success Message */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity="success">
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Item Detail Modal */}
      {isModalOpen && (
        <ItemDetailModal
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleFormSubmit}
          request={currentRequest}
        />
      )}
    </div>
  );
}

export default ItemDetails;