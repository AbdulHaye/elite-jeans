import React from "react";
import TopSection from "./TopSection";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Button } from "@mui/material";
import Navbar from "../../../../../../Navbar/Navbar";
import DesignCommentSection from "./DesignCommentSection";

function DesignComment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const test = () => {
    navigate(-1);
  };
  return (
    <div>
      <div>
        <Navbar />

        <Box display="flex" justifyContent="flex-start" m={2}>
          <Button onClick={test} variant="contained" color="primary">
            {" "}
            Work Order
          </Button>
        </Box>
        <TopSection workOrderId={id} />
        <DesignCommentSection workOrderId={id} />
      </div>
    </div>
  );
}

export default DesignComment;
