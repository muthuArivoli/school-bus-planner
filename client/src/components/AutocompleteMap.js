import React, { Component } from 'react';
import styled, { ThemeProvider } from 'styled-components';

const Wrapper = styled.div`
  position: relative;
  align-items: left;
  justify-content: center;
  width: 100%;
  padding: 12px;
  text-align:center;
`;


class AutoComplete extends Component {
    constructor(props) {
        super(props);
        this.clearSearchBox = this.clearSearchBox.bind(this);
    }

    componentDidMount({ map, mapApi, address } = this.props) {
        const options = {
            // restrict your search to a specific type of result
            types: ['address'],
            // restrict your search to a specific country, or an array of countries
            // componentRestrictions: { country: ['gb', 'us'] },
        };
        this.autoComplete = new mapApi.places.Autocomplete(
            this.searchInput,
            options,
        );
        this.autoComplete.addListener('place_changed', this.onPlaceChanged);
        this.autoComplete.bindTo('bounds', map);

        console.log(this.props.address);
        if(address != ""){
            this.searchInput.value = address;
            console.log(address);
            let autocompleteService = new mapApi.places.AutocompleteService();
      let request = {input: this.props.address};
      autocompleteService.getPlacePredictions(request, (predictionsArr, placesServiceStatus) => {
        console.log('getting place predictions :: predictionsArr = ', predictionsArr, '\n',
          'placesServiceStatus = ', placesServiceStatus);
          
        let placeRequest = {placeId: predictionsArr[0].place_id};
        let placeService = new mapApi.places.PlacesService(map);
        placeService.getDetails(placeRequest, (placeResult, placeServiceStatus) => {
          console.log('placeService :: placeResult = ', placeResult, '\n',
            'placeServiceStatus = ', placeServiceStatus);
          
          this._onPlaceChanged(placeResult);
          
        });
      });
        }
    }

    componentDidUpdate(prevProps){
        console.log(this.props.address);
        if(this.props.address != prevProps.address){
            this.searchInput.value = this.props.address;
            if(this.props.address != "") {
                this.autoComplete.notify('place_changed');
                let autocompleteService = new this.props.mapApi.places.AutocompleteService();
      let request = {input: this.props.address};
      autocompleteService.getPlacePredictions(request, (predictionsArr, placesServiceStatus) => {
        console.log('getting place predictions :: predictionsArr = ', predictionsArr, '\n',
          'placesServiceStatus = ', placesServiceStatus);
          
        let placeRequest = {placeId: predictionsArr[0].place_id};
        let placeService = new this.props.mapApi.places.PlacesService(this.props.map);
        placeService.getDetails(placeRequest, (placeResult, placeServiceStatus) => {
          console.log('placeService :: placeResult = ', placeResult, '\n',
            'placeServiceStatus = ', placeServiceStatus);
          
          this._onPlaceChanged(placeResult);
          
        });
      });
            }
        }
    }

    _onPlaceChanged = (place, { map, addplace } = this.props) =>{
        console.log(place);

        if (!place.geometry) return;
        if (place.geometry.viewport) {
            map.fitBounds(place.geometry.viewport);
        } else {
            map.setCenter(place.geometry.location);
            map.setZoom(14);
        }

        addplace(place);
        this.searchInput.blur();
    }

    componentWillUnmount({ mapApi } = this.props) {
        mapApi.event.clearInstanceListeners(this.searchInput);
    }

    onPlaceChanged = ({ map, addplace } = this.props) => {
        const place = this.autoComplete.getPlace();
        console.log(place);

        if (!place.geometry) return;
        if (place.geometry.viewport) {
            map.fitBounds(place.geometry.viewport);
        } else {
            map.setCenter(place.geometry.location);
            map.setZoom(14);
        }

        addplace(place);
        this.searchInput.blur();
    };

    clearSearchBox() {
        this.searchInput.value = '';
        this.props.addplace(null);
    }

    render() {
        return (
            <Wrapper>
                <input
                    size="50"
                    className="search-input"
                    ref={(ref) => {
                        this.searchInput = ref;
                    }}
                    type="text"
                    onFocus={this.clearSearchBox}
                    placeholder="Enter Address"
                />


            </Wrapper>
        );
    }
}

export default AutoComplete;