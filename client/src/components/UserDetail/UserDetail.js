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
  let { id } = useParams();
  let navigate = useNavigate();

  const handleDelete = () => {
    axios.delete(`http://localhost:5000/user/${id}`, {
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
        `http://localhost:5000/user/${id}`, {
          headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      if (result.data.success){
        setData(result.data.user);
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
        
        <UserDetailMid/>

        <Stack direction="row" spacing={3} justifyContent="center">
          <Button component={RouterLink}
              to={"/users/" + id +"/update"}
              color="primary"
              variant="outlined"
              size="small"
              style={{ marginLeft: 16 }}>
              Modify
          </Button>
          <DeleteDialog dialogTitle="Delete User?" dialogDesc="Please confirm you would like to delete this user" onAccept={handleDelete}/>
        </Stack>
      </Stack>
    </Grid>
    </>
  );
}