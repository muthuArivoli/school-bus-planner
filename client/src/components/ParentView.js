import * as React from 'react';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import {Link as RouterLink, useParams} from 'react-router-dom';
import DeleteDialog from './DeleteDialog';
import { GridOverlay, DataGrid } from '@mui/x-data-grid';
import Typography from '@mui/material/Typography';
import axios from 'axios';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';

const columns = [
  { field: 'name', headerName: 'Full Name', width: 250},
  {
    field: 'id',
    headerName: 'Detailed View',
    width: 250,
    renderCell: (params) => (
      <>
        <Button
          component={RouterLink}
          to={"/students/" + params.value +"/view"}
          color="primary"
          size="small"
          style={{ marginLeft: 16 }}
        >
          View Student
        </Button>
      </>
    ),
  },
];

function NoStudentsOverlay() {
  return (
    <GridOverlay>
      <Box sx={{ mt: 1 }}>No Students for Current User</Box>
    </GridOverlay>
  );
}

export default function ParentView() {

  const [rows, setRows] = React.useState([]);
  const [data, setData] = React.useState({});

  const [error, setError] = React.useState(false);
  const [snackbarMsg, setSnackbarMsg] = React.useState("");
  const [snackbarSeverity, setSnackbarSeverity] = React.useState("error");

  const [password, setPassword] = React.useState("");
  const [conPassword, setConPassword] = React.useState("");

  React.useEffect(() =>{
    const fetchData = async() => {
      const result = await axios.get(
        process.env.REACT_APP_BASE_URL+`/current_user`, {
          headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      if (result.data.success){
        setData(result.data.user);
        setRows(result.data.students);
      }
    }
    fetchData();
  }, []);

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
        setSnackbarMsg(`Password successfully updated`);
        setError(true);
        setSnackbarSeverity("success");
      }
      else{
        setSnackbarMsg(`Password not successfully updated`);
        setError(true);
        setSnackbarSeverity("error");
      }
      setPassword("");
      setConPassword("");
    }).catch((err) => {
      setSnackbarMsg(`Password not successfully updated`);
      setError(true);
      setSnackbarSeverity("error");
      setPassword("");
      setConPassword("");
    });
  };

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    setError(false);
  };

  return (
    <>
    <Snackbar open={error} onClose={handleClose}>
    <Alert onClose={handleClose} severity={snackbarSeverity}>
      {snackbarMsg}
    </Alert>
  </Snackbar>
    <Grid container alignItems="center" justifyContent="center" pt={5}>
        <Stack spacing={4} sx={{ width: '100%'}}>
          <Stack direction="row" spacing={25} justifyContent="center">
          <Typography variant="h5" align="center">
            Name: {data.full_name}
          </Typography>
          <Typography variant="h5" align="center">
            Email: {data.email}
          </Typography>
          <Typography variant="h5" align="center">
            Address: {data.uaddress}
          </Typography>
          </Stack>
        </Stack>
        <div style={{ height: 400, width: '100%' }}>
        <div style={{ display: 'flex', height: '100%' }}>
          <div style={{ flexGrow: 1 }}>
            <DataGrid
              components={{
                NoRowsOverlay: NoStudentsOverlay,
              }}
              rows={rows}
              columns={columns}
              getRowId={(row) => row.id} //set what is used as ID ******MUST BE UNIQUE***********
              pageSize={5}
              rowsPerPageOptions={[5]}
              disableSelectionOnClick
              density="compact"
            />
          </div>
        </div>
      </div>

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

      </Grid>
      </>
  );
}