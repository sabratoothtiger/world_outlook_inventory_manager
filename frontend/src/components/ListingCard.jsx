import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  CardActions,
  Button,
  Chip,
  Box,
  Skeleton,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import LinkIcon from "@mui/icons-material/Link";
import HistoryIcon from "@mui/icons-material/History";
import SellIcon from "@mui/icons-material/Sell";
import PriceCheckIcon from "@mui/icons-material/PriceCheck";
import EditIcon from "@mui/icons-material/Edit";
import InventoryIcon from "@mui/icons-material/Inventory";
import { supabase } from "../supabase";
import { enqueueSnackbar } from "notistack";
import InventoryLinkDrawer from "./InventoryLinkDrawer";

// Function to format the sold date and price
const formatSoldInfo = (listing) => {
  const options = { year: "numeric", month: "long", day: "numeric" };
  const soldDate = listing.sold_date ? (
    <>
      <PriceCheckIcon fontSize="inherit" /> Sold{" "}
      <b>{new Date(listing.sold_date).toLocaleDateString("en-US", options)}</b>
    </>
  ) : null;
  const soldPrice = listing.sold_price ? (
    <>
      {" for "}{" "}
      <b>
        {listing.sold_price.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        })}
      </b>
    </>
  ) : null;

  return (
    <>
      {soldDate}
      {soldPrice}
    </>
  );
};

const handleListingUrlButtonClick = (listing) => {
  window.open(listing.listing_url, "_blank", "noopener");
};

const formatListingInfo = (listing) => {
  const options = { year: "numeric", month: "long", day: "numeric" };
  const listingDate = listing.listing_date ? (
    <>
      <SellIcon fontSize="inherit" /> Listed{" "}
      <b>
        {new Date(listing.listing_date).toLocaleDateString("en-US", options)}
      </b>
    </>
  ) : null;
  const listingPrice = listing.listing_price ? (
    <>
      {" for "}{" "}
      <b>
        {listing.listing_price.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        })}
      </b>
    </>
  ) : null;

  return (
    <>
      {listingDate}
      {listingPrice}
    </>
  );
};

const formatInventoryItem = (inventoryItem) => {
  const inventoryItemFormatted = inventoryItem.id
    ? inventoryItem.id + " (SN: " + inventoryItem.serial_number + ")"
    : "No inventory item linked";

  return (
    <>
      <InventoryIcon fontSize="inherit" /> {inventoryItemFormatted}
    </>
  );
};

const listingStatusChip = (listingStatus) => {
  switch (listingStatus) {
    case "Active":
      return <Chip size="small" color="success" label={listingStatus} />;
    case "Sold":
      return <Chip size="small" color="secondary" label={listingStatus} />;
    case "Returned":
      return <Chip size="small" color="warning" label={listingStatus} />;
    case "Canceled by buyer":
      return <Chip size="small" color="warning" label={listingStatus} />;
    case "Removed":
      return <Chip size="small" color="default" label={listingStatus} />;
    default:
      break;
  }
};

// Listing Card
const ListingCard = ({ listing, updateListingById }) => {
  const [inventoryItem, setInventoryItem] = useState(null);
  const [openLinkDrawer, setOpenLinkDrawer] = useState(false);
  const [loadingInventoryItem, setLoadingInventoryItem] = useState(true);

  const fetchInventoryItem = useCallback(async () => {
    setLoadingInventoryItem(true);
    try {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("listing_id", listing.id);
      if (error) throw new Error(error.message);
      setInventoryItem(data.length > 0 ? data[0] : null);
    } catch (error) {
      enqueueSnackbar("Oops! Something went wrong.", { variant: "error" });
      console.error("Error fetching data: ", error);
    } finally {
      setLoadingInventoryItem(false);
    }
  }, [listing.id]);

  useEffect(() => {
    fetchInventoryItem();
  }, [fetchInventoryItem]);

  const handleLinkClick = () => {
    setOpenLinkDrawer(true);
  };

  const handleLinkDrawerClose = () => {
    setOpenLinkDrawer(false);
  };

  return (
    <Card sx={{ maxWidth: 345 }}>
      <CardContent>
        {listing.thumbnail_url && (
          <CardMedia
            sx={{ height: 140, marginBottom: 1 }}
            image={listing.thumbnail_url}
            title={listing.title}
          />
        )}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="body1" color="text.secondary">
            {listing.id}
          </Typography>
          {listingStatusChip(listing.status)}
        </Box>
        <Typography
          gutterBottom
          variant="body1"
          component="div"
          sx={{
            marginTop: 1,
          }}
        >
          <b>{listing.title}</b>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {loadingInventoryItem ? (
            <Skeleton />
          ) : (
            listing.listing_date && formatListingInfo(listing)
          )}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {loadingInventoryItem ? (
            <Skeleton />
          ) : (
            listing.sold_date && formatSoldInfo(listing)
          )}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {loadingInventoryItem ? (
            <Skeleton />
          ) : (
            inventoryItem
            ? formatInventoryItem(inventoryItem)
            : "No inventory item linked"
          )}
        </Typography>
      </CardContent>
      <CardActions
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Button size="small" onClick={handleLinkClick}>
          <LinkIcon />
        </Button>
        <InventoryLinkDrawer
          openLinkDrawer={openLinkDrawer}
          handleLinkDrawerClose={handleLinkDrawerClose}
          listing={listing}
          setInventoryItem={setInventoryItem}
          updateListingById={updateListingById}
        />
        <Button size="small" disabled>
          <HistoryIcon />
        </Button>
        <Button size="small" disabled>
          <EditIcon />
        </Button>
        <Button
          size="small"
          onClick={() => handleListingUrlButtonClick(listing)}
          disabled={!listing.listing_url}
        >
          <OpenInNewIcon />
        </Button>
      </CardActions>
    </Card>
  );
};

export default ListingCard;
