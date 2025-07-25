import React from "react";
import GardedSpecPage from "./GardedSpecPage";
import Navbar from "../../../../../../Navbar/Navbar";
import { useParams } from "react-router-dom";

function GardedSpecMainPage() {
  const { id } = useParams();
  return (
    <div>
      <div>
        <Navbar />
        <GardedSpecPage workOrderkId={id} />
      </div>
    </div>
  );
}

export default GardedSpecMainPage;
