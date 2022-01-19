import './App.css';
import React, {useState} from 'react';
import { BrowserRouter, Routes, Route} from 'react-router-dom';
import Login from './Login'

export default class App extends React.Component {


  render() {
    return (
      <BrowserRouter>
        <Routes>
          <Route exact path="/login" element={<Login/>} />
          <Route exact path="/signup" element={<Login/>} />
          <Route exact path="/createaccount" element={<Login/>} />
        </Routes>
      </BrowserRouter>
    );
  }

}
