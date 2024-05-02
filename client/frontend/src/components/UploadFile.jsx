import React, { useState } from "react";
import axios from "axios";

function UploadFile({ onUploadSuccess }) {
  const [files, setFiles] = useState(null);
  const [msg, setMsg] = useState(null);

  const handleFileChange = (event) => {
    setFiles(event.target.files);
  };

  const handleUpload = async () => {
    if (!files || files.length === 0) {
      setMsg("No file selected");
      return;
    }

    setMsg("Preparing upload...");
    const formData = new FormData();

    // Loop to append files to formData
    Array.from(files).forEach((file) => formData.append("files", file));

    try {
      const clientPostUrl = import.meta.env.VITE_CLIENT_POST_URL;
      const response = await axios.post(clientPostUrl, formData);
      setMsg("Upload successful");
      onUploadSuccess();
      console.log("File uploaded successfully:", response.data);
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage =
        error.response?.data?.response ||
        "Upload failed without error message from server";
      setMsg(errorMessage);
    }
  };

  return (
    <div className="App">
      <h2 className="upload-header">Upload Files</h2>
      <input type="file" onChange={handleFileChange} multiple />
      <button onClick={handleUpload} className="upload-button mt-2">
        Upload Files and Save Merkle Root
      </button>
      <br />
      {msg && (
        <div
          className={`alert ${
            msg.includes("successful") ? "alert-success" : "alert-danger"
          } mt-2`}
          role="alert"
        >
          {msg}
        </div>
      )}
    </div>
  );
}

export default UploadFile;
