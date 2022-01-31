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

const theme = createTheme();

export default function SchoolForm(props) {

  const [name, setName] = React.useState(props.name || "");
  const [address, setAddress] = React.useState(props.address || "");

  React.useEffect(() => {
    setName(props.name);
  }, [props.name])

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
        <Box component="form" noValidate onSubmit={(event) => props.handleSubmit(event, name, address)}>
          <Grid container spacing={2}>
              <Grid item md={12}>
                <FormControl>
                  <InputLabel htmlFor="name">School Name</InputLabel>
                  <Input id="name" label="name" value={name} onChange={handleNameChange} />
                </FormControl>
              </Grid>
              <Grid item md={12}>
                <FormControl>
                  <InputLabel htmlFor="address">School Address</InputLabel>
                  <Input id="address" label="address" value={address} onChange={handleAddressChange} />
                </FormControl>
              </Grid>

              <Grid item sm={12}>
                <Button type="submit"
                  variant="contained"
                  disabled={name=="" || address == ""}
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