import * as React from 'react';
import Typography from '@mui/material/Typography';
import SchoolForm from '../SchoolForm';
import axios from 'axios';
import {Link as RouterLink, useParams, useNavigate} from 'react-router-dom';


export default function UpdateSchool(props) {
    let navigate = useNavigate();
    let { id } = useParams();

    const handleSubmit = (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
    
        axios.patch(`http://localhost:5000/school/${id}`, {
          name: data.get('name'),
          address: data.get('address')
        }, {
          headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }).then((res) => {
          if (res.data.success){
            props.setSnackbarMsg(`School successfully updated`);
            props.setShowSnackbar(true);
            props.setSnackbarSeverity("success");
            navigate("/schools");
          }
          else{
            props.setSnackbarMsg(`School not successfully updated`);
            props.setShowSnackbar(true);
            props.setSnackbarSeverity("error");
            navigate("/schools");
          }
        });
      };

    return(
        <>
        <Typography component="h1" variant="h5">
            Update School
        </Typography>
        <SchoolForm name="abc" address="abc" handleSubmit={handleSubmit}/>
        </>
    )
}