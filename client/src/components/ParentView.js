import * as React from 'react';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import { Link as RouterLink } from 'react-router-dom';
import { GridOverlay, DataGrid } from '@mui/x-data-grid';
import Typography from '@mui/material/Typography';
import axios from 'axios';
import Box from '@mui/material/Box';
import { Helmet } from 'react-helmet';

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

  const [data, setData] = React.useState({children: []});

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
      }
    }
    fetchData();
  }, []);

  return (
    <>
    <Helmet>
      <title>
        Dashboard
      </title>
    </Helmet>
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

        <Stack spacing={10} justifyContent="center" alignItems="center" sx={{ width: '100%'}}>
          <div style={{ height: 400, width: '100%' }}>
            <div style={{ display: 'flex', height: '100%' }}>
              <div style={{ flexGrow: 1 }}>
                <DataGrid
                  components={{
                    NoRowsOverlay: NoStudentsOverlay,
                  }}
                  rows={data.children}
                  columns={columns}
                  getRowId={(row) => row.id} //set what is used as ID ******MUST BE UNIQUE***********
                  autoPageSize
                  disableSelectionOnClick
                  density="compact"
                />
              </div>
            </div>
          </div>  
        </Stack>

      </Grid>
      </>
  );
}