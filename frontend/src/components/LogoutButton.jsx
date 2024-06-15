// src/components/LogoutButton.js
import React from 'react';
import { supabase } from '../supabase';
import { Button } from '@mui/material';

const LogoutButton = () => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/signin'; // Redirect to sign-in page
  };

  return (
    <Button onClick={handleLogout} color="secondary">
      Logout
    </Button>
  );
};

export default LogoutButton;
