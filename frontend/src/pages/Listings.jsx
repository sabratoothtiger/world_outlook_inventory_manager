import React, { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import { enqueueSnackbar } from "notistack";
import {
  MenuItem,
  Typography,
  Box,
  IconButton,
  Menu,
  Link,
  Breadcrumbs,
  Button,
  Stack,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { DataGrid, GridToolbarQuickFilter } from "@mui/x-data-grid";

import { supabase } from "../supabase";
import { sendLabelsToPrinter } from "../components/DymoPrinter";
import { parseTitleForLabel } from "../utils/dataFormatting";
import AddListing from "../components/AddListing";
import UpdateStatusDialog from "../components/UpdateListingStatusDialog";
import { ListingsTableColumns } from "../components/TableColumns";
import ListingCard from "../components/ListingCard";

import MoreVertIcon from "@mui/icons-material/MoreVert";
import HomeIcon from "@mui/icons-material/Home";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import PrintIcon from "@mui/icons-material/Print";
import PublishedWithChangesIcon from "@mui/icons-material/PublishedWithChanges";
import ExploreIcon from "@mui/icons-material/Explore";

function CustomToolbar({
  selectedRows,
  handlePrintClick,
  handleTogglePrintStatus,
  handleOpenBulkStatusUpdateDialog,
}) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        margin: 1,
      }}
    >
      <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
        {selectedRows.length > 0 && (
          <>
            <Button
              variant="contained"
              startIcon={<PrintIcon />}
              color="primary"
              onClick={handlePrintClick(selectedRows)}
            >
              Print Labels
            </Button>
            <Button
              variant="contained"
              startIcon={<PublishedWithChangesIcon />}
              color="primary"
              onClick={handleTogglePrintStatus(selectedRows)}
            >
              Toggle Print Statuses
            </Button>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              color="primary"
              onClick={() => handleOpenBulkStatusUpdateDialog(selectedRows)}
            >
              Update Statuses
            </Button>
          </>
        )}
      </Box>
      <Box sx={{ alignItems: "flex-end", marginRight: 1 }}>
        <GridToolbarQuickFilter />
      </Box>
    </Box>
  );
}

