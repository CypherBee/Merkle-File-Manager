import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload } from "@fortawesome/free-solid-svg-icons";

function File({ file, onDownload }) {
  return (
    <li className="file-item">
      <div className="file-name">
        <strong>Filename:</strong> {file.filename}
      </div>
      <div className="file-name"> 
        <strong>Upload ID:</strong> {file.uploadId}
      </div>
      <button className="download-button" onClick={() => onDownload(file)}>
        <FontAwesomeIcon icon={faDownload} />
      </button>
    </li>
  );
}

export default File;
