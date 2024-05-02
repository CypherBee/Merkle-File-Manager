import React from "react";
import { Link } from "react-router-dom";

export default function NavbarComponent() {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        File Management System
      </Link>
      <div className="nav-links">
        <Link to="/user" className="nav-link">
          Profile - To be implemented later with multiple uploads
        </Link>
      </div>
    </nav>
  );
}
