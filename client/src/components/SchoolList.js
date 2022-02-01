import * as React from 'react';
import Button from '@mui/material/Button';
import { DataGrid } from '@mui/x-data-grid';
import {Link as RouterLink, useNavigate} from 'react-router-dom';
import axios from 'axios';

const columns = [
  { field: 'name', headerName: 'School Name', width: 250,
  },
  {
    field: 'address',
    headerName: 'Address',
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
          to={"/schools/" + params.value}
          color="primary"
          size="small"
          style={{ marginLeft: 16 }}
        >
          View School
        </Button>
      </>
    ),
  }
];


export default function DataTable(props) {

  const [rows, setRows] = React.useState([]);
  let navigate = useNavigate();

  React.useEffect(()=> {
    const fetchData = async() => {
      const result = await axios.get(
        'http://localhost:5000/school', {
          headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      if (result.data.success){
        console.log(result.data.schools);
        let arr = result.data.schools.map((value) => {
          console.log({name: value.name, id: value.id, address: value.address});
          return {name: value.name, id: value.id, address: value.address};
        });
        setRows(arr);
      }
      else{
        props.setSnackbarMsg(`Routes could not be loaded`);
        props.setShowSnackbar(true);
        props.setSnackbarSeverity("error");
        navigate("/routes");
      }
    };
    fetchData();
  }, [])

  return (
    <div style={{ height: 400, width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id} //set what is used as ID ******MUST BE UNIQUE***********
        paginationMode="server"
        
        disableSelectionOnClick
      />
      <Button
      component={RouterLink}
      to={"/schools/create"}
      variant="outlined"
      color="primary"
      size="small"
      style={{ marginLeft: 16 }}
      >
        Create School
      </Button>
    </div>
  );
}