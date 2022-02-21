import * as React from 'react'
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import FormControl from '@mui/material/FormControl';
import Button from '@mui/material/Button';
import Input from '@mui/material/Input';
import InputLabel from '@mui/material/InputLabel';
import GoogleMap from './GoogleMap';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

const theme = createTheme();

export default function SchoolForm(props) {

  const [name, setName] = React.useState(props.name || "");
  const [address, setAddress] = React.useState(props.address || "");
  
  const [latitude, setLatitude] = React.useState(props.latitude);
  const [longitude, setLongitude] = React.useState(props.longitude);

  React.useEffect(() => {
    setName(props.name);
  }, [props.name])

  React.useEffect(() => {
    setLatitude(props.latitude);
  }, [props.latitude])

  React.useEffect(() => {
    setLongitude(props.longitude);
  }, [props.longitude])

  React.useEffect(() => {
    setAddress(props.address);
  }, [props.address])

  const handleNameChange = (event) => {
    setName(event.target.value);
  };

  const handleAddressChange = (event) => {
    setAddress(event.target.value);
  };


    return (
      <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography component="h1" variant="h5">
            {props.title}
          </Typography>
        <Box component="form" noValidate onSubmit={(event) => props.handleSubmit(event, name, address, latitude, longitude)} sx={{ mt: 3 }}>  
          <Grid container spacing={2}>
              <Grid item xs={12}>
              <TextField
                        autoFocus
                        required
                        label="Name"
                        id="name"
                        value={name}
                        onChange={handleNameChange}
                        fullWidth
                    />
              </Grid>
              <Grid item md={12} sx={{ height: 450 }} >
                <GoogleMap address={address} setAddress={setAddress} latitude={latitude} setLatitude={setLatitude} longitude={longitude} setLongitude={setLongitude}/>
              </Grid>

              <Grid item xs={12}>
                <Button type="submit"
                  variant="contained"
                  fullWidth
                  disabled={name=="" || address == ""}
                  sx={{ mt: 3, mb: 2 }}
                  >
                    Submit
                </Button>
              </Grid>
            </Grid>
        </Box>
        </Box>
        </Container>
        </ThemeProvider>
    )
}