import "./App.css";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { SnackbarProvider } from "notistack";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import PurchaseOrders from "./pages/PurchaseOrders";
import PurchaseOrderDetails from "./pages/PurchaseOrderDetails";
import Home from "./pages/Home";
import Listings from "./pages/Listings";
import ProtectedRoute from "./components/ProtectedRoute";
import { supabase } from "./supabase";
import { useEffect, useState } from "react";
import SignIn from "./components/SignIn";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch session on initial load
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };
    getSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignIn = (user) => {
    setUser(user);
  };

  if (loading) {
    return <div>Loading...</div>; // Add a loading spinner or skeleton screen here
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <SnackbarProvider anchorOrigin={{ vertical: "bottom", horizontal: "center" }} autoHideDuration={3000}>
        <Router>
          <Routes>
            <Route path="/signin" element={<SignIn onSignIn={handleSignIn} />} />
            <Route path="/" element={<ProtectedRoute component={Home} user={user} />} />
            <Route path="/purchase-orders" element={<ProtectedRoute component={PurchaseOrders} user={user} />} />
            <Route path="/purchase-orders/:id" element={<ProtectedRoute component={PurchaseOrderDetails} user={user} />} />
            <Route path="/listings" element={<ProtectedRoute component={Listings} user={user} />} />
            <Route path="*" element={<Navigate to={user ? "/" : "/signin"} />} />
          </Routes>
        </Router>
      </SnackbarProvider>
    </LocalizationProvider>
  );
}

export default App;