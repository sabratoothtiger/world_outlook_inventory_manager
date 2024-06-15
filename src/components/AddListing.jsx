// src/components/AddListing.js

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from "@mui/material";
import { DateField, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { supabase } from "../supabase";
import { enqueueSnackbar } from "notistack";
import { getFormattedTodayDate } from "../utils/dataFormatting";
import { NumericFormat } from "react-number-format";

const AddListing = ({
  fetchListings,
  openAddListingDialog,
  setOpenAddListingDialog,
}) => {
  const [listing, setListing] = useState({
    listing_site: "",
    listing_site_reference_id: "",
    listed_date: getFormattedTodayDate(), // Reset to today's date
    title: "",
    serial_number: "",
    status: "Active",
    listing_price: "",
  });
  const [listingSites, setListingSites] = useState([]);
  const [statuses, setStatuses] = useState([]);

  useEffect(() => {
    fetchListingSites();
    fetchStatuses();
  }, []);

  async function fetchListingSites() {
    const { data } = await supabase.from("listing_sites").select("site");
    setListingSites(data.map((site) => site.site));
  }

  async function fetchStatuses() {
    const { data } = await supabase
      .from("listing_statuses")
      .select("status")
      .order("id", { ascending: true });
    setStatuses(data.map((status) => status.status));
  }

  const handleAddListingDialogClose = () => {
    setOpenAddListingDialog(false);
  };

  const handleAddListingDialogSave = async (event) => {
    event.preventDefault();
    const currentTime = new Date(Date.now()).toISOString();
    const listingId = listing.listing_site + "_" + listing.listing_site_reference_id;

    const { error } = await supabase.from("listings").insert([
      {
        id: listingId,
        created_at: currentTime,
        last_updated_at: currentTime,
        listing_site: listing.listing_site,
        listing_site_reference_id: listing.listing_site_reference_id,
        listed_date: listing.listed_date || null,
        title: listing.tracking_number,
        serial_number: listing.serial_number,
        status: listing.status,
        listing_price: listing.listing_price || null,
      },
    ]);

    if (error) {
      console.error("Error inserting data: ", error);
      enqueueSnackbar("Oh no! We couldn't save the listing", {
        variant: "error",
      });
      return;
    } else {
      enqueueSnackbar("Yay! We added the listing!", { variant: "success" });
      await supabase
        .from('listing_histories')
        .insert([
          { listing_id: listingId, status: listing.status },
        ]) 
    }

    setListing({
      listing_site: "",
      listing_site_reference_id: "",
      listed_date: getFormattedTodayDate(), // Reset to today's date
      title: "",
      serial_number: "",
      status: "Active",
      listing_price: "",
    });

    fetchListings();
    handleAddListingDialogClose();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setListing((prevListing) => ({
      ...prevListing,
      [name]: value,
    }));
  };

  const handleCostChange = (values) => {
    const { floatValue } = values;
    setListing({
      ...listing,
      acquisition_cost: floatValue,
    });
  };

  return (
    <>
      <Dialog
        open={openAddListingDialog}
        onClose={handleAddListingDialogClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Add Listing</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} style={{ marginTop: "5px" }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth className="formControl" required>
                <InputLabel>Listing Site</InputLabel>
                <Select
                  name="listing_site"
                  label="Listing Site"
                  value={listing.site}
                  onChange={handleChange}
                >
                  {listingSites.map((site) => (
                    <MenuItem key={site} value={site}>
                      {site}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="listing_site_reference_id"
                label="Listing Site ID"
                value={listing.listing_site_reference_id}
                onChange={handleChange}
                fullWidth
                required
                className="textField"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth className="formControl">
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  label="Status"
                  value={listing.status}
                  onChange={handleChange}
                >
                  {statuses.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateField
                  name="listed_date"
                  label="Listing Date"
                  value={listing.listed_date}
                  onChange={(date) =>
                    setListing((prevListing) => ({
                      ...prevListing,
                      listed_date: date,
                    }))
                  }
                  fullWidth
                  required
                  className="textField"
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="title"
                label="Title"
                value={listing.title}
                onChange={handleChange}
                fullWidth
                className="textField"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="serial_number"
                label="Serial Number"
                value={listing.serial_number}
                onChange={handleChange}
                fullWidth
                className="textField"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <NumericFormat
                name="listing_price"
                label="Listing Price"
                value={listing.listing_price}
                customInput={TextField}
                thousandSeparator
                prefix="$"
                decimalScale={2}
                fixedDecimalScale
                fullWidth
                onValueChange={handleCostChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddListingDialogClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleAddListingDialogSave} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AddListing;
