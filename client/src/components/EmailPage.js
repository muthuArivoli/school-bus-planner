import * as React from 'react'
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Button from '@mui/material/Button';
import Input from '@mui/material/Input';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Autocomplete from '@mui/material/Autocomplete';
import FormLabel from '@mui/material/FormLabel';
import axios from 'axios';

const theme = createTheme();

export default function EmailPage(props) {

    const [optionType, setOptionType] = React.useState("general");
    const [userType, setUserType] = React.useState("system");
    const [targetOptions, setTargetOptions] = React.useState([]);
    const [subject, setSubject] = React.useState("");
    const [body, setBody] = React.useState("");
    const [optionSelect, setOptionSelect] = React.useState(null);

    let [query, setQuery] = useSearchParams();
    let navigate = useNavigate();

    const fetchOptionsData=async()=>{
        console.log(userType);
        if(userType == "system"){
            setOptionSelect(null)
            setTargetOptions([]);
        }
        else if(userType == "school"){
            setOptionSelect(null)
            const result = await axios.get(
                process.env.REACT_APP_BASE_URL+'/school', {
                  headers: {
                      Authorization: `Bearer ${localStorage.getItem('token')}`
                  }
                }
              );
              if (result.data.success){
                console.log(result.data.schools);
                let arr = result.data.schools.map((value) => {
                  console.log({label: value.name, id: value.id});
                  return {label: value.name, id: value.id};
                });
                setTargetOptions(arr);
              }
              else{
                props.setSnackbarMsg(`Users could not be loaded`);
                props.setShowSnackbar(true);
                props.setSnackbarSeverity("error");
                navigate("/");
              }
        }
        else if(userType == "route"){
            setOptionSelect(null)
            const result = await axios.get(
                process.env.REACT_APP_BASE_URL+'/route', {
                  headers: {
                      Authorization: `Bearer ${localStorage.getItem('token')}`
                  }
                }
              );
              if (result.data.success){
                console.log(result.data.routes);
                let arr = result.data.routes.map((value) => {
                  console.log({label: value.name, id: value.id});
                  return {label: value.name, id: value.id};
                });
                setTargetOptions(arr);
              }
              else{
                props.setSnackbarMsg(`Users could not be loaded`);
                props.setShowSnackbar(true);
                props.setSnackbarSeverity("error");
                navigate("/");
              }
        }
    }

    React.useEffect(()=>{
    const updateData = async()=>{
      if(query.get("route") != null && query.get("route").match('^[0-9]+$')){
            setUserType("route");
            const result = await axios.get(
                process.env.REACT_APP_BASE_URL+'/route/' + query.get("route"), {
                  headers: {
                      Authorization: `Bearer ${localStorage.getItem('token')}`
                  }
                }
              );
              if (result.data.success){
                console.log(result.data.route);
                setOptionSelect({id: result.data.route.id, label: result.data.route.name});
              }
              else{
                props.setSnackbarMsg(`Route could not be loaded`);
                props.setShowSnackbar(true);
                props.setSnackbarSeverity("error");
                navigate("/");
              }

      }
      if(query.get("school") != null && query.get("school").match('^[0-9]+$')){
        setUserType("school");
        const result = await axios.get(
            process.env.REACT_APP_BASE_URL+'/school/' + query.get("school"), {
              headers: {
                  Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
          if (result.data.success){
            console.log(result.data.school);
            setOptionSelect({id: result.data.school.id, label: result.data.school.name});
          }
          else{
            props.setSnackbarMsg(`Schools could not be loaded`);
            props.setShowSnackbar(true);
            props.setSnackbarSeverity("error");
            navigate("/");
          }
        }
    }
    updateData();
    }, []);

    const handleSubmit=(event)=>{
        event.preventDefault();
        console.log({
            optionType: optionType,
            userType: userType,
            optionSelect: optionSelect,
            subject: subject,
            body: body,
        });
        if(userType == 'system') {
            axios.post(process.env.REACT_APP_BASE_URL+"/email/system", {
                email_type: optionType,
                subject: subject,
                body: body,
              }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
              }).then((res) => {
                if(res.data.success){
                    props.setSnackbarMsg(`Email successfully sent`);
                    props.setShowSnackbar(true);
                    props.setSnackbarSeverity("success");
                    navigate("/");
                }
                else{
                    props.setSnackbarMsg(`Email not successfully sent`);
                    props.setShowSnackbar(true);
                    props.setSnackbarSeverity("error");
                    navigate("/");
                }
              });
        }
        else{
            axios.post(process.env.REACT_APP_BASE_URL+`/email/${userType}/${optionSelect.id}`, {
                email_type: optionType,
                subject: subject,
                body: body,
              }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
              }).then((res) => {
                if(res.data.success){
                    props.setSnackbarMsg(`Email successfully sent`);
                    props.setShowSnackbar(true);
                    props.setSnackbarSeverity("success");
                    navigate("/");
                }
                else{
                    props.setSnackbarMsg(`Email not successfully sent`);
                    props.setShowSnackbar(true);
                    props.setSnackbarSeverity("error");
                    navigate("/");
                }
              });
        }
    }

    React.useEffect(()=>{
        fetchOptionsData();
    }, [userType])


    return (
        <ThemeProvider theme={theme}>
        <Container component="main" maxWidth="sm">
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
            Send Email
          </Typography>
          <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <Grid container spacing={2} alignItems="center" justifyContent="center">
              <Grid item sm={12}>
              <FormControl>
                <FormLabel id="radio-button-annoucement">Announcement Type</FormLabel>
                <RadioGroup
                    row
                    aria-labelledby="radio-button-announcement"
                    name="radio-buttons-announcemnt"
                    value={optionType}
                    onChange={(e)=>setOptionType(e.target.value)}
                >
                    <FormControlLabel value="general" control={<Radio />} label="General Announcement" />
                    <FormControlLabel value="route" control={<Radio />} label="Route Announcement" />
                </RadioGroup>
                </FormControl>

              </Grid>
              <Grid item sm={6}>
              <FormControl>
                <FormLabel id="radio-button-user">Target Users</FormLabel>
                <RadioGroup
                    aria-labelledby="radio-button-user"
                    name="radio-buttons-user"
                    value={userType}
                    onChange={(e)=>setUserType(e.target.value)}
                >
                    <FormControlLabel value="system" control={<Radio />} label="All Users within system" />
                    <FormControlLabel value="school" control={<Radio />} label="All Users with students from same School" />
                    <FormControlLabel value="route" control={<Radio />} label="All Users with students from same Route" />
                </RadioGroup>
                </FormControl>

              </Grid>
              <Grid item sm={6}>
                {
                    userType != "system" &&
              <Autocomplete
                            fullWidth
                            options={targetOptions}
                            disabled={targetOptions.length == 0}
                            id="option-select"
                            autoSelect
                            value={optionSelect}
                            onChange={(e, new_value) => setOptionSelect(new_value)}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            renderInput={(params) => <TextField {...params} label={userType == "system" ? "" :
                                                                                    userType == "school" ? "School Name" : "Route Name" } />}
                        />
                }
                
            </Grid>

              <Grid item sm={12}>
              <TextField
                        required
                        label="Subject"
                        id="subject"
                        value={subject}
                        onChange={(e)=>setSubject(e.target.value)}
                        fullWidth
                    />
              </Grid>

              <Grid item sm={12}>
              <TextField
                        required
                        label="Body"
                        id="body"
                        multiline
                        rows={5}
                        value={body}
                        onChange={(e)=>setBody(e.target.value)}
                        fullWidth
                    />
              </Grid>
            </Grid>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={subject=="" || body == "" || optionType == "" || userType == "" || (optionSelect == null && userType != "system")}
              sx={{ mt: 3, mb: 2 }}
            >
              Send Email
            </Button>
            
        </Box>

        </Box>
        </Container>
        </ThemeProvider>
    )
}