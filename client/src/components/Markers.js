import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const Wrapper = styled.div`
    position: absolute;
    width: 38px;
    height: 37px;
    background-image: url(https://icon-library.com/images/pin-icon-png/pin-icon-png-9.jpg);
    background-size: contain;
    background-repeat: no-repeat;
    transform: translate(-50%,-50%);
    cursor: grab;
`;

const markerStyle = {
    position: "absolute",
    top: "100%",
    left: "50%",
    width: "25px",
    height: "25px",
    transform: "translate(-50%, -100%)"
  };
  

const Marker = ({ text, onClick }) => (
    <Wrapper
        alt={text}
        onClick={onClick}
    />
);

Marker.defaultProps = {
    onClick: null,
};

Marker.propTypes = {
    onClick: PropTypes.func,
    text: PropTypes.string.isRequired,
};

export default Marker;