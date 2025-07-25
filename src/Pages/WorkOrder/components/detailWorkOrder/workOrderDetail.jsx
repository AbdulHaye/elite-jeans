import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { 
  Box,
  Tab,
  Tabs,
  Typography,
  Paper
} from '@mui/material';
import Navbar from '../../../../Navbar/Navbar';
import WorkDetail from './component/WorkDetail';
import StyleDetail from './component/styleDetail';
import SampleRequestList from './component/SampleRequest/SampleRequest';
import ItemDetails from './component/ItemDetail/ItemDetails';
import WashDetail from './component/WashDetail/WashDetail';
import api from '../../../../ApiServices/api';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`category-tabpanel-${index}`}
      aria-labelledby={`category-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function WorkOrderDetail() {
  const { id } = useParams();
  const [workOrder, setWorkOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const fetchWorkOrder = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/work-orders/${id}`);
        setWorkOrder(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchWorkOrder();
  }, [id]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <Box textAlign="center" py={8}>
          <Typography>Loading work order details...</Typography>
        </Box>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Navbar />
        <Box textAlign="center" py={8} color="error.main">
          <Typography>Error loading work order: {error}</Typography>
        </Box>
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div>
        <Navbar />
        <Box textAlign="center" py={8}>
          <Typography>Work order not found</Typography>
        </Box>
      </div>
    );
  }

  // Determine if we need tabs based on categories count
  const hasMultipleCategories = workOrder.categories?.length > 1;

  return (
    <div>
      <Navbar />
      <WorkDetail techPackId={id} workOrder={workOrder} />
      <ItemDetails techPackId={id} workOrder={workOrder} />
    

      {hasMultipleCategories ? (
        <Paper sx={{ my: 4 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="category tabs"
          >
            {workOrder.categories.map((category, index) => (
              <Tab 
                key={category._id}
                label={`Category ${index + 1}: ${category.name}`}
                id={`category-tab-${index}`}
                aria-controls={`category-tabpanel-${index}`}
              />
            ))}
          </Tabs>

          {workOrder.categories.map((category, index) => (
            <TabPanel key={category._id} value={tabValue} index={index}>
              <StyleDetail 
                techPackId={id} 
                workOrder={workOrder} 
                category={category}
              />
              <WashDetail 
                techPackId={id} 
                workOrder={workOrder} 
                category={category}
              />
            </TabPanel>
          ))}
        </Paper>
      ) : (
        // Single category view (no tabs)
        <Box sx={{ my: 4 }}>
          {workOrder.categories?.length > 0 && (
            <>
              <StyleDetail 
                techPackId={id} 
                workOrder={workOrder} 
                category={workOrder.categories[0]}
              />
              <WashDetail 
                techPackId={id} 
                workOrder={workOrder} 
                category={workOrder.categories[0]}
              />
            </>
          )}
        </Box>
      )}


        <SampleRequestList techPackId={id} workOrder={workOrder} />
    </div>
  );
}

export default WorkOrderDetail;