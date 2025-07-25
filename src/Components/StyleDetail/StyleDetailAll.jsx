import React from "react";
import StyleDetail from "./styleDetail";
import StyleImage from "./styleImage";

function StyleDetailAll({ techPackId, categoryId }) {
 
  return (
    <div>
      <StyleDetail techPackId={techPackId} categoryId={categoryId}/>
      {/* <StyleImage /> */}
    </div>
  );
}

export default StyleDetailAll;
