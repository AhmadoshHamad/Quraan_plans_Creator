import React from 'react'
import { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PlansCreator from './pages/PlansCreatorPage.jsx';


const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PlansCreator />} />
      </Routes>
    </Router>
  );
};

export default App