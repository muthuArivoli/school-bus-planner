import * as React from 'react'
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControl';
import Button from '@mui/material/Button';
import Input from '@mui/material/Input';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';

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
            Update User
      </Typography>
        <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 3 }}>
        <Grid container spacing={2}>
            <Grid item md={12}>
                <FormControl>
                  <InputLabel htmlFor="email">Email</InputLabel>
                  <Input id="email" defaultValue={"ab"} />
                </FormControl>
              </Grid>
              <Grid item md={12}>
                <TextField
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="new-password"
                />
              </Grid>
              <Grid item md={12}>
                <TextField
                  required={false/* Implement Check */}
                  name="confirm-password"
                  label="Confirm Password"
                  type="password"
                  id="confirm-password"
                />
              </Grid>
              <Grid item md={12}>
                <FormControl>
                  <InputLabel htmlFor="name">Name</InputLabel>
                  <Input id="name" defaultValue={"ab"} />
                </FormControl>
              </Grid>
              <Grid item md={12}>
                <FormControl>
                  <InputLabel htmlFor="address">Address</InputLabel>
                  <Input id="address" defaultValue={"ab"} />
                </FormControl>
              </Grid>
              <Grid item md={12}>
                <FormControlLabel
                  control={<Checkbox value="admin" color="primary" />}
                  label="Admin"
                />
              </Grid>
              <Grid item sm={12}>
                <Button type="submit"
                  variant="contained"
                  >
                    Submit
                </Button>
              </Grid>
            </Grid>

        </Box>
        </Box>
        </Container>
        </ThemeProvider>
        </>
    )
}