import * as React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import {Link as RouterLink, useNavigate} from 'react-router-dom';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import { Helmet } from 'react-helmet';

const theme = createTheme();
const drawerWidth = 240;


export default function ParentDashboard(props){

  let navigate = useNavigate();

  const handleLogout = (event) => {
    localStorage.clear();
    navigate("/login");
  };


  return (
    <ThemeProvider theme={theme}>
      <Helmet>
        <title>
          Dashboard
        </title>
      </Helmet>

      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar position="absolute">
        <Toolbar>
            <Typography
              component="h1"
              variant="h6"
              color="inherit"
              noWrap
              sx={{ width: "300%", flexGrow: 1 }}
            >
              {props.titleText}
            </Typography>
            <Grid container justifyContent="flex-end">
            <Button variant="contained" component={RouterLink} to="/">
              Home
            </Button>
            <Button variant="contained" onClick={handleLogout}>
              Logout
            </Button>
            </Grid>
            </Toolbar>
        </AppBar>

        <Box
          component="main"
          sx={{
            backgroundColor: (theme) =>
              theme.palette.mode === 'light'
                ? theme.palette.grey[100]
                : theme.palette.grey[900],
            flexGrow: 1,
            height: '100vh',
            overflow: 'auto',
          }}
        >
          <Toolbar />
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          {props.children}
          </Container>
          </Box>
        </Box>
        </ThemeProvider>
    )
}