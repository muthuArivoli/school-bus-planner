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
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import Typography from '@mui/material/Typography';
import { useParams, useNavigate } from 'react-router-dom';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormLabel from '@mui/material/FormLabel';
import Autocomplete from '@mui/material/Autocomplete';
import axios from 'axios';
import GoogleMap from './GoogleMap'

const theme = createTheme();
const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

export default function UserUpdate(props) {

  const { id } = useParams();
  const [data, setData] = React.useState({email:"", name:"", address: "", role: 0, managedSchools: [], phone: ""});
  const [emailList, setEmailList] = React.useState([]);
  const [oldEmail, setOldEmail] = React.useState("");
  
  const [schoolList, setSchoolList] = React.useState([]);

  const [latitude, setLatitude] = React.useState(null);
  const [longitude, setLongitude] = React.useState(null);


  let navigate = useNavigate();

  const [currRole, setCurrRole] = React.useState(0);
  const [currId, setCurrId] = React.useState(0);

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
        setCurrRole(result.data.user.role);
        setCurrId(result.data.user.id);
      }
      else{
        props.setSnackbarMsg(`Current user could not be loaded`);
        props.setShowSnackbar(true);
        props.setSnackbarSeverity("error");
        navigate("/");
      }
    }
    fetchData();
  }, [])

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
        let newData = {email: result.data.user.email, name: result.data.user.full_name, address: result.data.user.uaddress, role: result.data.user.role, phone: result.data.user.phone}
        if(newData.role == 2){
          newData.managedSchools = result.data.user.managed_schools.map((value)=>{return {label: value.name, id: value.id}});
        }
        console.log(result.data)
        console.log(newData);
        setData(newData);
        setLatitude(result.data.user.latitude);
        setLongitude(result.data.user.longitude);
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
          return value.email.toLowerCase();
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
  }, [])

  React.useEffect(()=>{
    const fetchSchoolList = async() => {
      const result = await axios.get(
        process.env.REACT_APP_BASE_URL+'/school', {
          headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      if (result.data.success){
        let arr = result.data.schools.map((value) => {
          return {id: value.id, label: value.name};
        })
        setSchoolList(arr);
      }
      else{
        props.setSnackbarMsg(`Schools could not be loaded`);
        props.setShowSnackbar(true);
        props.setSnackbarSeverity("error");
        navigate("/users");
      }
    };
    fetchSchoolList();
  }, [])

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

    const handleRoleChange = (event) => {
      let newData = JSON.parse(JSON.stringify(data));
      newData.managedSchools = [];
      newData.role = parseInt(event.target.value);
      setData(newData);
    }

    const handleManagedSchoolChange = (event, newValue) => {
      let newData = JSON.parse(JSON.stringify(data));
      newData.managedSchools = newValue;
      setData(newData);      
    }

    const handlePhoneChange = (event) => {
      let newData = JSON.parse(JSON.stringify(data));
      newData.phone = event.target.value;
      setData(newData);
    }

    const handleSubmit = (event) => {
      event.preventDefault();
      let req = {
        name: data.name,
        email: data.email,
        address: data.address,
        role: data.role,
        latitude: latitude,
        longitude: longitude,
        phone: data.phone
      }
      if(data.role == 2) {
        req.managed_schools = data.managedSchools.map((value)=>{return value.id});
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
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
        <Typography component="h1" variant="h5">
            Update User
      </Typography>
        <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 3 }}>
        <Grid container spacing={2}>
        <Grid item xs={12}>
              <TextField
                  autoComplete="name"
                  name="name"
                  required
                  fullWidth
                  id="name"
                  value={data.name}
                  onChange={handleNameChange}
                  label="Full Name"
                  autoFocus
                />
              </Grid>
            <Grid item xs={12}>
                <TextField
                  error={data.email.toLowerCase()!=oldEmail.toLowerCase() && emailList.includes(data.email.toLowerCase())}
                  helperText={(data.email.toLowerCase()!=oldEmail.toLowerCase() && emailList.includes(data.email.toLowerCase())) ? "Email already taken" : ""}
                  name="email"
                  label="Email"
                  type="email"
                  id="email"
                  fullWidth
                  value={data.email}
                  onChange={handleEmailChange}
                  autoComplete="email"
                />
              </Grid>
              <Grid item xs={12} sx={{ height: 450 }} >
                <GoogleMap address={data.address} setAddress={handleAddressChange} latitude={latitude} setLatitude={setLatitude} longitude={longitude} setLongitude={setLongitude}/>
              </Grid>
              <Grid item xs={12} sx={{ mt: 2 }}>
                <TextField
                  required
                  fullWidth
                  value={data.phone}
                  onChange={handlePhoneChange}
                  id="phone"
                  label="Phone Number"
                  name="phone"
                />
              </Grid>
              <Grid item xs={12}>
              {
              currRole == 1 && currId != id &&
              <FormControl>
                <FormLabel id="role-group-label">Role</FormLabel>
                <RadioGroup
                  aria-labelledby="role-group-label"
                  value={data.role}
                  onChange={handleRoleChange}
                  name="role-group"
                >
                  <FormControlLabel value={0} control={<Radio />} label="No Role" />
                  <FormControlLabel value={1} control={<Radio />} label="Admin" />
                  <FormControlLabel value={2} control={<Radio />} label="School Staff" />
                  <FormControlLabel value={3} control={<Radio />} label="Driver" />
                </RadioGroup>
                </FormControl>
              }
              </Grid>
              <Grid item xs={12}>
                {
                  currRole == 1 && data.role == 2 &&
                  <Autocomplete
                  multiple
                  id="managed-schools"
                  value={data.managedSchools}
                  onChange={handleManagedSchoolChange}
                  options={schoolList}
                  disableCloseOnSelect
                  renderOption={(props, option, { selected }) => (
                    <li {...props}>
                      <Checkbox
                        icon={icon}
                        checkedIcon={checkedIcon}
                        style={{ marginRight: 8 }}
                        checked={selected}
                      />
                      {option.label}
                    </li>
                  )}
                  fullWidth
                  renderInput={(params) => (
                    <TextField {...params} label="Schools Managed" placeholder="Schools" />
                  )}
                />
                }
              </Grid>
              <Grid item xs={12}>
                <Button type="submit"
                  variant="contained"
                  fullWidth
                  sx={{ mt: 3, mb: 2 }}
                  disabled={data.email == "" || data.address == "" || data.name == "" || (data.email.toLowerCase()!=oldEmail.toLowerCase() && emailList.includes(data.email.toLowerCase()))}
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