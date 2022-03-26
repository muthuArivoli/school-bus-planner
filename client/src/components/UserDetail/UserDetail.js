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
import { Helmet } from 'react-helmet';

export default function UserDetail(props) {

  const [error, setError] = React.useState(false);
  const [data, setData] = React.useState({});
  const [rows, setRows] = React.useState([]);
  const [errorMsg, setErrorMsg] = React.useState("")
  let { id } = useParams();
  let navigate = useNavigate();

  const [role, setRole] = React.useState(0);

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
        setErrorMsg("Failed to delete: " + res.data.msg);
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
        let newRows = result.data.user.children.map((value)=>{
          return {...value, name: {name: value.name, id: value.id}}
        });
        console.log(newRows);
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
    <Helmet>
      <title>
        {data.full_name + " - Detail"}
      </title>
    </Helmet>
    <Snackbar open={error} onClose={handleClose}>
      <Alert onClose={handleClose} severity="error">
        {errorMsg}
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
        </Stack>
          <Stack direction="row" spacing={25} justifyContent="center"> 
          {
            data.role == 0 && 
          <Typography variant="h5" align="center">
            Address: {data.uaddress}
          </Typography>
          }
          <Typography variant="h5" align="center">
            Phone Number: {data.phone}
          </Typography>
          </Stack>

        {
          data.role == 0 &&
        <UserDetailMid rows={rows}/>
        }

        <Stack direction="row" spacing={3} justifyContent="center">
          
        <Button
          component={RouterLink}
          to={"/students/create"}
          color="primary"
          variant="contained"
          size="small"
          style={{ marginLeft: 16 }}
          >
            Create Student
          </Button>


          {
          (role == 1 || role == 2) &&
          <Button component={RouterLink}
              to={"/users/" + id +"/update"}
              color="primary"
              variant="contained"
              size="small"
              style={{ }}>
              Modify
          </Button>
          }


          {
          (role == 1 || role == 2) && !(role == 2 && data.role != 0) &&
          <DeleteDialog dialogTitle="Delete User?" dialogDesc={`Please confirm you would like to delete user ${data.full_name}`} onAccept={handleDelete}/>
          }
        </Stack>
      </Stack>
    </Grid>
    </>
  );
}