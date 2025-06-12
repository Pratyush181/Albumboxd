
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignUp.css';
import logo from './assets/logo.svg'


function SignUp() {
    return (
        <>
        <div className='signup-container flex h-screen'>

          <div className='signup-form w-1/2 bg-blue-500 flex items-center justify-center'>
              <img src="../assets/logo.svg" alt="logo" />
          </div>

          <div className='signup-showcase w-1/2 bg-green-500 flex items-center justify-center'>
              <p text-white text-xl>right side</p>
          </div>

        </div>

        </>
    );
}    

export default SignUp;