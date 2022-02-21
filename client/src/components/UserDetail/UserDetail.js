import * as React from 'react';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import {Link as RouterLink, useParams, useNavigate} from 'react-router-dom';
import DeleteDialog from '../DeleteDialog';
import UserDetailMid from './UserDetailMid';
import Typography from '@mui/material/Typography';
import axios from 'axios';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

export default function UserDetail(props) {

  const [error, setError] = React.useState(false);
  const [data, setData] = React.useState({});
  const [rows, setRows] = React.useState([]);
  let { id } = useParams();
  let navigate = useNavigate();

  const handleDelete = () => {
    axios.delete(process.env.REACT_APP_BASE_URL+`/user/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    }).then((res) => {
      if(res.data.success) {
        props.setSnackbarMsg(`User successfully deleted`);
        props.setShowSnackbar(true);
        props.setSnackbarSeverity("success");
        navigate("/users");
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

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    setError(false);
  };

  React.useEffect(() => {
    const fetchData = async() => {
      const result = await axios.get(
        process.env.REACT_APP_BASE_URL+`/user/${id}`, {
          headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      if (result.data.success){
        setData(result.data.user);

        let newRows = [];
        for(let i=0;i<result.data.user.children.length; i++){
          const studentRes = await axios.get(
            process.env.REACT_APP_BASE_URL+`/student/${result.data.user.children[i]}`, {
              headers: {
                  Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
          if(studentRes.data.success){
            newRows = [...newRows, {name: studentRes.data.student.name, id: result.data.user.children[i], route_id: studentRes.data.student.route_id, in_range: studentRes.data.student.in_range}]
          }
          else{
            props.setSnackbarMsg(`User could not be loaded`);
            props.setShowSnackbar(true);
            props.setSnackbarSeverity("error");
            navigate("/users");
          }
        }
        setRows(newRows);
      }
      else{
        props.setSnackbarMsg(`User could not be loaded`);
        props.setShowSnackbar(true);
        props.setSnackbarSeverity("error");
        navigate("/users");
      }

    };

    fetchData();
  }, []);

  return (
    <>
    <Snackbar open={error} onClose={handleClose}>
      <Alert onClose={handleClose} severity="error">
        Failed to delete user.
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
        
        <UserDetailMid rows={rows}/>

        <Stack direction="row" spacing={3} justifyContent="center">
          <Button component={RouterLink}
              to={"/users/" + id +"/update"}
              color="primary"
              variant="outlined"
              size="small"
              style={{ }}>
              Modify
          </Button>
          <DeleteDialog dialogTitle="Delete User?" dialogDesc={`Please confirm you would like to delete user ${data.full_name}`} onAccept={handleDelete}/>
        </Stack>
      </Stack>
    </Grid>
    </>
  );
}