import * as React from 'react';
import { styled, createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import MuiDrawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import SchoolIcon from '@mui/icons-material/School';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import PersonIcon from '@mui/icons-material/Person';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Container from '@mui/material/Container';
import ButtonBase from '@mui/material/ButtonBase';
import {Link as RouterLink, Navigate, useNavigate} from 'react-router-dom';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import {buttontheme} from './ButtonColor';

const theme = createTheme();
const drawerWidth = 240;


export default function ParentDashboard(props){

  let navigate = useNavigate();

  const handleLogout = (event) => {
    localStorage.clear();
    navigate("/login");
  }

  return (
    <ThemeProvider theme={theme}>
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
            <ThemeProvider theme = {buttontheme}>
            <Button variant="contained" color = "neutral" onClick={handleLogout}>
              Logout
            </Button>
            </ThemeProvider>
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