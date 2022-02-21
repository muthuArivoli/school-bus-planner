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
    const [latitude, setLatitude] = React.useState(null);
    const [longitude, setLongitude] = React.useState(null);

    const handleSubmit = (event, na, ad, lat, long) => { //
        event.preventDefault();
    
        console.log({
          name: na,
          address: ad,
          latitude: lat,
          longitude: long 
        });


        axios.patch(process.env.REACT_APP_BASE_URL+`/school/${id}`, {
          name: na,
          address: ad,
          latitude: lat,
          longitude: long
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
            process.env.REACT_APP_BASE_URL+`/school/${id}`, {
              headers: {
                  Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
          if (result.data.success){
            setName(result.data.school.name);
            setAddress(result.data.school.address);
            setLatitude(result.data.school.latitude);
            setLongitude(result.data.school.longitude);
            console.log(result.data.school);
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
        <SchoolForm name={name} address={address} latitude={latitude} longitude={longitude} handleSubmit={handleSubmit} title="Update School"/>
        </>
    )
}