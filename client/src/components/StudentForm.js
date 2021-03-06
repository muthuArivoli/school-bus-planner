import * as React from 'react';
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import InputAdornment from '@mui/material/InputAdornment';

const theme = createTheme();

export default function StudentForm(props) {

    const [users, setUsers] = React.useState([]);
    const [schools, setSchools] = React.useState([]);
    const [routes, setRoutes] = React.useState([]);

    const [checkEmail, setCheckEmail] = React.useState(null);

    let navigate = useNavigate()

        React.useEffect(()=> {
            const fetchData = async() => {
              const result = await axios.get(
                process.env.REACT_APP_BASE_URL+'/user', {
                  headers: {
                      Authorization: `Bearer ${localStorage.getItem('token')}`
                  },
                  params: {sort: "email", dir: "asc", role: 0}
                }
              );
              if (result.data.success){
                let arr = result.data.users.map((value) => {
                  return value.email;
                });
                setUsers(arr);
              }
              else{
                props.setSnackbarMsg(`Users could not be loaded`);
                props.setShowSnackbar(true);
                props.setSnackbarSeverity("error");
                navigate("/students");
              }
            };
            fetchData();
          }, []);

          React.useEffect(()=>{
            let active = true;
            const fetchData = async() => {
              const result = await axios.get(
                process.env.REACT_APP_BASE_URL+'/check_email', {
                  headers: {
                      Authorization: `Bearer ${localStorage.getItem('token')}`
                  },
                  params: {email: props.email, parents: true}
                }
              );
              if (result.data.success){
                if (active){
                  props.updateUser(result.data.id);
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
          }, [props.email]);

          React.useEffect(()=> {
            const fetchData = async() => {
              const result = await axios.get(
                process.env.REACT_APP_BASE_URL+'/school', {
                  headers: {
                      Authorization: `Bearer ${localStorage.getItem('token')}`
                  },
                  params: {sort: "name", dir: "asc"}
                }
              );
              if (result.data.success){
                let arr = result.data.schools.map((value) => {
                  return {label: value.name, id: value.id};
                });
                setSchools(arr);
              }
              else{
                props.setSnackbarMsg(`Users could not be loaded`);
                props.setShowSnackbar(true);
                props.setSnackbarSeverity("error");
                navigate("/students");
              }
            };
            fetchData();
          }, []);


          React.useEffect(()=> {
            getRoutes("", props.school);
          }, [props.school]);

          React.useEffect(()=>{
            let active = true;
            const fetchData = async() => {
              const result = await axios.get(
                process.env.REACT_APP_BASE_URL+'/check_email', {
                  headers: {
                      Authorization: `Bearer ${localStorage.getItem('token')}`
                  },
                  params: {email: props.studentEmail}
                }
              );
              if (result.data.success){
                console.log(result.data);
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
          }, [props.studentEmail]);

      const getRoutes = (e, value) => {

          if (value == null || value.id == ""){
              return;
          }
          axios.get(process.env.REACT_APP_BASE_URL+`/school/${value.id}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }).then((result) => {
            if (result.data.success){
                let newRoutes = result.data.school.routes.map((value) => {return {label: value.name, id: value.id}});
                setRoutes(newRoutes);
            }
            else{
                props.setSnackbarMsg(`Routes could not be loaded`);
                props.setShowSnackbar(true);
                props.setSnackbarSeverity("error");
                navigate("/students");
              }
          })
      }

    return (
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
      {props.title}
        </Typography>
        <Box component="form" noValidate onSubmit={props.handleSubmit} sx={{ mt: 3 }}>  
        <Grid container spacing={2}>
                    <Grid item xs={12}>
                    <TextField
                        autoFocus
                        required
                        fullWidth
                        label="Name"
                        id="name"
                        value={props.name}
                        onChange={(e) => props.updateName(e.target.value)}
                        
                    />
                    </Grid>
                    <Grid item xs={12}>
                    <TextField
                      error={(checkEmail != null && props.originalStudentEmail != props.studentEmail)}
                      value={props.studentEmail}
                      helperText={(checkEmail != null && props.originalStudentEmail != props.studentEmail) ? "Email already taken" : ""}
                      fullWidth
                      onChange={(e) => props.setStudentEmail(e.target.value)}
                      id="email"
                      label="Email Address"
                      name="email"
                      autoComplete="email"
                    />
                    </Grid>
                    <Grid item xs={12}>
                    <TextField
                        type="text"
                        fullWidth
                        label="Student ID"
                        id="student_id"
                        value={props.studentId || ""}
                        onChange={(e) => {
                          let input = e.target.value;
                          if( !input || input.match('^[0-9]+$')){
                            props.updateStudentId(input);
                          }
                        }}
                        
                    />
                    </Grid>
                    <Grid item xs={12}>
                        <Autocomplete
                            autoFocus
                            required
                            fullWidth
                            freeSolo
                            options={users}
                            id="user"
                            
                            inputValue={props.email}
                            onInputChange={(e, new_value) => props.setEmail(new_value)}
                            renderInput={(params) => 
                            <TextField {...params} label="Parent Email" 
                            InputProps={{
                              ...params.InputProps,
                              startAdornment: <InputAdornment position="start">{props.user == null ? <CloseIcon/> : <CheckIcon/>}</InputAdornment>,
                            }}/>}
                        />
                        </Grid>
                    <Grid item xs={12}>
                    <Autocomplete
                        autoFocus
                        required
                        fullWidth
                        options={schools}
                        id="school"
                        autoSelect
                        
                        value={props.school}
                        onChange={(e, new_val) => {
                            getRoutes(e, new_val);
                            props.updateSchool(new_val);
                            props.updateRoute(null)}}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        renderInput={(params) => <TextField {...params} label="School Name" />}
                    />
                    </Grid>
                    <Grid item xs={12}>
                    <Autocomplete
                        autoFocus
                        disabled={routes.length == 0}
                        id="route"
                        options={routes}
                        autoSelect
                        fullWidth
                        value={props.route}
                        onChange={(e, new_val) => props.updateRoute(new_val)}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        renderInput={(params) => <TextField {...params} label="Route Name" />}
                    />
                    </Grid>
                    <Grid item xs={12}>
                    <Button type="submit"
                      variant="contained"
                      fullWidth
                      sx={{ mt: 3, mb: 2 }}
                      disabled={props.school == null || props.school.id == "" || props.user == null || props.name == "" || (checkEmail != null && props.originalStudentEmail != props.studentEmail)}
                      >
                    Submit
                    </Button>
                    </Grid>
                </Grid>
                </Box>
          </Box>
          </Container>
          </ThemeProvider>
          
    )
}