import React, {useState} from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Alert from '@mui/material/Alert';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Helmet } from 'react-helmet';

const theme = createTheme();

export default function SignIn() {
    let navigate = useNavigate();

    const [alert, setAlert] = useState(false);

    const handleSubmit = (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      // eslint-disable-next-line no-console
      axios.post(process.env.REACT_APP_BASE_URL+'/login', {
        email: data.get('email'),
        password: data.get('password'),
      }).then((res) => {
        if (res.data.success){
          localStorage.setItem('token', res.data.access_token);
          navigate("/");
        }
        else {
          setAlert(true);
          console.log(res.data);
        }
      }).catch((error) => {
        console.log(error.response)
        console.log(error.response.status)
        console.log(error.response.headers)
      });
    };
  
    return (
      <ThemeProvider theme={theme}>
        <Helmet>
          <title>
            Login
          </title>
        </Helmet>
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
            <img src="/HTLogo128_fixed.png" height={64} width={64}/>
            <Typography component="h1" variant="h5">
              Sign in to 
            </Typography>
            <Typography component="h1" variant="h5">
              Hypothetical Transportation
            </Typography>
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
              {
                alert &&
                <Alert severity="error">Incorrect email or password</Alert>
              }
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
              >
                Sign In
              </Button>
              <Grid container>
              <Grid item xs>
                <Link href="/forgotpassword" variant="body2">
                  Forgot password?
                </Link>
              </Grid>
              </Grid>
            </Box>
          </Box>
        </Container>
      </ThemeProvider>
    );
  }