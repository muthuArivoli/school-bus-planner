import * as React from 'react';
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';


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
                  }
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
                  }
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
        <>
                    <Grid item xs={12}>
                    <TextField
                        autoFocus
                        required
                        label="Name"
                        id="name"
                        value={props.name}
                        onChange={(e) => props.updateName(e.target.value)}
                        fullWidth
                    />
                    </Grid>
                    <Grid item xs={12}>
                    <TextField
                        autoFocus
                        type="number"
                        label="Student ID"
                        id="student_id"
                        value={props.studentId || ""}
                        onChange={(e) => props.updateStudentId(e.target.value)}
                        fullWidth
                    />
                    <Grid item xs={12}>
                        <Autocomplete
                            autoFocus
                            required
                            options={users}
                            id="user"
                            autoSelect
                            value={props.user}
                            onChange={(e, new_value) => props.updateUser(new_value)}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            renderInput={(params) => <TextField {...params} label="User Name" />}
                        />
                        </Grid>
                    <Grid item xs={12}>
                    <Autocomplete
                        autoFocus
                        required
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
                        value={props.route}
                        onChange={(e, new_val) => props.updateRoute(new_val)}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        renderInput={(params) => <TextField {...params} label="Route Name" />}
                    />
                    </Grid>
                </Grid>
                </>
    )
}