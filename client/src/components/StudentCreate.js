import * as React from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import StudentForm from './StudentForm';


export default function CreateSchool() {

    const handleSubmit = () => {
        console.log("a");
    }

    return(
        <>
          <Typography component="h1" variant="h5">
            Create Student
          </Typography>
        <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 3 }}>  
        <StudentForm/>
        <Button type="submit"
                  variant="contained"
                  onClick={handleSubmit}
                  >
                    Submit
        </Button>
        </Box>
        </>
    )
}