import * as React from 'react';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import DeleteIcon from "@mui/icons-material/Delete";
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import Autocomplete from '@mui/material/Autocomplete';
import axios from 'axios';
import GoogleMap from './GoogleMap'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import { Helmet } from 'react-helmet';

const theme = createTheme();
const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;


export default function SignUp(props) {



  const [students, setStudents] = React.useState([]);
  let navigate = useNavigate();

  const [schools, setSchools] = React.useState([]);
  const [routes, setRoutes] = React.useState([]);

  const [name, setName] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [latitude, setLatitude] = React.useState(null);
  const [longitude, setLongitude] = React.useState(null);
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState(0);
  const [managedSchools, setManagedSchools] = React.useState([]);
  const [phone, setPhone] = React.useState("");

  const [disable, setDisable] = React.useState(true);

  //Represents user id if email already exists, null otherwise
  const [checkEmail, setCheckEmail] = React.useState(null);

  const [currRole, setCurrRole] = React.useState(0);

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

  const deleteStudent = (index) => {
    setStudents(students.filter((value, ind) => ind !== index));
    setRoutes(routes.filter((value, ind) => ind !== index));
  };

  const addStudent = () => {
      setStudents([...students, {"name": "", "id": "", "school": "", "school_id":0, "route": "", "route_id": null, "email": ""}])
      setRoutes([...routes, []]);
  }

  React.useEffect(()=>{
    let active = true;
    const fetchData = async() => {
      const result = await axios.get(
        process.env.REACT_APP_BASE_URL+'/check_email', {
          headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          params: {email: email}
        }
      );
      if (result.data.success){
        if (active){
          setCheckEmail(result.data.id);
        }
      }
      else{
        props.setSnackbarMsg(`Email could not be verified`);
        props.setShowSnackbar(true);
        props.setSnackbarSeverity("error");
        props.updateUser(null);
      }
    }
    fetchData();
    return () => {
      active = false;
    };
  }, [email]);

  React.useEffect(() => {
    const fetchData = async() => {
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
        setSchools(arr);
      }
      else{
        props.setSnackbarMsg(`Schools could not be loaded`);
        props.setShowSnackbar(true);
        props.setSnackbarSeverity("error");
        navigate("/users");
      }
    };
    fetchData();
  }, []);


  const handleSubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    let req = {
      email: data.get('email'),
      name: data.get('name'),
      role: role,
      phone: phone
    };

    if(role == 0){
      req.address = address;
      req.latitude = latitude;
      req.longitude = longitude;
    }

    if(role == 2){
      req.managed_schools = managedSchools.map((value)=>{return value.id});
    }

    console.log(req);
    
    axios.post(process.env.REACT_APP_BASE_URL+"/user", req, {
      headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    }).then(async (res) => {
      if(res.data.success){

          for(let i=0; i<students.length; i++){
            let reqS = {
              user_id: res.data.id,
              name: students[i]["name"],
              school_id:  students[i]["school_id"],
              //email: students[i]["email"],
            }
            if (students[i]["id"] != "" && students[i]["id"] != null){
              reqS.student_id = parseInt(students[i]["id"]);
            }
            if (students[i]["route_id"] != null){
              reqS.route_id = students[i]["route_id"];
            }
            console.log(reqS)
            const re = await axios.post(process.env.REACT_APP_BASE_URL+"/student", reqS, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            });
            if(!re.data.success) {
              props.setSnackbarMsg(`Students not successfully created`);
              props.setShowSnackbar(true);
              props.setSnackbarSeverity("error");
              navigate("/users");
            }
          }

        props.setSnackbarMsg(`User successfully created`);
        props.setShowSnackbar(true);
        props.setSnackbarSeverity("success");
        navigate("/users");
      }
      else {
        props.setSnackbarMsg(`User not successfully created`);
        props.setShowSnackbar(true);
        props.setSnackbarSeverity("error");
        navigate("/users");
      }
    }).catch((error) =>{
      props.setSnackbarMsg(`User not successfully created`);
      props.setShowSnackbar(true);
      props.setSnackbarSeverity("error");
      navigate("/users");
    });

  };

  const handleStudentChange = (index, ty, new_val, index_val=0) => {
    const updatedValues = students.map((value, i) => {
      if (i === index) {
          let new_obj = JSON.parse(JSON.stringify(value));
          new_obj[ty] = new_val

          if (ty =="school"){
            new_obj["school_id"] = index_val;
            new_obj["route"] = "";
            new_obj["route_id"] = null;
          }
          if (ty == "route"){
            new_obj["route_id"] = index_val;
          }

          return new_obj;
        
      } else {
        return value;
      }
    });
    setStudents(updatedValues);
  };

  const updateRoutes = (index, id) => {
    console.log(id);
    if(id == ""){
      let newRoutes = JSON.parse(JSON.stringify(routes));
      newRoutes[index] = [];
      setRoutes(newRoutes);
      return;
    }
    const fetchData = async() => {
      const result = await axios.get(
        process.env.REACT_APP_BASE_URL+`/school/${id}`, {
          headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      console.log(result.data);
      if (result.data.success){
        let newRoutes = JSON.parse(JSON.stringify(routes));
        newRoutes[index] = result.data.school.routes.map((value) => {return {label: value.name, id: value.id}})
        setRoutes(newRoutes);
      }
      else{
        props.setSnackbarMsg(`Routes could not be loaded`);
        props.setShowSnackbar(true);
        props.setSnackbarSeverity("error");
        navigate("/users");
      }
    };
    fetchData();
  }

  React.useEffect(() => {
    let disabled = email == "" || name == "" || (role == 0 && address == "") || phone == "" || checkEmail != null;
    for (let i=0; i<students.length; i++){
      disabled = disabled || students[i]["name"] == "" || students[i]["school"] == "";
    }
    setDisable(disabled);
  }, [email, name, address, students, phone, role])

  return (
    <ThemeProvider theme={theme}>
      <Helmet>
        <title>
          Create User
        </title>
      </Helmet>
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
            Create User
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
                  onChange={(e) => setName(e.target.value)}
                  label="Full Name"
                  autoFocus
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  error={checkEmail != null}
                  helperText={checkEmail != null ? "Email already taken":""}
                  fullWidth
                  onChange={(e) => setEmail(e.target.value)}
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                />
              </Grid>
              <Grid item xs={12}>
               {
               currRole == 1 && 
              <FormControl>
                <FormLabel id="role-group-label">Role</FormLabel>
                <RadioGroup
                  aria-labelledby="role-group-label"
                  value={role}
                  onChange={(e)=>{
                    setManagedSchools([]);
                    setAddress("");
                    setLatitude(null);
                    setLongitude(null);
                    setStudents([]);
                    setRole(parseInt(e.target.value));
                  }}
                  name="role-group"
                >
                  <FormControlLabel value={0} control={<Radio />} label="Parent" />
                  <FormControlLabel value={1} control={<Radio />} label="Admin" />
                  <FormControlLabel value={2} control={<Radio />} label="School Staff" />
                  <FormControlLabel value={3} control={<Radio />} label="Driver" />
                </RadioGroup>
                </FormControl>
                }
              </Grid>
              <Grid item xs={12}>
                {
                  currRole == 1 && role == 2 &&
                  <Autocomplete
                  multiple
                  id="managed-schools"
                  value={managedSchools}
                  onChange={(e, value)=>setManagedSchools(value)}
                  options={schools}
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
              {
              role == 0 &&
              <Grid item xs={12} sx={{ height: 450 }} >
                <GoogleMap address={address} setAddress={setAddress} latitude={latitude} setLatitude={setLatitude} longitude={longitude} setLongitude={setLongitude}/>
              </Grid>
              }
              <Grid item xs={12} sx={{ mt: 2}}>
                <TextField
                  required
                  fullWidth
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  id="phone"
                  label="Phone Number"
                  name="phone"
                />
              </Grid>
              {role == 0 && students.map((element, index) => (
                  <React.Fragment key={index}>
                  <Box
                    sx={{
                        marginTop: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                    >
                    <Typography variant="body1">
                        Student {index + 1}
                    </Typography>
                </Box>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                    <TextField
                        autoFocus
                        required
                        label="Name"
                        value={element["name"] || ""}
                        onChange={(e) => handleStudentChange(index, "name", e.target.value)}
                        fullWidth
                    />
                    </Grid>
                    <Grid item xs={12}>
                    <TextField
                      required
                      error={checkEmail != null}
                      helperText={checkEmail != null ? "Email already taken":""}
                      fullWidth
                      onChange={(e) => handleStudentChange(index, "email", e.target.value)}
                      id="student-email"
                      label="Email Address"
                    />
                    </Grid>
                    <Grid item xs={12}>
                    <TextField
                        label="Student ID"
                        type="text"
                        value={element["id"] || ""}
                        onChange={(e) => {
                          let input = e.target.value;
                          if( !input || input.match('^[0-9]+$')){
                            handleStudentChange(index, "id", input);
                          }
                        }}
                        fullWidth
                    />
                    </Grid>
                    <Grid item xs={12}>
                    <Autocomplete
                        autoFocus
                        options={schools}
                        autoSelect
                        value={element["school"] || ""}
                        onChange={(e, newValue) => {handleStudentChange(index, "school", newValue == null ? "" : newValue.label, newValue == null ? 0 : newValue.id);
                                                    updateRoutes(index, newValue == null ? "" : newValue.id);
                                                    }}
                        renderInput={(params) => <TextField {...params} label="School Name" />}
                    />
                    </Grid>
                    <Grid item xs={12}>
                    <Autocomplete
                        autoFocus
                        disabled={routes[index] == 0}
                        options={routes[index]}
                        autoSelect
                        value={element["route"] || ""}
                        onChange={(e, newValue) => handleStudentChange(index, "route", newValue == null ? "" : newValue.label, newValue == null ? null :newValue.id)}
                        renderInput={(params) => <TextField {...params} label="Route Name" />}
                    />
                    </Grid>
                <Grid container justifyContent="center">
                <Grid item xs={1}>
                  <div
                    className="font-icon-wrapper"
                    onClick={() => deleteStudent(index)}
                  >
                    <Button variant="outlined" startIcon={<DeleteIcon/>}>
                      Delete
                    </Button>
                  </div>
                </Grid>
                </Grid>
                </Grid>
                </React.Fragment>
            ))}
            {
            role == 0 &&
            <Button onClick={addStudent} color="primary">
                Add Student
            </Button>
            }
            </Grid>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={disable}
              sx={{ mt: 3, mb: 2 }}
            >
              Create Account
            </Button>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}