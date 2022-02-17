import * as React from 'react'
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Button from '@mui/material/Button';
import Input from '@mui/material/Input';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import GoogleMap from './GoogleMap'

const theme = createTheme();

export default function UserUpdate(props) {

  const { id } = useParams();
  const [data, setData] = React.useState({email:"", password: "", con_password: "", name:"", address: "", admin: false});
  const [emailList, setEmailList] = React.useState([])
  const [oldEmail, setOldEmail] = React.useState("");
  
  const [latitude, setLatitude] = React.useState("");
  const [longitude, setLongitude] = React.useState("");


  let navigate = useNavigate();

  React.useEffect(() => {
    const fetchData = async() => {
      const result = await axios.get(
        process.env.REACT_APP_BASE_URL+`/user/${id}`, {
          headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      if (result.data.success){
        let newData = {email: result.data.user.email, name: result.data.user.full_name, address: result.data.user.uaddress, admin: result.data.user.admin_flag, password: "", con_password: ""}
        setData(newData);
        setOldEmail(result.data.user.email);
      }
      else{
        props.setSnackbarMsg(`User could not be loaded`);
        props.setShowSnackbar(true);
        props.setSnackbarSeverity("error");
        navigate("/users");
      }
    };
    fetchData();
  }, []);

  React.useEffect(()=>{
    const fetchEmailList = async() => {
      const result = await axios.get(
        process.env.REACT_APP_BASE_URL+'/user', {
          headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      if (result.data.success){
        let arr = result.data.users.map((value) => {
          return value.email;
        })
        setEmailList(arr);
      }
      else{
        props.setSnackbarMsg(`Users could not be loaded`);
        props.setShowSnackbar(true);
        props.setSnackbarSeverity("error");
        navigate("/users");
      }
    };
    fetchEmailList();
  }, [data])

    const handleAddressChange = (event) => {
      let newData = JSON.parse(JSON.stringify(data));
      newData.address = event;
      setData(newData);
    }

    
    const handleNameChange = (event) => {
      let newData = JSON.parse(JSON.stringify(data));
      newData.name = event.target.value;
      setData(newData);
    }
    const handleEmailChange = (event) => {
      let newData = JSON.parse(JSON.stringify(data));
      newData.email = event.target.value;
      setData(newData);
    }

    const handlePasswordChange = (event) => {
      let newData = JSON.parse(JSON.stringify(data));
      newData.password = event.target.value;
      setData(newData);
    }

    const handleConPasswordChange = (event) => {
      let newData = JSON.parse(JSON.stringify(data));
      newData.con_password = event.target.value;
      setData(newData);
    }

    const handleAdminChange = (event) => {
      let newData = JSON.parse(JSON.stringify(data));
      newData.admin = event.target.checked;
      setData(newData);
    }

    const handleSubmit = (event) => {
      event.preventDefault();
      let req = {
        name: data.name,
        email: data.email,
        address: data.address,
        admin_flag: data.admin
      }
      if(data.password != null && data.password != ""){
        req.password = data.password;
      }
      console.log(req);
      axios.patch(process.env.REACT_APP_BASE_URL+`/user/${id}`, req, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }).then((res) => {
        if (res.data.success){
          props.setSnackbarMsg(`User successfully updated`);
          props.setShowSnackbar(true);
          props.setSnackbarSeverity("success");
          navigate("/users");
        }
        else{
          props.setSnackbarMsg(`User not successfully updated`);
          props.setShowSnackbar(true);
          props.setSnackbarSeverity("error");
          navigate("/users");
        }
      });
    };

    return(
        <>
        <ThemeProvider theme={theme}>
      <Container component="main">
        <CssBaseline />
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'left',
          }}
        >
        <Typography component="h1" variant="h5">
            Update User
      </Typography>
        <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 3 }}>
        <Grid container spacing={2}>
            <Grid item md={12}>
                <TextField
                  error={data.email!=oldEmail && emailList.includes(data.email)}
                  helperText={(data.email!=oldEmail && emailList.includes(data.email)) ? "Email already taken" : ""}
                  name="email"
                  label="Email"
                  type="email"
                  id="email"
                  value={data.email}
                  onChange={handleEmailChange}
                  autoComplete="email"
                />
              </Grid>
              <Grid item md={12}>
                <TextField
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  value={data.password}
                  onChange={handlePasswordChange}
                  autoComplete="new-password"
                />
              </Grid>
              <Grid item md={12}>
                <TextField
                  error={data.password != data.con_password}
                  helperText={data.password != data.con_password ? "Passwords don't match" : ""}
                  name="confirm-password"
                  label="Confirm Password"
                  type="password"
                  value={data.con_password}
                  onChange={handleConPasswordChange}
                  id="confirm-password"
                />
              </Grid>
              <Grid item md={12}>
                <FormControl>
                  <InputLabel htmlFor="name">Name</InputLabel>
                  <Input id="name" value={data.name} onChange={handleNameChange} />
                </FormControl>
              </Grid>
              <Grid item md={12} sx={{ height: 450 }} >
                <GoogleMap address={data.address} setAddress={handleAddressChange} latitude ={latitude} setLatitude ={setLatitude} longitude ={longitude} setLongitude ={setLongitude}/>
              </Grid>
              <Grid item md={12}>
                <FormControlLabel
                  control={<Checkbox value="admin" color="primary" />}
                  label="Admin"
                  id="admin"
                  name="admin"
                  checked={data.admin}
                  onChange={handleAdminChange}
                />
              </Grid>
              <Grid item sm={12}>
                <Button type="submit"
                  variant="contained"
                  disabled={data.email == "" || data.address == "" || data.name == "" || data.password != data.con_password || (data.email!=oldEmail && emailList.includes(data.email))}
                  >
                    Submit
                </Button>
              </Grid>
            </Grid>

        </Box>
        </Box>
        </Container>
        </ThemeProvider>
        </>
    )
}