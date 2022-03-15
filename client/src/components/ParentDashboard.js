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
import Menu from '@mui/material/Menu';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import axios from 'axios';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const theme = createTheme();

export default function ParentDashboard(props){

  let navigate = useNavigate();

  const [msg, setMsg] = React.useState("");
  const [barOpen, setbarOpen] = React.useState(false);
  const [severity, setSeverity] = React.useState("error");

  const [anchorEl, setAnchorEl] = React.useState(null);
  const menuOpen = Boolean(anchorEl);

  const [password, setPassword] = React.useState("");
  const [conPassword, setConPassword] = React.useState("");

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    setbarOpen(false);
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setPassword("");
    setConPassword("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log("PATCH current user");
    axios.patch(process.env.REACT_APP_BASE_URL+`/current_user`, {
      password: password,
    }, {
      headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    }).then((res) => {
      if (res.data.success){
        setMsg(`Password successfully updated`);
        setbarOpen(true);
        setSeverity("success");
      }
      else{
        setMsg(`Password not successfully updated`);
        setbarOpen(true);
        setSeverity("error");
      }
      setPassword("");
      setConPassword("");
    }).catch((err) => {
      setMsg(`Password not successfully updated`);
      setbarOpen(true);
      setSeverity("error");
      setPassword("");
      setConPassword("");
    });
  };

  const handleLogout = (event) => {
    localStorage.clear();
    navigate("/login");
  };


  return (
    <ThemeProvider theme={theme}>

    <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
      >
        <Stack spacing={1} sx={{ p: 2 }} justifyContent="center" alignItems="center">
          <Typography variant="h6" align="left">
            Change Password:
          </Typography>

          <TextField
            fullWidth
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="new-password"
          />
          <TextField
            onChange={(e) => setConPassword(e.target.value)}
            value={conPassword}
            error={password != conPassword}
            helperText={password != conPassword ? "Passwords do not match" : ""}
            fullWidth
            name="confirm-password"
            label="Confirm Password"
            type="password"
            id="confirm-password"
          />
            <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={password == "" || password != conPassword}
            >
              Submit
          </Button>
        </Stack>
      </Menu>

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
            <Grid container justifyContent="flex-end" spacing={2}>
            <Button variant="contained" component={RouterLink} to="/">
              Home
            </Button>
            <Button
              variant="contained"
              onClick={handleClick}
            >
              Change Password
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
          <Snackbar open={barOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
            <Alert severity={severity} onClose={handleSnackbarClose}>{msg}</Alert>
          </Snackbar>
          {props.children}
          </Container>
          </Box>
        </Box>
        </ThemeProvider>
    )
}