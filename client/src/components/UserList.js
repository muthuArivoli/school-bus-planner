import * as React from 'react';
import Button from '@mui/material/Button';
import { DataGrid } from '@mui/x-data-grid';
import {Link as RouterLink, useNavigate} from 'react-router-dom';
import axios from 'axios';

const columns = [
  { field: 'name', headerName: 'Full Name', width: 250},
  { field: 'email', headerName: 'Email', width: 250},
  { field: 'address', headerName: 'Address', width: 250},
  { 
    field: 'admin',
    headerName: 'Admin',
    width: 250,
  },
  {
    field: 'id',
    headerName: 'Detailed View',
    width: 250,
    renderCell: (params) => (
      <>
        <Button
          component={RouterLink}
          to={"/users/" + params.value}
          color="primary"
          size="small"
          style={{ marginLeft: 16 }}
        >
          View User
        </Button>
      </>
    ),
  },
];

export default function DataTable(props) {

  const [rows, setRows] = React.useState([]);
  let navigate = useNavigate();

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
        let arr = result.data.users.map((value) => {
          console.log({name: value.full_name, id: value.id, address: value.uaddress, email: value.email, admin: value.admin_flag});
          return {name: value.full_name, id: value.id, address: value.uaddress, email: value.email, admin: value.admin_flag};
        });
        setRows(arr);
      }
      else{
        props.setSnackbarMsg(`Users could not be loaded`);
        props.setShowSnackbar(true);
        props.setSnackbarSeverity("error");
        navigate("/users");
      }
    };
    fetchData();
  }, [])

  return (
    <>
    <div style={{ height: 400, width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id} //set what is used as ID ******MUST BE UNIQUE***********
        pageSize={5}
        rowsPerPageOptions={[5]}
        disableSelectionOnClick
      />
    </div>
    <Button
      component={RouterLink}
      to={"/users/create"}
      color="primary"
      variant="outlined"
      size="small"
      style={{ marginLeft: 16 }}
      >
        Create User
      </Button>
      </>
  );
}