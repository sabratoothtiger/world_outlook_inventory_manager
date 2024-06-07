import React, { useState, useEffect } from "react";
import { supabase } from "../client";
import AddPurchaseOrderForm from "../components/AddPurchaseOrderForm";
import PurchaseOrderTableEditable from "../components/PurchaseOrderTableEditable";
import {
  Box,
  Breadcrumbs,
  Link,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  TextField, // Import TextField for search field
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import MoreVertIcon from "@mui/icons-material/MoreVert";

export default function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);  
  const [filteredPurchaseOrders, setFilteredPurchaseOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState(""); // State for search query
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  async function fetchPurchaseOrders() {
    setLoading(true);
    const { data } = await supabase.from("purchase_orders").select("*");
    setPurchaseOrders(data);
    setFilteredPurchaseOrders(data);
    setLoading(false);
  }

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handlePullFromGoodwill = () => {
    // Logic to pull data from Goodwill
    handleMenuClose();
  };

  const handlePullFromEbay = () => {
    // Logic to pull data from eBay
    handleMenuClose();
  };

  const handleSearchChange = (event) => {
    const query = event.target.value.toLowerCase();
    const filteredOrders = purchaseOrders.filter((order) => {
      for (const key in order) {
        if (Object.prototype.hasOwnProperty.call(order, key)) {
          const value = String(order[key]).toLowerCase();
          if (value.includes(query) || (typeof order[key] === "number" && value.includes(parseFloat(query)))) {
            return true;
          }
        }
      }
      return false;
    });
    setSearchQuery(query);
    setFilteredPurchaseOrders(filteredOrders);
  };

  return (
    <>
      <Box sx={{ padding: 2 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link
            underline="hover"
            color="inherit"
            onClick={() => navigate("/purchase-orders")}
          >
            Purchase Orders
          </Link>
        </Breadcrumbs>
        <Typography
          variant="h4"
          gutterBottom
          sx={{ display: "flex", justifyContent: "space-between" }}
        >
          Purchase Orders
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <AddPurchaseOrderForm fetchPurchaseOrders={fetchPurchaseOrders} />
            <IconButton
              color="inherit"
              aria-label="more"
              aria-controls="purchase-menu"
              aria-haspopup="true"
              onClick={handleMenuClick}
            >
              <MoreVertIcon />
            </IconButton>
            <Menu
              id="purchase-menu"
              anchorEl={anchorEl}
              keepMounted
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handlePullFromGoodwill}>Pull from Goodwill</MenuItem>
              <MenuItem onClick={handlePullFromEbay}>Pull from eBay</MenuItem>
            </Menu>
          </Box>
        </Typography>

        {/* Search field */}
        <TextField
          label="Search"
          variant="outlined"
          value={searchQuery}
          onChange={handleSearchChange}
          sx={{ marginBottom: 2 }}
        />

        <Box sx={{ height: 400, width: "100%", marginTop: 2 }}>
          <PurchaseOrderTableEditable rows={filteredPurchaseOrders} loading={loading} />
        </Box>
      </Box>
    </>
  );
}
