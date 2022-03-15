import * as React from 'react';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import {Link as RouterLink, useParams, useNavigate} from 'react-router-dom';
import SchoolDeleteDialog from './SchoolDeleteDialog';
import SchoolDetailMid from './SchoolDetailMid'
import Typography from '@mui/material/Typography';
import axios from 'axios';
import { DateTime } from 'luxon';
import { Helmet } from 'react-helmet';

export default function SchoolDetail(props) {

  const [error, setError] = React.useState(false);
  let { id } = useParams();
  let navigate = useNavigate();

  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState({name: "", address: "", arrival_time: "", departure_time: ""});

  const [students, setStudents] = React.useState([]);
  const [routes, setRoutes] = React.useState([]);

  const [role, setRole] = React.useState(0);

  function tConvert(time) {
    let date_time = DateTime.fromISO(time);
    return date_time.toLocaleString(DateTime.TIME_SIMPLE);
  }

  React.useEffect(()=>{
    const fetchData = async() => {
      const result = await axios.get(
        process.env.REACT_APP_BASE_URL+`/current_user`, {
          headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      )
      if(result.data.success){
        setRole(result.data.user.role);
      }
      else{
        props.setSnackbarMsg(`Current user could not be loaded`);
        props.setShowSnackbar(true);
        props.setSnackbarSeverity("error");
        navigate("/");
      }
    }
    fetchData();
  }, [])  

  React.useEffect(() => {
    const fetchData = async() => {
      setLoading(true);
      const result = await axios.get(
        process.env.REACT_APP_BASE_URL+`/school/${id}`, {
          headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      if (result.data.success){
        console.log(result.data);
        let newSchool = result.data.school;
        newSchool.arrival_time = tConvert(result.data.school.arrival_time);
        newSchool.departure_time = tConvert(result.data.school.departure_time);
        setData(newSchool);
        let newRows = result.data.school.students.map((value)=>{
          return {...value, name: {name: value.name, id: value.id}}
        })
        setStudents(newRows);
        let newRoutes = result.data.school.routes.map((value)=>{return {data: {name: value.name, id: value.id}, id: value.id, complete: value.complete}});
        setRoutes(newRoutes);

      }
      else{
        props.setSnackbarMsg(`School could not be loaded`);
        props.setShowSnackbar(true);
        props.setSnackbarSeverity("error");
        navigate("/schools");
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    setError(false);
  };

 const handleDelete = () => {
  axios.delete(process.env.REACT_APP_BASE_URL+`/school/${id}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  }).then((res) => {
    if(res.data.success) {
      props.setSnackbarMsg(`School successfully deleted`);
      props.setShowSnackbar(true);
      props.setSnackbarSeverity("success");
      navigate("/schools");
    }
    else {
      setError(true);
    }
  }).catch((err) => {
    console.log(err.response)
    console.log(err.response.status)
    console.log(err.response.headers)
  });
 }

  return (
    <>
    <Helmet>
      <title>
        {data.name + " - Detail"}
      </title>
    </Helmet>
    <Snackbar open={error} onClose={handleClose}>
    <Alert onClose={handleClose} severity="error">
      Failed to delete school.
    </Alert>
  </Snackbar>
    <Grid container justifyContent="center" pt={5}>
      <Stack spacing={4} sx={{ width: '100%'}}>
        <Stack direction="row" spacing={25} justifyContent="center">
        <Typography variant="h5" align="center" /*sx={{ width: 150 }}*/>
          School Name: {data.name}
        </Typography>
        <Typography variant="h5" align="center">
          Address: {data.address}
        </Typography>



      </Stack>


        <Stack direction = 'row' spacing = {30} justifyContent='center'>
        <Typography variant="h5" align="center">
          Arrival Time: {data.arrival_time}
        </Typography>

        <Typography variant="h5" align="center">
          Departure Time: {data.departure_time}
        </Typography>

        </Stack>   

        <SchoolDetailMid students={students} routes={routes} loading={loading}/>

        <Stack direction="row" spacing={3} justifyContent="center">
          {
          (role == 1 || role == 2) &&
          <Button component={RouterLink}
                to={"/schools/" + id + "/routes"}
                color="primary"
                variant="outlined"
                size="small"
                style={{  }}>
                  Route Planner
          </Button>
          }
          {
          (role == 1 || role == 2) &&  
          <Button component={RouterLink}
              to={"/schools/" + id +"/update"}
              color="primary"
              variant="outlined"
              size="small"
              style={{  }}>
              Modify
          </Button>
          }
          {
          role == 1 &&
          <SchoolDeleteDialog schoolName={data.name} handleDelete={handleDelete}/>
          }
          {
          (role == 1 || role == 2) &&
          <Button component={RouterLink}
              to={`/email?school=${id}`}
              color="primary"
              variant="outlined"
              size="small"
              style={{ }}>
              Email
          </Button>
          }
        </Stack>
      </Stack>
    </Grid>
    </>
  );
}