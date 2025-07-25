import React from "react";
import Navbar from "../../../Navbar/Navbar";
import SampleSpecsTechpackPage from "./SampleSpecsTechpackPage";
import { useParams } from "react-router-dom";


function SampleSpecsMain() {
  const { id } = useParams();


  console.log(id,"idvidid ididid")
  return (
    <div>
     <Navbar />
     <SampleSpecsTechpackPage TechPackId={id} />
    </div>
  );
}

export default SampleSpecsMain;
