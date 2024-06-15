// src/pages/Home.jsx

import React from 'react';
import { Link, Typography, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LogoutButton from '../components/LogoutButton';

const Home = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
      <Typography variant="h2" gutterBottom>
        Home Page
      </Typography>
      <Link
        variant="h4"
        component="button"
        onClick={() => navigate('/purchase-orders')}
        sx={{ mb: 2 }}
      >
        Purchase Orders
      </Link>
      <Link
        variant="h4"
        component="button"
        onClick={() => navigate('/listings')}
        sx={{ mb: 2 }}
      >
        Listings
      </Link>
      {/* <Link
        variant="h4"
        component="button"
        onClick={() => navigate('/inventory')}
        sx={{ mb: 2 }}
      >
        Inventory
      </Link> */}
      <LogoutButton />
    </Box>
  );
};

export default Home;
