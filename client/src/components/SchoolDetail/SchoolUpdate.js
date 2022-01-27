import * as React from 'react';
import Typography from '@mui/material/Typography';
import SchoolForm from '../SchoolForm'


export default function UpdateSchool() {

    const handleSubmit = () => {
        console.log("a");
    }

    return(
        <>
        <Typography component="h1" variant="h5">
            Update School
        </Typography>
        <SchoolForm name="abc" address="abc" handleSubmit={handleSubmit}/>
        </>
    )
}