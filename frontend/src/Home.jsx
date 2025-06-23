import React, { useState, useEffect } from 'react';
import './Home.css';
import Navbar from './components/NavbarHome';
import { useUser } from './UserContext';
import { Navigate, useNavigate } from 'react-router-dom';

const Home = () => {
    const { user, logout } = useUser();

    const navigate = useNavigate();


    return (
        <>
        <div className='home-page'>
          <div className="home-content">
            <Navbar />

            {/* user info */}

            {user ? (
              <div style={{
                  padding: '100px',
                  color: 'white',
                }}>
                  <h2>User Information</h2>
                  <p><strong>Username:</strong> {user?.username}</p>
                  <p><strong>Email:</strong> {user?.email}</p>
                </div>
            ) : (
              <div style={{
                padding: '100px',
                color: 'white',
              }}>
                <p>Please sign in</p>
                <div className='mt-4'>
                    <button onClick={() => navigate('/signup')} className="btn btn-soft bg-[#212121] hover:bg-[#1db954bb] mx-2 h-8">Sign Up</button>
                    <button onClick={() => navigate('/login')} className="btn btn-soft bg-[#1db954] hover:bg-[#1db954bb] mx-2 h-8">Login</button>
                </div>
              </div>
              
            )}

            {/* content display */}

            {/* new releases */}
            <div className='new-releases'>
              <div className="px-8 py-4">
                  <h2 className="text-sm text-white mb-1 ml-2 text-left">NEW RELEASES</h2>
                  <div className="w-full h-64 bg-black/8 backdrop-blur-md rounded-xl border border-white/20">
                      {/* Content will go here */}
                  </div>
              </div>
            </div>

            <div className='popular-on-albumboxd'>
              <div className="px-8 py-4">
                  <h2 className="text-sm text-white mb-1 ml-2 text-left">POPULAR ALBUMBOXD</h2>
                  <div className="w-full h-64 bg-black/8 backdrop-blur-md rounded-xl border border-white/20">
                      {/* Content will go here */}
                  </div>
              </div>
            </div>
          </div>
        </div>



        </>

    );

}




export default Home;