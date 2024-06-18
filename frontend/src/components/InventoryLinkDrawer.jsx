import React, { useCallback, useEffect, useState } from "react";
import {
  Drawer,
  Box,
  Typography,
  Autocomplete,
  TextField,
  Button,
  Divider,
} from "@mui/material";
import { supabase } from "../supabase";
import { enqueueSnackbar } from "notistack";

const InventoryLinkDrawer = ({
  openLinkDrawer,
  handleLinkDrawerClose,
  listing,
  setInventoryItem,
  updateListingById,
}) => {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [suggestedItem, setSuggestedItem] = useState(null);
  const fetchUnlinkedInventoryItems = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*, inventory_item_statuses(is_linkable)")
        .is("listing_id", null)
        .eq("inventory_item_statuses.is_linkable", true);

      if (error) throw new Error(error.message);
      setInventoryItems(data);
    } catch (error) {
      enqueueSnackbar("Error fetching inventory items", { variant: "error" });
      console.error("Error fetching inventory items: ", error);
    }
  }, []); // Add specific dependencies if there are any

  const fetchSuggestedItem = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*, inventory_item_statuses(is_linkable)")
        .eq("serial_number", listing.serial_number)
        .is("listing_id", null)
        .eq("inventory_item_statuses.is_linkable", true);

      if (error) throw new Error(error.message);

      if (data.length > 0) {
        setSuggestedItem(data[0]);
      }
    } catch (error) {
      enqueueSnackbar("Error fetching suggested inventory item", {
        variant: "error",
      });
      console.error("Error fetching suggested inventory item: ", error);
    }
  }, [listing]);

  const fetchLinkedInventoryItem = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("listing_id", listing.id);

      if (error) throw new Error(error.message);
      if (data.length > 0) {
        setSelectedItem(data[0]);
      } else {
        fetchSuggestedItem();
      }
    } catch (error) {
      enqueueSnackbar("Error fetching linked inventory item", {
        variant: "error",
      });
      console.error("Error fetching linked inventory item: ", error);
    }
  }, [listing.id, fetchSuggestedItem]); // Assuming listing.id is stable, or comes from props or state that does not change unexpectedly

  useEffect(() => {
    if (listing) {
      fetchUnlinkedInventoryItems();
      fetchLinkedInventoryItem();
    }
  }, [listing, fetchUnlinkedInventoryItems, fetchLinkedInventoryItem]);

  const handleUnlink = async () => {
    try {
      console.log("Attempting unlink:", selectedItem); // Logging with JSON.stringify

      // Get current inventory_item with current listing_id value
      const { data, error: fetchingInventoryItem } = await supabase
        .from("inventory_items")
        .select('id')
        .eq("listing_id", listing.id);
      if (fetchingInventoryItem) throw new Error(fetchingInventoryItem.message);

      // Set listing_id on inventory item to null (unlink)
      const { error } = await supabase
        .from("inventory_items")
        .update({ listing_id: null, status: "Received (unlisted)" })
        .eq("listing_id", listing.id);
      if (error) throw new Error(error.message);

      // Insert into inventory_item_histories
      await supabase
        .from("inventory_item_histories")
        .insert([{ inventory_item_id: data[0].id, status: "Received (unlisted)" }]);

      // Update listings table is_linked to false
      await supabase
        .from("listings")
        .update({ is_linked: false })
        .eq("id", listing.id);

      const updatedListing = { ...listing, is_linked: false };
      updateListingById(updatedListing);
      setSelectedItem(null)
      setInventoryItem(null)
      enqueueSnackbar("Inventory item unlinked successfully", {
        variant: "success",
      });
    } catch (error) {
      enqueueSnackbar("Error unlinking inventory item", { variant: "error" });
      console.error("Error unlinking inventory item: ", error);
    }

    handleLinkDrawerClose();
  };
  
  const handleSave = async () => {
    if (selectedItem) {
      console.log("Selected item exists:", selectedItem); // Logging with JSON.stringify
      try {
        // Set listing_id on inventory item
        const { error: addListingIdError } = await supabase
          .from("inventory_items")
          .update({ listing_id: listing.id, status: "Listed" })
          .eq("id", selectedItem.id);
        if (addListingIdError) throw new Error(addListingIdError.message);
  
        // Updated inventory item history table
        await supabase
          .from("inventory_item_histories")
          .insert([{ inventory_item_id: selectedItem.id, status: "Listed" }]);
  
        const updatedListing = { ...listing, is_linked: true };
        updateListingById(updatedListing);
        setInventoryItem(selectedItem)
        enqueueSnackbar("Inventory item linked successfully", {
          variant: "success",
        });
      } catch (error) {
        enqueueSnackbar("Error linking inventory item", { variant: "error" });
        console.error("Error linking inventory item: ", error);
      }
    }
    handleLinkDrawerClose();
  };
  

  return (
    <Drawer anchor="left" open={openLinkDrawer} onClose={handleLinkDrawerClose}>
      <Box
        sx={{
          width: 400,
          p: 2,
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <Typography variant="h6">Link Inventory Item</Typography>
        <Divider sx={{ my: 2 }} />

        <Autocomplete
          options={inventoryItems}
          getOptionLabel={(option) => option.id.toString()}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Select Inventory Item"
              variant="outlined"
            />
          )}
          value={selectedItem}
          onChange={(event, newValue) => setSelectedItem(newValue)}
        />
        {selectedItem ? null : suggestedItem ? (
          <Box
            sx={{
              mt: 2,
              p: 2,
              border: "1px solid",
              borderColor: "grey.300",
              borderRadius: 1,
              backgroundColor: "grey.100",
            }}
          >
            <Typography variant="body2" color="textSecondary">
              Suggested Item: {suggestedItem.id}
            </Typography>
            <Button
              onClick={() => setSelectedItem(suggestedItem)}
              sx={{ mt: 1 }}
            >
              Select
            </Button>
          </Box>
        ) : null}
        <Divider sx={{ my: 2 }} />
        {selectedItem ? (
          <Box>
            <Typography variant="body1">ID: {selectedItem.id}</Typography>
            <Typography variant="body1">
              Category: {selectedItem.category}
            </Typography>
            <Typography variant="body1">
              Subcategory: {selectedItem.subcategory}
            </Typography>
            <Typography variant="body1">
              Created At:{" "}
              {new Date(selectedItem.created_at).toLocaleDateString()}
            </Typography>
            <Typography variant="body1">
              Purchase Order ID: {selectedItem.purchase_order_id}
            </Typography>
            <Typography variant="body1">
              Acquisition Cost: ${selectedItem.acquisition_cost}
            </Typography>
            <Typography variant="body1">Brand: {selectedItem.brand}</Typography>
            <Typography variant="body1">Model: {selectedItem.model}</Typography>
            {selectedItem.f_stop && (
              <Typography variant="body1">
                F-Stop: {selectedItem.f_stop}
              </Typography>
            )}
            {selectedItem.focal_length && (
              <Typography variant="body1">
                Focal Length: {selectedItem.focal_length}
              </Typography>
            )}
            <Typography variant="body1">
              Serial Number: {selectedItem.serial_number}
            </Typography>
          </Box>
        ) : (
          <Typography variant="body1">No inventory item linked.</Typography>
        )}

        <Box
          sx={{ mt: "auto", display: "flex", justifyContent: "space-between" }}
        >
          <Button onClick={handleUnlink} color="error">
            Unlink
          </Button>
          <Box>
            <Button onClick={handleLinkDrawerClose} color="error">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              color="primary"
              variant="contained"
              sx={{ ml: 2 }}
            >
              Save
            </Button>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
};

export default InventoryLinkDrawer;
