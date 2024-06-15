// src/components/SignIn.jsx

import React, { useState } from "react";
import { TextField, Button, Box, Typography } from "@mui/material";
import { supabase } from "../supabase";
import { useSnackbar } from "notistack";
import { useNavigate } from "react-router-dom";

const SignIn = ({ onSignIn }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const handleSignIn = async () => {
    try {
      let { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      onSignIn(data.user);
      enqueueSnackbar("Signed in successfully!", { variant: "success" });
      navigate("/");
    } catch (error) {
      enqueueSnackbar(error.message, { variant: "error" });
    }
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
    >
      <Typography variant="h4">Sign In</Typography>
      <Box mt={2}>
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
        />
      </Box>
      <Box mt={2}>
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
        />
      </Box>
      <Box mt={2}>
        <Button variant="contained" color="primary" onClick={handleSignIn}>
          Sign In
        </Button>
      </Box>
    </Box>
  );
};

export default SignIn;