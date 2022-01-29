import * as React from 'react';
import Typography from '@mui/material/Typography';
import SchoolForm from '../SchoolForm';
import axios from 'axios';
import {Link as RouterLink, useParams, useNavigate} from 'react-router-dom';


export default function UpdateSchool(props) {
    let navigate = useNavigate();
    let { id } = useParams();

    const [name, setName] = React.useState("");
    const [address, setAddress] = React.useState("");

    const handleSubmit = (event, na, ad) => {
        event.preventDefault();
    
        axios.patch(`http://localhost:5000/school/${id}`, {
          name: na,
          address: ad
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

      React.useEffect(() => {
        const fetchData = async() => {
          const result = await axios.get(
            `http://localhost:5000/school/${id}`, {
              headers: {
                  Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
          if (result.data.success){
            setName(result.data.school.name);
            setAddress(result.data.school.address);
            console.log(name);
            console.log(address);
          }
          else{
            props.setSnackbarMsg(`School could not be loaded`);
            props.setShowSnackbar(true);
            props.setSnackbarSeverity("error");
            navigate("/schools");
          }
        };
        fetchData();
      }, []);

    return(
        <>
        <Typography component="h1" variant="h5">
            Update School
        </Typography>
        <SchoolForm name={name} address={address} handleSubmit={handleSubmit}/>
        </>
    )
}