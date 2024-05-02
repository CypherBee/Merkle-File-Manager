import React, { useEffect, useState } from "react";
import axios from "axios";
import File from "./File"; // Ensure this path is correct

function FileList({trigger}) {
  const [files, setFiles] = useState([]);
  const [downloadMessage, setDownloadMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const serverGetUrl = import.meta.env.VITE_SERVER_GET_URL;
        console.log("Server URL:", serverGetUrl);
        const response = await axios.get(serverGetUrl);
        setFiles(response.data.map(file => ({ filename: file.filename, id: file.id, uploadId: file.uploadId })));
        console.log(files);
      } catch (error) {
        console.error("Error fetching files:", error);
      }
    };

    fetchFiles();
  }, [trigger]);

  const downloadFile = async ({ id, filename }) => {
    try {
      const clientGetUrl = import.meta.env.VITE_CLIENT_GET_URL;
      const response = await axios.get(`${clientGetUrl}/${id}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      handleToast(`Download of ${filename} started...`);
    } catch (error) {
      console.error("Download error:", error);
      const errorMessage = await parseBlobError(error);
      handleToast(errorMessage);
    }
  };

  async function parseBlobError(error) {
    if (error.response && error.response.data instanceof Blob) {
      try {
        const errorText = await error.response.data.text();
        const errorData = JSON.parse(errorText);
        return errorData.message || "No error message was received";
      } catch (e) {
        return "Failed to parse error message";
      }
    }
    return error.message || "An error occurred";
  }

  function handleToast(message) {
    setDownloadMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 6000);
  }

  return (
    <>
      <h2 className="file-list-header">Available Files</h2>
      {showToast && <div className="toast-message">{downloadMessage}</div>}
      <ul className="file-list">
        {files.map((file, index) => (
          <File key={index} file={file} onDownload={downloadFile} />
        ))}
      </ul>
    </>
  );
}

export default FileList;
