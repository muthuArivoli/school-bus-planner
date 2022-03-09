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

const theme = createTheme();

export default function StudentForm(props) {

    const [users, setUsers] = React.useState([]);
    const [schools, setSchools] = React.useState([]);
    const [routes, setRoutes] = React.useState([]);

    let navigate = useNavigate()

        React.useEffect(()=> {
            const fetchData = async() => {
              const result = await axios.get(
                process.env.REACT_APP_BASE_URL+'/user', {
                  headers: {
                      Authorization: `Bearer ${localStorage.getItem('token')}`
                  },
                  params: {sort: "email", dir: "asc"}
                }
              );
              if (result.data.success){
                console.log(result.data.users);
                let arr = result.data.users.map((value) => {
                  console.log({label: value.email, id: value.id});
                  return {label: value.email, id: value.id};
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
                console.log(result.data.schools);
                let arr = result.data.schools.map((value) => {
                  console.log({label: value.name, id: value.id});
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

      const getRoutes = (e, value) => {

          if (value == null || value.id == ""){
              return;
          }
          axios.get(process.env.REACT_APP_BASE_URL+`/school/${value.id}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }).then((result) => {
            console.log(result.data);
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
                        fullWidth
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
                        fullWidth
                    />
                    </Grid>
                    <Grid item xs={12}>
                        <Autocomplete
                            autoFocus
                            required
                            fullWidth
                            options={users}
                            id="user"
                            autoSelect
                            required
                            value={props.user}
                            onChange={(e, new_value) => props.updateUser(new_value)}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            renderInput={(params) => <TextField {...params} label="Parent Email" />}
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
                        required
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
                  disabled={props.school == null || props.school.id == "" || props.user == null || props.user.id == "" || props.name == ""}
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