import {useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import './NavbarHome.css';
import logo from '../assets/logo.svg'
import defaultProfile from '../assets/defaultprofilepicture.jpg'
import { Navigate } from 'react-router-dom';
import { useUser } from '../UserContext';


const Navbar = () => {

    const navigate = useNavigate();
    const { user, logout } = useUser();
    const [search, setSearch] = useState('');

    // search

    const handleSubmit = (e) => {
        e.preventDefault();
        const q = search.trim();
        if (q) {
            navigate(`/search?query=${encodeURIComponent(q)}`);
            setSearch("");    //clear box after navigation
        }
    }


    return (
    
    <div className="navbar backdrop-blur-lg w-full px-4 fixed top-0 z-50">

        <div className="navbar-start">
            <a className="btn btn-ghost text-xl">                
                <img src={logo} alt="logo" className='fill-white lg:h-8 h-5'/>
            </a>
        </div>

        <div className="navbar-center">

            {/* searchbox */}
            <form onSubmit={handleSubmit}>

                <label className="input bg-transparent border-[#1db95491] hover:border-[#1db954e5] h-7 w-26 md:w-80 [820px]:w-80 lg:w-80 rounded-2xl">
                        <svg className="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <g
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            strokeWidth="2.5"
                            fill="none"
                            stroke="currentColor"
                            >
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.3-4.3"></path>
                            </g>
                        </svg>
                        <input 
                            type="search" 
                            required placeholder="Search for albums, artists, or profiles" 
                            className="bg-transparent"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                </label>
            </form>    
        </div>

        <div className="navbar-end">

            <div className="dropdown dropdown-end">
                <div tabIndex={0} role="button" className="flex items-center gap-2 cursor-pointer">
                    <span className="text-white/80 hidden md:block text-sm lg:text-base">{user?.username}</span>
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                    <img src={defaultProfile} alt="profile" className="w-8 h-8 rounded-full" />
                </div>
                <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-lg bg-white/5 backdrop-blur-md rounded-box w-52 mt-4">
                    <li><a className="text-white hover:bg-white/20">Profile</a></li>
                    <li><a className="text-white hover:bg-white/20">Your Albums</a></li>
                    <li><a className="text-white hover:bg-white/20">Settings</a></li>
                    <li><a className="text-white hover:bg-white/20" onClick={() => logout()}>Logout</a></li>
                </ul>
            </div>
            
        </div>

    </div>
    );
}



export default Navbar;
