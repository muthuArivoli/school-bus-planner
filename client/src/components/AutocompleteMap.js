import * as React from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import parse from 'autosuggest-highlight/parse';
import throttle from 'lodash/throttle';

const autocompleteService = { current: null };

export default function GoogleMaps(props) {
  const [value, setValue] = React.useState(null);
  const [inputValue, setInputValue] = React.useState('');
  const [options, setOptions] = React.useState([]);

  const fetch = React.useMemo(
    () =>
      throttle((request, callback) => {
        autocompleteService.current.getPlacePredictions(request, callback);
      }, 200),
    [],
  );

  const inputChanged = (place) => {
    if (place == null){
        props.addplace(null);
        return;
    }
    let placeRequest = {placeId: place.place_id};
    let placeService = new props.mapApi.places.PlacesService(props.map);
    placeService.getDetails(placeRequest, (placeResult, placeServiceStatus) => {
      console.log('placeService :: placeResult = ', placeResult, '\n',
        'placeServiceStatus = ', placeServiceStatus);
      
      onPlaceChanged(placeResult);
      
    });
  }

  const onPlaceChanged = (place)=>{
    if (!place.geometry) return;
    if (place.geometry.viewport) {
        props.map.fitBounds(place.geometry.viewport);
    } else {
        props.map.setCenter(place.geometry.location);
        props.map.setZoom(14);
    }

    props.addplace(place);
  }

  React.useEffect(() => {
    let active = true;

    if (!autocompleteService.current) {
      autocompleteService.current =
        new props.mapApi.places.AutocompleteService();
    }
    if (!autocompleteService.current) {
      return undefined;
    }

    if (inputValue === '') {
      setOptions(value ? [value] : []);
      return undefined;
    }

    fetch({ input: inputValue }, (results) => {
      if (active) {
        let newOptions = [];

        if (value) {
          newOptions = [value];
        }

        if (results) {
          newOptions = [...newOptions, ...results];
        }

        setOptions(newOptions);
      }
    });

    return () => {
      active = false;
    };
  }, [value, inputValue, fetch]);

  return (
    
    <Autocomplete
      id="google-map-demo"
      sx={{ width: 400, mb: 2 }}
      getOptionLabel={(option) =>
        typeof option === 'string' ? option : option.description
      }
      filterOptions={(x) => x}
      options={options}
      autoComplete
      includeInputInList
      filterSelectedOptions
      value={props.address}
      onChange={(event, newValue) => {
        setOptions(newValue ? [newValue, ...options] : options);
        inputChanged(newValue);
      }}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      renderInput={(params) => (
        <TextField {...params} label="Address" fullWidth />
      )}
      renderOption={(props, option) => {
        const matches = option.structured_formatting.main_text_matched_substrings;
        const parts = parse(
          option.structured_formatting.main_text,
          matches.map((match) => [match.offset, match.offset + match.length]),
        );

        return (
          <li {...props}>
            <Grid container alignItems="center">
              <Grid item>
                <Box
                  component={LocationOnIcon}
                  sx={{ color: 'text.secondary', mr: 2 }}
                />
              </Grid>
              <Grid item xs>
                {parts.map((part, index) => (
                  <span
                    key={index}
                    style={{
                      fontWeight: part.highlight ? 700 : 400,
                    }}
                  >
                    {part.text}
                  </span>
                ))}

                <Typography variant="body2" color="text.secondary">
                  {option.structured_formatting.secondary_text}
                </Typography>
              </Grid>
            </Grid>
          </li>
        );
      }}
    />
  );
}
