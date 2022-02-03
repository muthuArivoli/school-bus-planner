import React, { Component } from 'react';

import GoogleMapReact from 'google-map-react';

import styled from 'styled-components';

import AutoComplete from './AutocompleteMap';
import Marker from './Markers';



const Wrapper = styled.main`
  width: 400px;
  height: 400px;
`;

class GoogleMap extends Component {


    state = {
        mapApiLoaded: false,
        mapInstance: null,
        mapApi: null,
        geoCoder: null,
        places: [],
        center: [],
        zoom: 9,
        address: '',
        lat: null,
        lng: null
    };

    componentWillMount() {
        this.setCurrentLocation();
    }


    onMarkerInteraction = ( mouse) => {
        this.setState({
            lat: mouse.lat,
            lng: mouse.lng
        });
    }
    onMarkerInteractionMouseUp = () => {
        this._generateAddress();
    }

    _onChange = ({ center, zoom }) => {
        this.setState({
            center: center,
            zoom: zoom,
        });

    }

    apiHasLoaded = (map, maps) => {
        this.setState({
            mapApiLoaded: true,
            mapInstance: map,
            mapApi: maps,
        });

        //this._generateAddress();
    };

    addPlace = (place) => {
        if (place == null){
            this.setState({
                place: [],
                lat: null,
                lng: null,
                address: ""
            });
            this.props.setAddress("");
            return;
        }

        this.setState({
            places: [place],
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
        });
        this._generateAddress()
    };

    _generateAddress() {
        const {
            mapApi
        } = this.state;

        const geocoder = new mapApi.Geocoder;

        geocoder.geocode({ 'location': { lat: this.state.lat, lng: this.state.lng } }, (results, status) => {
            console.log(results);
            console.log(status);
            if (status === 'OK') {
                if (results[0]) {
                    this.zoom = 12;
                    this.setState({ address: results[0].formatted_address });
                    this.props.setAddress(results[0].formatted_address);
                } else {
                    window.alert('No results found');
                    this.props.setAddress("");
                }
            } else {
                window.alert('Geocoder failed due to: ' + status);
            }

        });
    }

    // Get Current Location Coordinates
    setCurrentLocation() {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                this.setState({
                    center: [position.coords.latitude, position.coords.longitude],
                });
            });
        }
    }

    render() {
        const {
           mapApiLoaded, mapInstance, mapApi,
        } = this.state;


        return (
            <Wrapper>
                {mapApiLoaded && (
                    <div>
                        <AutoComplete map={mapInstance} mapApi={mapApi} addplace={this.addPlace} address={this.props.address}/>
                    </div>
                )}
                <GoogleMapReact
                    center={this.state.center}
                    zoom={this.state.zoom}
                    onChange={this._onChange}
                    onChildMouseDown={this.onMarkerInteraction}
                    onChildMouseUp={this.onMarkerInteractionMouseUp}
                    onChildMouseMove={this.onMarkerInteraction}
                    bootstrapURLKeys={{
                        key: 'AIzaSyB0b7GWpLob05JP7aVeAt9iMjY0FjDv0_o',
                        libraries: ['places', 'geometry'],
                    }}
                    yesIWantToUseGoogleMapApiInternals
                    onGoogleApiLoaded={({ map, maps }) => this.apiHasLoaded(map, maps)}
                >

                    <Marker
                        text={this.state.address}
                        lat={this.state.lat}
                        lng={this.state.lng}
                    />


                </GoogleMapReact>


            </Wrapper >
        );
    }
}

export default GoogleMap;
