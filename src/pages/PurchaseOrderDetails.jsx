import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { supabase } from "../client";
import EditPurchaseOrder from "../components/EditPurchaseOrder";
import DeletePurchaseOrder from "../components/DeletePurchaseOrder";
import InventoryItemsTable from "../components/PurchaseOrderInventoryItemsTable";
import dayjs from "dayjs";

export default function PurchaseOrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
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
      .eq("purchase_order_reference", id);
    setInventoryItems(data);
  }, [id]);

  useEffect(() => {
    fetchPurchaseOrder();
    fetchInventoryItems();
  }, [id, fetchPurchaseOrder, fetchInventoryItems]);

  if (!purchaseOrder) {
    return <div>Loading...</div>;
  }

  return (
    <Box sx={{ padding: 2 }}>
      <Breadcrumbs aria-label="breadcrumb">
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
      <Typography variant="body1" gutterBottom>
        Supplier: {purchaseOrder.supplier}
      </Typography>
      <Typography variant="body1" gutterBottom>
        Order Date:{" "}
        {purchaseOrder.order_date
          ? dayjs(purchaseOrder.order_date).format("YYYY-MM-DD")
          : "N/A"}
      </Typography>
      <Typography variant="body1" gutterBottom>
        Status: {purchaseOrder.status}
      </Typography>
      <Typography variant="body1" gutterBottom>
        Tracking Number: {purchaseOrder.tracking_number}
      </Typography>
      <Typography variant="body1" gutterBottom>
        Acquisition Cost:{" "}
        {purchaseOrder.acquisition_cost.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        })}
      </Typography>
      <Typography variant="body1" gutterBottom>
        Avg Cost per Item:{" "}
        {(purchaseOrder.itemCount === 0 || isNaN(purchaseOrder.itemCount) || isNaN(purchaseOrder.acquisition_cost)
            ? 0.00
            : purchaseOrder.acquisition_cost / purchaseOrder.itemCount
        ).toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
        })}
        </Typography>

      <Box sx={{ height: 400, width: "100%", marginTop: 2 }}>
        <InventoryItemsTable
          purchaseOrder={purchaseOrder}
          inventoryItems={inventoryItems}
          fetchInventoryItems={fetchInventoryItems}
        />
      </Box>
    </Box>
  );
}
