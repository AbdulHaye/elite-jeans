import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import "./VerticalTabs.css";
import Navbar from "../../../Navbar/Navbar";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import api from "../../../ApiServices/api";
import { useNavigate } from "react-router-dom";

const VerticalTabs = () => {
  const [activeTab, setActiveTab] = useState("Vendors");
  const [data, setData] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ name: "" });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateId, setUpdateId] = useState(null);
  const [newName, setNewName] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const apiEndpoints = useMemo(
    () => ({
      Vendors: "/api/vendors",
      Categories: "/api/categories",
      Subcategories: "/api/subcategories",
      ItemTypes: "/api/item-types",
      Colors: "/api/colors",
      SizeScales: "/api/size-scales",
      SizeBreaks: "/api/size-breaks",
      Clients: "/api/clients",
      // itemType: "/api/item-type",
      Class: "/api/classes",
    }),
    []
  );
  const navigate = useNavigate();
  const fetchData = useCallback(
    async (tab) => {
      try {
        const response = await api.get(apiEndpoints[tab]);
        setData(response.data);
      } catch (error) {
        console.error(`Error fetching ${tab} data:`, error);
        setSnackbarMessage(`Failed to fetch ${tab} data.`);
        setSnackbarSeverity("error");
        setSnackbarOpen(true);

         if (error?.message && error?.message?.includes("Unauthorized")) {
          navigate("/login");
        }
      }
    },
    [apiEndpoints]
  );

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab, fetchData]);

  const handleAddData = async () => {
    try {
      const payload =
        activeTab === "itemType"
          ? { name: formData.name }
          : { name: formData.name };

      const response = await api.post(apiEndpoints[activeTab], payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 201 || response.status === 200) {
        setSnackbarMessage("Data added successfully!");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
        setShowAddModal(false);
        setFormData({ name: "" });
        fetchData(activeTab);
      }
    } catch (error) {
      console.error("Error adding data:", error);
      setSnackbarMessage("Failed to add data.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleUpdateData = async () => {
    if (newName && updateId) {
      try {
        const requestBody =
          activeTab === "itemType"
            ? { name: newName }
            : { name: newName };

        const response = await api.put(
          `${apiEndpoints[activeTab]}/${updateId}`,
          requestBody,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response) {
          setSnackbarMessage("Data updated successfully!");
          setSnackbarSeverity("success");
          setSnackbarOpen(true);
          setShowUpdateModal(false);
          setNewName("");
          fetchData(activeTab);
        }
      } catch (error) {
        console.error("Error updating data:", error);
        setSnackbarMessage("Failed to update data.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      }
    }
  };

  const handleDeleteData = async () => {
    try {
      const response = await api.delete(
        `${apiEndpoints[activeTab]}/${deleteId}`
      );

      if (response.status === 200) {
        setSnackbarMessage("Data deleted successfully!");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
        setShowDeleteModal(false);
        fetchData(activeTab);
      }
    } catch (error) {
      console.error("Error deleting data:", error);
      setSnackbarMessage("Failed to delete data.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <>
      <Navbar />
      <div className="give_top_margin">
        <p className="configuration_text_style">Configurations</p>
      </div>
      <div className="container">
        <div className="tabs">
          {Object.keys(apiEndpoints)?.map((tab) => (
            <button
              key={tab}
              className={`tab-button ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="content">
          <button
            className="add-button add_button_config"
            style={{ marginTop: "20px", marginBottom: "20px" }}
            onClick={() => setShowAddModal(true)}
          >
            Add {activeTab}
          </button>

          {Array.isArray(data) && data.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>
                      {activeTab === "itemType" ? "Garment Type" : "Name"}
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item) => (
                    <tr key={item?._id}>
                      <td>
                        {activeTab === "itemType"
                          ? item?.name
                          : item?.name}
                      </td>
                      <td>
                        <button
                          className="action-button update"
                          onClick={() => {
                            setUpdateId(item?._id);
                            setNewName(
                              activeTab === "itemType"
                                ? item?.name
                                : item?.name
                            );
                            setShowUpdateModal(true);
                          }}
                        >
                          Update
                        </button>
                        <button
                          className="action-button delete"
                          onClick={() => {
                            setDeleteId(item?._id);
                            setShowDeleteModal(true);
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No data available.</p>
          )}
        </div>

        {/* Add Modal */}
        {showAddModal && (
          <div className="modal">
            <div className="modal-content">
              <h3>Add {activeTab}</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddData();
                }}
              >
                <label>
                  {activeTab === "itemType" ? "Garment Type" : "Name"}:
                  <input
                    type="text"
                    value={formData?.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </label>
                <div className="modal-actions">
                  <button type="submit" className="modal-button">
                    Add
                  </button>
                  <button
                    type="button"
                    className="modal-button cancel"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Update Modal */}
        {showUpdateModal && (
          <div className="modal">
            <div className="modal-content">
              <h3>Update {activeTab}</h3>
              <label>
                New {activeTab === "itemType" ? "Garment Type" : "Name"}:
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </label>
              <div className="modal-actions">
                <button onClick={handleUpdateData} className="modal-button">
                  Update
                </button>
                <button
                  type="button"
                  className="modal-button cancel"
                  onClick={() => setShowUpdateModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="modal">
            <div className="modal-content">
              <h3>Are you sure you want to delete this {activeTab}?</h3>
              <div className="modal-actions">
                <button
                  onClick={handleDeleteData}
                  className="modal-button delete"
                >
                  Yes, Delete
                </button>
                <button
                  type="button"
                  className="modal-button cancel"
                  onClick={() => setShowDeleteModal(false)}
                >
                  No, Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default VerticalTabs;
