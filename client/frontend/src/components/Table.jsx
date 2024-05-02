import React from "react";
import Navbar from "./NavBar";
import UploadFile from "./UploadFile";
import FileList from "./FileList";
import { useState } from "react";

export default function Table() {
  const [uploadCount, setUploadCount] = useState(0);  // Using a counter instead of a boolean

  const handleUploadSuccess = () => {
    setUploadCount(count => count + 1);  // Increment to trigger useEffect
  };

  return (
    <div className="app-container">
      <Navbar />
      <div className="app-section">
        <UploadFile onUploadSuccess={handleUploadSuccess} />
      </div>
      <div className="app-section">
        <FileList trigger={uploadCount} />
      </div>
    </div>
  );
}
