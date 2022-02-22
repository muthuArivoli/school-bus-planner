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
    
    const [latitude, setLatitude] = React.useState("");
    const [longitude, setLongitude] = React.useState("");

    const [departureTime, setDepartureTime] = React.useState(new Date('2018-01-01T00:00:00.000Z'));
    const [arrivalTime, setArrivalTime] = React.useState(new Date('2018-01-01T00:00:00.000Z'));


    const handleSubmit = (event, na, ad, latitude, longitude, departureTime, arrivalTime) => { //
        event.preventDefault();
        var offset = arrivalTime.getTimezoneOffset() / 60; 
        arrivalTime.setHours(arrivalTime.getHours() - offset);
        departureTime.setHours(departureTime.getHours() - offset);
        var arrive = arrivalTime.toISOString();
        var depart = departureTime.toISOString();
        console.log({
          name: na,
          address: ad,
          latitude: latitude, //
          longitude: longitude, //
          departure_time: depart,
          arrival_time: arrive
        });
        
        axios.patch(process.env.REACT_APP_BASE_URL+`/school/${id}`, {
          name: na,
          address: ad,
          latitude:latitude,
          longitude:longitude,
          departure_time: depart,
          arrival_time: arrive
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
            // setLongitude(result.data.school.longitude);
            // setLatitude(result.data.school.latitude);
            // setDepartureTime(result.data.school.departure_time);
            // setArrivalTime(result.data.school.arrival_time);
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
        <SchoolForm 
        name={name} 
        address={address} 
        departureTime={departureTime} 
        arrivalTime={arrivalTime}
        latitude={latitude} 
        setLatitude={setLatitude} 
        longitude={longitude} 
        setLongitude={setLongitude} 
        handleSubmit={handleSubmit} 
        title="Update School"/>
        </>
    )
}