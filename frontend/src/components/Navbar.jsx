import {useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';
import logo from '../assets/logo.svg'
import { Navigate } from 'react-router-dom';


const Navbar = () => {

    const navigate = useNavigate();

    return (
    <div className="navbar bg-[#212121] shadow-lg w-full px-4">
        <div className="navbar-start">
            <div className="dropdown">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /> </svg>
            </div>
            <ul
                tabIndex={0}
                className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow">
                <li><a>Signup</a></li>
                <li><a>Login</a></li>
                <li><a>About</a></li>
            </ul>
            </div>
        </div>
        <div className="navbar-center">
            <a className="btn btn-ghost text-xl">                
                <img src={logo} alt="logo" className='fill-white h-8'/>
            </a>
        </div>
        <div className="navbar-end">
            <button onClick={() => navigate('/signup')} className="btn btn-soft bg-[#1db954] hover:bg-[#1db954bb] mx-2 h-8">Sign Up</button>
            <button onClick={() => navigate('/login')} className="btn btn-soft bg-[#1db954] hover:bg-[#1db954bb] mx-2 h-8">Login</button>
        </div>
    </div>
    );
}



export default Navbar;
