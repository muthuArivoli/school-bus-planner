import * as React from 'react'
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import FormControl from '@mui/material/FormControl';
import Button from '@mui/material/Button';
import Input from '@mui/material/Input'
import InputLabel from '@mui/material/InputLabel'

const theme = createTheme();

export default function SchoolForm(props) {

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
        <Box component="form" noValidate onSubmit={props.handleSubmit}>
          <Grid container spacing={2}>
              <Grid item md={12}>
                <FormControl>
                  <InputLabel htmlFor="name">School Name</InputLabel>
                  <Input id="name" defaultValue={props.name || null} />
                </FormControl>
              </Grid>
              <Grid item md={12}>
                <FormControl>
                  <InputLabel htmlFor="address">School Address</InputLabel>
                  <Input id="address" defaultValue={props.address || null} />
                </FormControl>
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
    )
}