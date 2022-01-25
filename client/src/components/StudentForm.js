import * as React from 'react';
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';

export default function StudentForm(props) {

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
                        defaultValue={props.name || ""}
                        fullWidth
                    />
                    </Grid>
                    <Grid item xs={12}>
                    <TextField
                        autoFocus
                        required
                        label="Student ID"
                        defaultValue={props.id || ""}
                        fullWidth
                    />
                    <Grid item xs={12}>
                        <Autocomplete
                            autoFocus
                            options={getUsers()}
                            autoSelect
                            defaultValue={props.user || ""}
                            renderInput={(params) => <TextField {...params} label="User Name" />}
                        />
                        </Grid>
                    <Grid item xs={12}>
                    <Autocomplete
                        autoFocus
                        options={getSchools()}
                        autoSelect
                        defaultValue={props.school || ""}
                        renderInput={(params) => <TextField {...params} label="School Name" />}
                    />
                    </Grid>
                    <Grid item xs={12}>
                    <Autocomplete
                        autoFocus
                        options={getRoutes()}
                        autoSelect
                        defaultValue={props.route || ""}
                        renderInput={(params) => <TextField {...params} label="Route Name" />}
                    />
                    </Grid>
                </Grid>
                </>
    )
}