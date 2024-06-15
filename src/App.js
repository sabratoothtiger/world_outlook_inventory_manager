// src/App.js

import "./App.css";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { SnackbarProvider } from "notistack";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PurchaseOrders from "./pages/PurchaseOrders";
import PurchaseOrderDetails from "./pages/PurchaseOrderDetails";
import Home from "./pages/Home";
import Listings from "./pages/Listings";

function App() {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <SnackbarProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/purchase-orders" element={<PurchaseOrders />} />
            <Route path="/purchase-orders/:id" element={<PurchaseOrderDetails />} />
            <Route path="/listings" element={<Listings />} />
            {/* <Route path="/listings/:id" element={<ListingDetails />} /> */}
          </Routes>
        </Router>
      </SnackbarProvider>
    </LocalizationProvider>
  );
}

export default App;
