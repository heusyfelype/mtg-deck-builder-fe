import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './views/Login';
import Home from './views/Home';
import Collection from './views/Collection';
import DeckBuilder from './views/DeckBuilder';
import DeckEditor from './views/DeckEditor';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/home" element={<Home />} />
          <Route path="/collection" element={<Collection />} />
          <Route path="/deck-builder" element={<DeckBuilder />} />
          <Route path="/deck-editor/:deckId" element={<DeckEditor />} />
          {/* Default redirect to login for now */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