const Listings = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAddListingDialog, setOpenAddListingDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedListingIds, setSelectedListingIds] = useState([]);
  const [openBulkStatusUpdateDialog, setOpenBulkStatusUpdateDialog] =
    useState(false);
  const [listingDetailsDrawerContentKey, setListingDetailsDrawerContentKey] =
    useState(0);
  const [listingDetailsDrawerContent, setListingDetailsDrawerContent] =
    useState(
      <Box
        key={listingDetailsDrawerContentKey}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: 1,
          height: "100%",
        }}
      >
        <Stack
          sx={{
            display: "flex",
            alignItems: "center",
            margin: 1,
          }}
        >
          <ExploreIcon color="disabled" sx={{ fontSize: 60 }} />
          <Typography variant="h6" color="gray">
            Select a row
          </Typography>
        </Stack>
      </Box>
    );
  const navigate = useNavigate();

  useEffect(() => {
    fetchListings();
  }, []);

  async function fetchListings() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .order("id", { ascending: false });
      if (error) throw new Error(error.message);
      setListings(data);
    } catch (error) {
      enqueueSnackbar("Oops! Something went wrong.", { variant: "error" });
      console.error("Error fetching data: ", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchListingsForDetailCards(listingIds) {
    try {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .in("id", listingIds);
      if (error) throw new Error(error.message);
      return data;
    } catch (error) {
      enqueueSnackbar("Oops! Something went wrong.", { variant: "error" });
      console.error("Error fetching data: ", error);
      return [];
    }
  }

  const handleAddListingClick = () => {
    setOpenAddListingDialog(true);
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  const handlePullFromEbay = async () => {
    setLoading(true);
    try {
      const url = process.env.REACT_APP_API_URL + "/api/fetch_ebay_listings";
      const response = await fetch(url);
      const data = await response.json();
      if (data.status === "success") {
        console.log("Listings fetched successfully");
        fetchListings();
      } else {
        console.error("Error fetching listings:", data.message);
      }
    } catch (error) {
      console.error("Error fetching listings:", error);
    }
    setLoading(false);
    handleMenuClose();
  };

  const handleRowSelectionChange = async (newSelection) => {
    setSelectedRows(newSelection);
    if (newSelection.length >= 1) {
      const listingsData = await fetchListingsForDetailCards(newSelection);
      setListingDetailsDrawerContent(
        <Box
          key={listingDetailsDrawerContentKey}
          sx={{
            alignItems: "center",
            margin: 1,
            height: "100%",
          }}
        >
          <Stack sx={{ marginRight: 1 }}>
            <Stack spacing={2}>
              {Array.isArray(listingsData) && listingsData.length > 0 ? (
                listingsData
                  .slice()
                  .reverse()
                  .map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      updateListingById={updateListingById}
                    />
                  ))
              ) : (
                <Typography>No listings available</Typography>
              )}
            </Stack>
          </Stack>
        </Box>
      );
    } else {
      setListingDetailsDrawerContent(
        <Box
          key={listingDetailsDrawerContentKey}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: 1,
            height: "100%",
          }}
        >
          <Stack
            sx={{
              display: "flex",
              alignItems: "center",
              margin: 1,
            }}
          >
            <ExploreIcon color="disabled" sx={{ fontSize: 60 }} />
            <Typography variant="h6" color="gray">
              Select a row
            </Typography>
          </Stack>
        </Box>
      );
    }
  };

  const columns = ListingsTableColumns();

  // Function to update a single listing by ID
  const updateListingById = (updatedListing) => {
    // Find the index of the listing to update
    const index = listings.findIndex(
      (listing) => listing.id === updatedListing.id
    );
    if (index !== -1) {
      // Create a new array with the updated listing
      const updatedListings = [...listings];
      updatedListings[index] = updatedListing;
      setListings(updatedListings);
    }
  };

  const handleOpenBulkStatusUpdateDialog = (listingIds) => {
    setSelectedListingIds(listingIds);
    setOpenBulkStatusUpdateDialog(true);
  };
  const handleCloseBulkStatusUpdateDialog = () => {
    setOpenBulkStatusUpdateDialog(false);
  };
  const handleBulkStatusUpdate = async (newStatus) => {
    try {
      for (const listingId of selectedListingIds) {
        const { error: listingStatusUpdateError } = await supabase
          .from("listings")
          .update({ status: newStatus })
          .eq("id", listingId);
        if (listingStatusUpdateError)
          throw new Error(listingStatusUpdateError.message);

        await supabase
          .from("listing_histories")
          .insert([{ listing_id: listingId, status: newStatus }]);

        const listingStatusToInventoryItemStatusMapping = {
          Active: "Listed",
          Sold: "Sold",
          Returned: "Returned by buyer",
          "Canceled by buyer": "Received (unlisted)",
          Removed: "Received (unlisted)",
        };
        const inventoryItemStatus =
          listingStatusToInventoryItemStatusMapping[newStatus];
        const { error: inventoryItemStatusUpdateError } = await supabase
          .from("inventory_items")
          .update({ status: inventoryItemStatus })
          .eq("listing_id", listingId);
        if (inventoryItemStatusUpdateError)
          throw new Error(inventoryItemStatusUpdateError.message);

        const { data: inventoryItems, error: findInventoryItemsError } =
          await supabase
            .from("inventory_items")
            .select("id")
            .eq("listing_id", listingId);

        if (findInventoryItemsError) {
          throw new Error(findInventoryItemsError.message);
        } else if (inventoryItems && inventoryItems.length > 0) {
          // Only proceed if inventoryItems has data
          await supabase
            .from("inventory_item_histories")
            .insert([
              {
                inventory_item_id: inventoryItems[0].id,
                status: inventoryItemStatus,
              },
            ])
            .then(({ error: inventoryItemHistoryUpdateError }) => {
              if (inventoryItemHistoryUpdateError) {
                throw new Error(inventoryItemHistoryUpdateError.message);
              }
            });
        }

        setListings((prevListings) =>
          prevListings.map((listing) =>
            listing.id === listingId
              ? { ...listing, status: newStatus }
              : listing
          )
        );
        setListingDetailsDrawerContentKey(
          (listingDetailsDrawerContentKey) => listingDetailsDrawerContentKey + 1
        );
      }
    } catch (error) {
      enqueueSnackbar("Error updating status: " + error.message, {
        variant: "error",
      });
      console.error("Error updating status:", error);
    }
  };

  const handlePrintClick = (listingIds) => async () => {
    try {
      const labelData = listingIds.map((listingId) => {
        const listing = listings.find((listing) => listing.id === listingId);
        const serialNumber = listing.serial_number || "";
        const barcode = `LIS^${listingId}^${serialNumber}`;
        const { title1, title2 } = parseTitleForLabel(listing.title);

        return {
          "Listing ID": listingId,
          "Source": listing.listing_site,
          "Title 1": title1,
          "Title 2": title2,
          "Serial Number": serialNumber,
          "Listing Barcode": barcode,
        };
      });

      // Attempt to send labels to the printer
      await sendLabelsToPrinter(labelData, "listing");

      // If printing is successful, mark listings as printed
      const updatePromises = listingIds.map((listingId) =>
        supabase
          .from("listings")
          .update({ label_printed: true })
          .eq("id", listingId)
      );
      await Promise.all(updatePromises);
    } catch (error) {
      enqueueSnackbar("Error printing label: " + error, { variant: "error" });
      console.error("Error printing label:", error);
    }
  };

  const handleTogglePrintStatus = (listingIds) => async () => {
    try {
      for (const listingId of listingIds) {
        const { data, error } = await supabase
          .from("listings")
          .select("label_printed")
          .eq("id", listingId);

        if (error) {
          throw new Error("Error fetching listing: " + error.message);
        }

        if (data.length > 0) {
          const currentPrintStatus = data[0].label_printed;

          await supabase
            .from("listings")
            .update({
              label_printed: !currentPrintStatus,
            })
            .eq("id", listingId);

          setListings((prevListings) =>
            prevListings.map((listing) =>
              listing.id === listingId
                ? { ...listing, label_printed: !currentPrintStatus }
                : listing
            )
          );
        } else {
          throw new Error("Listing not found with ID: " + listingId);
        }
      }
    } catch (error) {
      enqueueSnackbar("Error toggling print status: " + error.message, {
        variant: "error",
      });
      console.error("Error toggling print status:", error);
    }
  };

  return (
    <React.Fragment>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Box sx={{ display: "flex", alignItems: "center", margin: 1 }}>
            <Breadcrumbs
              aria-label="breadcrumb"
              sx={{ typography: "h4" }}
              separator=""
            >
              <Link
                underline="hover"
                color="inherit"
                onClick={() => navigate("/")}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                  typography: "h4",
                }}
              >
                <HomeIcon sx={{ fontSize: "inherit", marginRight: 0.5 }} />
              </Link>
              <Link
                underline="hover"
                color="inherit"
                onClick={() => navigate("/listings")}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                <Typography variant="h4" component="span">
                  Listings
                </Typography>
              </Link>
            </Breadcrumbs>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                marginLeft: "auto",
              }}
            >
              <Button
                variant="contained"
                color="primary"
                onClick={handleAddListingClick}
                startIcon={<AddIcon />}
              >
                Add Listing
              </Button>
              <AddListing
                fetchListings={fetchListings}
                openAddListingDialog={openAddListingDialog}
                setOpenAddListingDialog={setOpenAddListingDialog}
              />
              <IconButton
                color="inherit"
                aria-label="more"
                aria-controls="listings-menu"
                aria-haspopup="true"
                onClick={handleMenuClick}
              >
                <MoreVertIcon />
              </IconButton>
              <Menu
                id="listings-menu"
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={handlePullFromEbay}>Pull from eBay</MenuItem>
              </Menu>
            </Box>
          </Box>
        </Grid>
        <Grid
          item
          xs={9}
          style={{ overflowY: "auto", maxHeight: "calc(100vh - 88px)" }}
        >
          <Box>
            <DataGrid
              rows={listings || []}
              columns={columns || []}
              loading={loading}
              getRowClassName={(params) =>
                params.indexRelativeToCurrentPage % 2 === 0 ? "even" : "odd"
              }
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 10 },
                },
              }}
              components={{
                Toolbar: () => (
                  <CustomToolbar
                    selectedRows={selectedRows}
                    handleOpenBulkStatusUpdateDialog={
                      handleOpenBulkStatusUpdateDialog
                    }
                    handlePrintClick={handlePrintClick}
                    handleTogglePrintStatus={handleTogglePrintStatus}
                  />
                ),
              }}
              onRowSelectionModelChange={handleRowSelectionChange}
              checkboxSelection
              autoHeight
            />
          </Box>
        </Grid>
        <Grid
          item
          xs={3}
          style={{ overflowY: "auto", maxHeight: "calc(100vh - 88px)" }}
        >
          {listingDetailsDrawerContent}
        </Grid>
      </Grid>
      <UpdateStatusDialog
        open={openBulkStatusUpdateDialog}
        onClose={handleCloseBulkStatusUpdateDialog}
        onSave={handleBulkStatusUpdate}
      />
    </React.Fragment>
  );
};

export default Listings;
