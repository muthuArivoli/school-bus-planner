import * as React from 'react';
import { styled, createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import MuiDrawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import MuiAppBar from '@mui/material/AppBar';
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
import {Link as RouterLink, useNavigate} from 'react-router-dom';
import MuiAlert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import HomeIcon from '@mui/icons-material/Home';
import EmailIcon from '@mui/icons-material/Email';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import axios from 'axios';
import Menu from '@mui/material/Menu';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const theme = createTheme();
const drawerWidth = 240;

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    '& .MuiDrawer-paper': {
      position: 'relative',
      whiteSpace: 'nowrap',
      width: drawerWidth,
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
      boxSizing: 'border-box',
      ...(!open && {
        overflowX: 'hidden',
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
        width: theme.spacing(7),
        [theme.breakpoints.up('sm')]: {
          width: theme.spacing(9),
        },
      }),
    },
  }),
);

export default function AdminDashboard(props){
  const [open, setOpen] = React.useState(true);
  const [msg, setMsg] = React.useState("");
  const [barOpen, setbarOpen] = React.useState(false);
  const [severity, setSeverity] = React.useState("error");

  const [anchorEl, setAnchorEl] = React.useState(null);
  const menuOpen = Boolean(anchorEl);

  const [password, setPassword] = React.useState("");
  const [conPassword, setConPassword] = React.useState("");

  let navigate = useNavigate();

  const [role, setRole] = React.useState(0);

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

  React.useEffect(()=>{
    const fetchData = async() => {
      const result = await axios.get(
        process.env.REACT_APP_BASE_URL+`/current_user`, {
          headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      )
      if(result.data.success){
        setRole(result.data.user.role);
      }
      else{
        setMsg(`Current user could not be loaded`);
        setbarOpen(true);
        setSeverity("error");
        navigate("/");
      }
    }
    fetchData();
  }, []) 

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const childrenWithExtraProp = React.Children.map(props.children, child => {
    return React.cloneElement(child, {
      setSnackbarMsg: setMsg,
      setShowSnackbar: setbarOpen,
      setSnackbarSeverity: setSeverity
    });
  });

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    setbarOpen(false);
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
        <AppBar position="absolute" open={open}>
          <Toolbar
            sx={{
              pr: '24px', // keep right padding when drawer closed
            }}
          >
            <IconButton
              edge="start"
              color="inherit"
              aria-label="open drawer"
              onClick={toggleDrawer}
              sx={{
                marginRight: '36px',
                ...(open && { display: 'none' }),
              }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              component="h1"
              variant="h6"
              color="inherit"
              noWrap
              sx={{ width: "300%", flexGrow: 1 }}
            >
              {props.titleText}
            </Typography>
            <Grid container spacing={2} justifyContent="flex-end">
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
        <Drawer variant="permanent" open={open}>
          <Toolbar
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              px: [1],
            }}
          >
            <IconButton onClick={toggleDrawer}>
              <ChevronLeftIcon />
            </IconButton>
          </Toolbar>
          <Divider />
          <List>
          <div>
          <ListItemButton component={RouterLink} to="/">
            <ListItemIcon>
              <HomeIcon />
            </ListItemIcon>
            <ListItemText primary="Home" />
          </ListItemButton>
          <ListItemButton component={RouterLink} to="/users">
            <ListItemIcon>
              <AccountBoxIcon />
            </ListItemIcon>
            <ListItemText primary="Users" />
          </ListItemButton>
          <ListItemButton component={RouterLink} to="/students">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            <ListItemText primary="Students" />
          </ListItemButton>
          <ListItemButton component={RouterLink} to="/schools">
            <ListItemIcon>
              <SchoolIcon />
            </ListItemIcon>
            <ListItemText primary="Schools" />
          </ListItemButton>
          <ListItemButton component={RouterLink} to="/routes">
            <ListItemIcon>
              <DirectionsBusIcon />
            </ListItemIcon>
            <ListItemText primary="Routes" />
          </ListItemButton>
          {
          (role == 1 || role == 2) &&
          <ListItemButton component={RouterLink} to="/email">
            <ListItemIcon>
              <EmailIcon />
            </ListItemIcon>
            <ListItemText primary="Email" />
          </ListItemButton>
          }
          {
          (role == 1 || role == 2) &&
          <ListItemButton component={RouterLink} to="/bulkimport">
            <ListItemIcon>
              <FileDownloadIcon />
            </ListItemIcon>
            <ListItemText primary="Bulk Import" />
          </ListItemButton>
          }
        </div>
          </List>
        </Drawer>
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
          {childrenWithExtraProp}
          </Container>
          </Box>
        </Box>
        </ThemeProvider>
    )
}