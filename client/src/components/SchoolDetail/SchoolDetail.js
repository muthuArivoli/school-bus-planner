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

export default function SchoolDetail(props) {

  const [error, setError] = React.useState(false);
  let { id } = useParams();
  let navigate = useNavigate();

  const [data, setData] = React.useState({name: "", address: "", arrival_time: "", departure_time: ""});

  const [students, setStudents] = React.useState([]);
  const [routes, setRoutes] = React.useState([]);

  React.useEffect(() => {
    const fetchData = async() => {
      const result = await axios.get(
        process.env.REACT_APP_BASE_URL+`/school/${id}`, {
          headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      if (result.data.success){
        console.log(result.data);
        setData(result.data.school);

        let newRows = [];
        for(let i=0; i<result.data.school.students.length; i++){
          const studentRes = await axios.get(
            process.env.REACT_APP_BASE_URL+`/student/${result.data.school.students[i]}`, {
              headers: {
                  Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
          if(studentRes.data.success){
            if(studentRes.data.student.route_id != null){
              const routRes = await axios.get(
                process.env.REACT_APP_BASE_URL+`/route/${studentRes.data.student.route_id}`, {
                  headers: {
                      Authorization: `Bearer ${localStorage.getItem('token')}`
                  }
                }
              );
              if (routRes.data.success){
                newRows = [...newRows, {name: {name: studentRes.data.student.name, id: result.data.school.students[i]}, 
                                        id: result.data.school.students[i], route: {id: studentRes.data.student.route_id, name: routRes.data.route.name}, 
                                        in_range: studentRes.data.student.in_range}]
              }
              else{
                props.setSnackbarMsg(`School could not be loaded`);
                props.setShowSnackbar(true);
                props.setSnackbarSeverity("error");
                navigate("/schools");
              }
            }
            else{
              newRows = [...newRows, {name: {name: studentRes.data.student.name, id: result.data.school.students[i]}, 
                                      id: result.data.school.students[i], route: null, 
                                      in_range: studentRes.data.student.in_range}]
            }
          }
          else{
            props.setSnackbarMsg(`School could not be loaded`);
            props.setShowSnackbar(true);
            props.setSnackbarSeverity("error");
            navigate("/schools");
          }
        }
        setStudents(newRows);

        let newRoutes = result.data.school.routes.map((value)=>{return {data: {name: value.name, id: value.id}, id: value.id, complete: value.complete}});
        setRoutes(newRoutes);

      }
      else{
        props.setSnackbarMsg(`Route could not be loaded`);
        props.setShowSnackbar(true);
        props.setSnackbarSeverity("error");
        navigate("/routes");
      }

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
    <Snackbar open={error} onClose={handleClose}>
    <Alert onClose={handleClose} severity="error">
      Failed to delete school.
    </Alert>
  </Snackbar>
    <Grid container justifyContent="center" pt={5}>
      <Stack spacing={4} sx={{ width: '100%'}}>
        <Stack direction="row" spacing={50} justifyContent="center">
        <Typography variant="h5" align="center">
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

        <SchoolDetailMid students={students} routes={routes}/>

        <Stack direction="row" spacing={3} justifyContent="center">
          <Button component={RouterLink}
                to={"/schools/" + id + "/routes"}
                color="primary"
                variant="outlined"
                size="small"
                style={{  }}>
                  Route Planner
          </Button>
          <Button component={RouterLink}
              to={"/schools/" + id +"/update"}
              color="primary"
              variant="outlined"
              size="small"
              style={{  }}>
              Modify
          </Button>
          <SchoolDeleteDialog schoolName={data.name} handleDelete={handleDelete}/>
          <Button component={RouterLink}
              to={`/email?school=${id}`}
              color="primary"
              variant="outlined"
              size="small"
              style={{ }}>
              Email
          </Button>
        </Stack>
      </Stack>
    </Grid>
    </>
  );
}