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
                'http://localhost:5000/user', {
                  headers: {
                      Authorization: `Bearer ${localStorage.getItem('token')}`
                  }
                }
              );
              if (result.data.success){
                console.log(result.data.users);
                let arr = result.data.schools.map((value) => {
                  console.log({name: value.name, id: value.id, address: value.address});
                  return {name: value.name, id: value.id, address: value.address};
                });
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

    const getSchools = () => {
        return ["abc", "cde"];
      }
    
      const getRoutes = () => {
          return ["fgh", "qrt", "wqe"];
      }

    const getUsers = () => {
        return ["ab", "cd"];
    }

    return (
        <>
                    <Grid item xs={12}>
                    <TextField
                        autoFocus
                        required
                        label="Name"
                        id="name"
                        defaultValue={props.name || ""}
                        fullWidth
                    />
                    </Grid>
                    <Grid item xs={12}>
                    <TextField
                        autoFocus
                        required
                        label="Student ID"
                        id="student_id"
                        defaultValue={props.id || ""}
                        fullWidth
                    />
                    <Grid item xs={12}>
                        <Autocomplete
                            autoFocus
                            options={users}
                            autoSelect
                            defaultValue={props.user || ""}
                            renderInput={(params) => <TextField {...params} label="User Name" />}
                        />
                        </Grid>
                    <Grid item xs={12}>
                    <Autocomplete
                        autoFocus
                        options={schools}
                        autoSelect
                        defaultValue={props.school || ""}
                        onChange={getRoutes}
                        renderInput={(params) => <TextField {...params} label="School Name" />}
                    />
                    </Grid>
                    <Grid item xs={12}>
                    <Autocomplete
                        autoFocus
                        disabled={routes.length == 0}
                        options={routes}
                        autoSelect
                        defaultValue={props.route || ""}
                        renderInput={(params) => <TextField {...params} label="Route Name" />}
                    />
                    </Grid>
                </Grid>
                </>
    )
}