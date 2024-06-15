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

const UpdateListingStatusDialog = ({ open, onClose, onSave }) => {
  const [status, setStatus] = useState("");
  const [statuses, setStatuses] = useState([]);

  useEffect(() => {
    fetchStatuses();
  }, []);

  async function fetchStatuses() {
    const { data } = await supabase
      .from("listing_statuses")
      .select("status")
      .order("id", { ascending: true });
    setStatuses(data.map((status) => status.status));
  }
  const handleSave = () => {
    if (!status) {
      onClose();
      return;
    }
    onSave(status);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Update Status</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} style={{ marginTop: "5px" }}>
          <Grid item xs={12}>
              <Select
                autoFocus
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                fullWidth
              >
                {statuses.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
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

export default UpdateListingStatusDialog;
