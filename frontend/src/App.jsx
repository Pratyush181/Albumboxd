import './App.css'
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './UserContext.jsx';
import SignUp from './SignUp.jsx';
import Login from './Login.jsx';
import Home from './Home.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import SearchResults from './SearchResults.jsx';
import AlbumDetail from './AlbumDetail.jsx';
import ArtistDetail from './ArtistDetail.jsx';
import UserProfile from './UserProfile.jsx';



function App() {
  return (
    <UserProvider>
    <Router>
      <div>
        <Routes>
          {/* Protected homepage */}
          <Route 
            path="/" 
            element={
                <Home />
            } 
          />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/search" element={<SearchResults />} />
          
          {/* Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          
          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />

          {/* Album detail route */}
          <Route 
            path="/album/:albumId" 
            element={
                <AlbumDetail />
            }
          />

          {/* Artist detail route */}
          <Route 
            path="/artist/:artistId" 
            element={
                <ArtistDetail />
            }
          />

          {/* Profile & User routes */}
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/user/:username" element={<UserProfile />} />

        </Routes>
      </div>
    </Router>
  </UserProvider>

  );
}

export default App;
