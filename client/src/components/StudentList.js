import * as React from 'react';
import Button from '@mui/material/Button';
import { DataGrid } from '@mui/x-data-grid';
import {Link as RouterLink, useNavigate} from 'react-router-dom';
import axios from 'axios';

const columns = [
  { field: 'name', headerName: 'Full Name', width: 250},
  { field: 'student_id', headerName: 'Student ID', width: 250},
  { 
    field: 'school',
    headerName: 'School',
    width: 250,
  },
  {
    field: 'route',
    headerName: 'Route',
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
          to={"/students/" + params.value}
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

export default function DataTable(props) {
  const [rows, setRows] = React.useState([]);
  let navigate = useNavigate();

  React.useEffect(()=> {
    const fetchData = async() => {
      const result = await axios.get(
        'http://localhost:5000/student', {
          headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      if (result.data.success){
        let arr = [];
        let data = result.data.students
        console.log(data);
        for (let i=0;i<data.length; i++){
          const getRes = await axios.get(
            `http://localhost:5000/school/${data[i].school_id}`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
          if (getRes.data.success){
            arr = [...arr, {name: data[i].name, student_id: data[i].student_id, school: getRes.data.school.name, route: "", id: data[i].id}]
          }
          else{
            props.setSnackbarMsg(`Students could not be loaded`);
            props.setShowSnackbar(true);
            props.setSnackbarSeverity("error");
            navigate("/students");
          }
          if(data[i].route_id != null){
            const getRouteRes = await axios.get(
              `http://localhost:5000/route/${data[i].route_id}`, {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem('token')}`
                }
              }
            );
            if (getRouteRes.data.success){
              arr[arr.length - 1].route = getRouteRes.data.route.name;
            }
            else{
              props.setSnackbarMsg(`Students could not be loaded`);
              props.setShowSnackbar(true);
              props.setSnackbarSeverity("error");
              navigate("/students");
            }
          }

        }
        setRows(arr);
      }
      else{
        props.setSnackbarMsg(`Students could not be loaded`);
        props.setShowSnackbar(true);
        props.setSnackbarSeverity("error");
        navigate("/students");
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
      to={"/students/create"}
      color="primary"
      variant="outlined"
      size="small"
      style={{ marginLeft: 16 }}
      >
        Create Student
      </Button>
      </>
  );
}