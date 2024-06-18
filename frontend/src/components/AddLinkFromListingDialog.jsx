import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Select,
  MenuItem,
  Grid,
} from "@mui/material";
import { supabase } from "../supabase";

const AddLinkFromListingDialog = ({ listingId, open, onClose, onSave }) => {
  const [inventoryItemId, setInventoryItemId] = useState("");
  const [inventoryItems, setInventoryItems] = useState([]);

  useEffect(() => {
    fetchInventoryItems();
  });

  async function fetchInventoryItems() {
    const { data } = await supabase
      .from("inventory_items")
      .select("id")
      .order("id", { ascending: true })
      .is('listing_id', null);
    setInventoryItems(data.map((inventoryItem) => inventoryItem.id));
  }
  const handleSave = () => {
    onSave(listingId, inventoryItemId);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Link Inventory Item</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} style={{ marginTop: "5px" }}>
          <Grid item xs={12}>
              <Select
                autoFocus
                value={inventoryItemId}
                onChange={(e) => setInventoryItemId(e.target.value)}
                fullWidth
              >
                {inventoryItems.map((inventoryItem) => (
                  <MenuItem key={inventoryItem} value={inventoryItem}>
                    {inventoryItem}
                  </MenuItem>
                ))}
              </Select>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave}>Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddLinkFromListingDialog;
