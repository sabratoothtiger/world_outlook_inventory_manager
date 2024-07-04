import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { supabase } from "../supabase";
import EditPurchaseOrder from "../components/EditPurchaseOrder";
import DeletePurchaseOrder from "../components/DeletePurchaseOrder";
import InventoryItemsTable from "../components/PurchaseOrderInventoryItemsTable";
import { formatTrackingUrl } from "../utils/dataFormatting";
import { Grid, Paper, Button } from "@mui/material";
import dayjs from "dayjs";
import HomeIcon from "@mui/icons-material/Home";
import CheckIcon from '@mui/icons-material/Check';
import { useSnackbar } from "notistack";

export default function PurchaseOrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [purchaseOrder, setPurchaseOrder] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);

  const fetchPurchaseOrder = useCallback(async () => {
    const { data } = await supabase
      .from("purchase_orders")
      .select("*")
      .eq("id", id)
      .single();
    setPurchaseOrder(data);
  }, [id]);

  const fetchInventoryItems = useCallback(async () => {
    const { data } = await supabase
      .from("inventory_items")
      .select("*")
      .eq("purchase_order_reference_id", id);
    setInventoryItems(data);
  }, [id]);

  useEffect(() => {
    fetchPurchaseOrder();
    fetchInventoryItems();
  }, [id, fetchPurchaseOrder, fetchInventoryItems]);

  if (!purchaseOrder) {
    return <div>Loading...</div>;
  }

  const handleStatusProcessed = async () => {
    try {
      const { error } = await supabase
        .from("purchase_orders")
        .update({ status: "Processed" })
        .eq("id", id);
      if (error) throw new Error(error.message);
      await supabase
      .from('purchase_order_histories')
      .insert([
        { purchase_order_id: id, status: "Processed" },
      ]) 
      fetchPurchaseOrder(); 
      enqueueSnackbar("Purchase order updated successfully", {
        variant: "success",
      });
    } catch (error) {
      enqueueSnackbar("Error updating purchase order: " + error.message, {
        variant: "error",
      });
      console.error("Error updating purchase order:", error);
    }
  };

  const handleInventoryItemsUpdate = () => {
    fetchPurchaseOrder();
  };

  return (
    <Box sx={{ padding: 2 }}>
      <Breadcrumbs aria-label="breadcrumb">
        <Link
          underline="hover"
          color="inherit"
          onClick={() => navigate("/")}
          sx={{ display: "flex", alignItems: "center" }}
        >
          <HomeIcon sx={{ marginRight: 0.5 }} />
          Home
        </Link>
        <Link
          underline="hover"
          color="inherit"
          onClick={() => navigate("/purchase-orders")}
        >
          Purchase Orders
        </Link>
        <Typography color="textPrimary">{id}</Typography>
      </Breadcrumbs>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ display: "flex", justifyContent: "space-between" }}
      >
        Purchase Order: {id}
        <Box>
          <Button
            onClick={handleStatusProcessed}
            variant="contained"
            color="success"
            sx={{ mr: 1 }}
            startIcon={<CheckIcon />}
          >
            Mark as Processed
          </Button>
          <EditPurchaseOrder
            purchaseOrder={purchaseOrder}
            setPurchaseOrder={setPurchaseOrder}
            fetchPurchaseOrder={fetchPurchaseOrder}
          />
          <DeletePurchaseOrder
            purchaseOrderId={purchaseOrder.id}
            fetchPurchaseOrders={fetchPurchaseOrder}
          />
        </Box>
      </Typography>
      <Paper elevation={3} style={{ padding: '16px', marginBottom: '16px' }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="body1" gutterBottom>
              Supplier Reference ID: {purchaseOrder.supplier_reference_id}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="body1" gutterBottom>
              Order Date:{" "}
              {purchaseOrder.order_date
                ? dayjs(purchaseOrder.order_date).format("YYYY-MM-DD")
                : "N/A"}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="body1" gutterBottom>
              Status: {purchaseOrder.status}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="body1" gutterBottom>
              Tracking Number: {formatTrackingUrl(purchaseOrder.tracking_number)}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="body1" gutterBottom>
              Acquisition Cost:{" "}
              {purchaseOrder.acquisition_cost.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              })}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="body1" gutterBottom>
              Avg Cost per Item:{" "}
              {(purchaseOrder.item_count === 0 || isNaN(purchaseOrder.item_count) || isNaN(purchaseOrder.acquisition_cost)
                  ? '$--.--'
                  : purchaseOrder.acquisition_cost / purchaseOrder.item_count
              ).toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
              })}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      <Box sx={{ height: 400, width: "100%", marginTop: 2 }}>
        <InventoryItemsTable
          purchaseOrder={purchaseOrder}
          inventoryItems={inventoryItems}
          setInventoryItems={setInventoryItems}
          onInventoryItemsChange={handleInventoryItemsUpdate}
        />
      </Box>
    </Box>
  );
}
