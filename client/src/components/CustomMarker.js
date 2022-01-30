import React from 'react';
import {Marker} from '@react-google-maps/api';

const CustomMarker = (props) => {
    const {id} = props;

    const onMarkerClick = (evt) => {
        alert(props.test)
    };

    return (
        <Marker
            onClick={onMarkerClick}
            {...props}
        />
    );
};

export default CustomMarker;