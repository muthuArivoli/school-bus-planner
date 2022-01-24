import * as React from 'react';
import Typography from '@mui/material/Typography';
import SchoolForm from './SchoolForm'


export default function CreateSchool() {

    const handleSubmit = () => {
        console.log("a");
    }

    return(
        <>
          <Typography component="h1" variant="h5">
            Create School
          </Typography>
        <SchoolForm handleSubmit={handleSubmit}/>
        </>
    )
}