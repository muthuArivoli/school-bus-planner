import * as React from 'react'
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import StudentForm from './StudentForm';

const theme = createTheme();

export default function UserUpdate() {

    const handleSubmit = () => {
        console.log("a");
    }

    return(
        <>
          <ThemeProvider theme={theme}>
              <Container component="main">
                <CssBaseline />
                <Box
                  sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'left',
                  }}
                  >
                  <Typography component="h1" variant="h5">
                    Update Student
                  </Typography>
                  <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 3 }}>
                    <StudentForm/>
                    <Button type="submit" variant="contained">
                      Submit
                    </Button>
                  </Box>
                </Box>
            </Container>
          </ThemeProvider>
        </>
    )
}