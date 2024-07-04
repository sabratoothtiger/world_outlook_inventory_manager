import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import {
    Box,
    Breadcrumbs,
    Link,
    Typography,
    IconButton,
    Menu,
    MenuItem,
  } from "@mui/material";
  import { DataGrid, GridToolbarQuickFilter } from "@mui/x-data-grid";
  import { useNavigate } from "react-router-dom";
  import { PurchaseOrderTableColumns } from "../components/TableColumns";
  import AddPurchaseOrder from "../components/AddPurchaseOrder";
  
  // Icons
  import MoreVertIcon from "@mui/icons-material/MoreVert";
  import HomeIcon from "@mui/icons-material/Home";

function CustomToolbar() {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          width: "100%",
          marginBottom: 2,
        }}
      >
        <GridToolbarQuickFilter sx={{ width: "20%" }} />
      </Box>
    );
  }

export default function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);  
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  async function fetchPurchaseOrders() {
    setLoading(true);
    const { data } = await supabase.from("purchase_orders").select("*").order('order_date', { ascending: false });
    setPurchaseOrders(data);
    setLoading(false);
  }

  var columns = PurchaseOrderTableColumns();
  columns = columns.map((col) => ({ ...col, flex: 1 })); // Automatically fill the width of the viewport

  const handleRowSelectionChange = (selection) => {
    if (selection.length === 1) {
      setSelectedRow(selection[0]);
    } else {
      setSelectedRow(null);
    }
  };

  const handleRowDoubleClick = (row) => {
    navigate(`/purchase-orders/${row.id}`);
  };
 

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handlePullFromGoodwill = async () => {
    setLoading(true);
    try {
      const url = process.env.REACT_APP_API_URL + "/api/fetch_goodwill_purchase_orders"
      const response = await fetch(
        url
      );
      const data = await response.json();
      if (data.status === "success") {
        console.log("Purchase orders fetched successfully");
        fetchPurchaseOrders();
      } else {
        console.error("Error fetching listings:", data.message);
      }
    } catch (error) {
      console.error("Error fetching listings:", error);
    }
    setLoading(false);
    handleMenuClose();
  };

  const handlePullFromEbay = () => {
    // Logic to pull data from eBay
    handleMenuClose();
  };

  return (
    <>
      <Box sx={{ padding: 2 }}>
        <Breadcrumbs aria-label="breadcrumb">
        <Link
        underline="hover"
        color="inherit"
        onClick={() => navigate("/")}
        sx={{ display: "flex", alignItems: "center", cursor: "pointer" }}
      >
        <HomeIcon sx={{ marginRight: 0.5 }} />
        
      </Link>
          <Link
            underline="hover"
            color="inherit"
            onClick={() => navigate("/purchase-orders")}
          >
            Purchase Orders
          </Link>
        </Breadcrumbs>
        <Box sx={{ display: "flex", alignItems: "center", marginBottom: 2 }}>
          <Typography variant="h4">Purchase Orders</Typography>
          <Box sx={{ display: "flex", alignItems: "center", marginLeft: "auto" }}>
          <AddPurchaseOrder fetchPurchaseOrders={fetchPurchaseOrders} />
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
        </Box>
        <Box sx={{ height: 400, width: "100%" }}>
          <Box sx={{ height: 500, width: "100%" }}>
            <DataGrid
              rows={purchaseOrders || []}
              columns={columns || []}
              loading={loading}
              pageSizeOptions={[25, 50, 100]}
              initialState={{
                 pagination: { 
                  paginationModel: {
                    pageSize: 25,
                  }
                },
                filter: {
                  filterModel: {
                    items: [
                      {
                        field: 'status', // The column field to filter
                        operator: 'isAnyOf', // The operator to use
                        value: ['Shipped', 'Ordered'], // The value to match
                      },
                    ],
                  },
                },
              }}
              components={{ Toolbar: CustomToolbar }}
              onSelectionModelChange={handleRowSelectionChange}
              onRowDoubleClick={handleRowDoubleClick}
              rowSelectionModel={selectedRow ? [selectedRow] : []}
              autoHeight
            />
          </Box>
        </Box>
      </Box>
    </>
  );
}