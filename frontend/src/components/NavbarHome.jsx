import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './NavbarHome.css';
import logo from '../assets/AlbumBoxdLogo.png'
import defaultProfile from '../assets/defaultprofilepicture.jpg'
import { Navigate } from 'react-router-dom';
import { useUser } from '../UserContext';


const Navbar = () => {

    const navigate = useNavigate();
    const { user, logout } = useUser();
    const [search, setSearch] = useState('');
    const [avatar, setAvatar] = useState(defaultProfile);

    // Live search states
    const [results, setResults] = useState({ albums: [], artists: [], profiles: [] });
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);

    useEffect(() => {
        if (user?.username) {
            fetch(`/api/profile/${user.username}`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.avatarUrl) {
                        setAvatar(data.avatarUrl);
                    } else {
                        setAvatar(defaultProfile);
                    }
                })
                .catch(err => {
                    console.error("Error fetching navbar avatar:", err);
                    setAvatar(defaultProfile);
                });
        } else {
            setAvatar(defaultProfile);
        }
    }, [user]);

    // Live debounced search effect
    useEffect(() => {
        const q = search.trim();
        if (q.length < 2) {
            setResults({ albums: [], artists: [], profiles: [] });
            setShowDropdown(false);
            return;
        }

        const delayDebounce = setTimeout(async () => {
            setSearchLoading(true);
            setShowDropdown(true);
            try {
                const res = await fetch(`/api/search?query=${encodeURIComponent(q)}`);
                if (res.ok) {
                    const data = await res.json();
                    setResults({
                        albums: data.albums || [],
                        artists: data.artists || [],
                        profiles: data.profiles || []
                    });
                }
            } catch (err) {
                console.error("Error fetching live search results:", err);
            } finally {
                setSearchLoading(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [search]);

    // Click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.search-container-group')) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // search submit
    const handleSubmit = (e) => {
        e.preventDefault();
        const q = search.trim();
        if (q) {
            navigate(`/search?query=${encodeURIComponent(q)}`);
            setSearch("");    //clear box after navigation
            setShowDropdown(false);
        }
    }


    return (

        <div className="navbar backdrop-blur-lg w-full px-4 fixed top-0 z-50">

            <div className="navbar-start">
                <a href="/home" className="flex items-center hover:opacity-85 transition-opacity">
                    <img src={logo} alt="logo" className="h-7 md:h-9 w-auto object-contain" />
                </a>
            </div>

            <div className="navbar-center relative search-container-group">

                {/* searchbox */}
                <form onSubmit={handleSubmit} className="w-full">

                    <label className="input bg-transparent border-[#1db95491] hover:border-[#1db954e5] h-7 w-26 md:w-80 lg:w-80 rounded-2xl">
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
                            onFocus={() => { if (search.trim().length >= 2) setShowDropdown(true); }}
                        />
                    </label>
                </form>

                {/* Live Search Floating Dropdown */}
                {showDropdown && search.trim().length >= 2 && (
                    <div className="absolute top-9 left-0 w-full mt-1 bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 text-left">
                        {searchLoading ? (
                            <div className="flex items-center justify-center p-6 gap-2 text-zinc-500 text-xs font-bold uppercase tracking-wider">
                                <span className="loading loading-spinner text-[#1db954] loading-xs"></span>
                                <span>Searching...</span>
                            </div>
                        ) : results.albums.length === 0 && results.artists.length === 0 && results.profiles.length === 0 ? (
                            <div className="p-4 text-zinc-500 text-xs italic text-center">
                                No matches found for "{search}"
                            </div>
                        ) : (
                            <div className="max-h-[320px] overflow-y-auto no-scrollbar divide-y divide-white/5">
                                {/* ALBUMS SECTION */}
                                {results.albums.length > 0 && (
                                    <div className="p-2">
                                        <div className="text-[9px] text-[#1db954] font-extrabold uppercase tracking-widest px-2 py-1">Albums</div>
                                        <div className="space-y-0.5">
                                            {results.albums.slice(0, 5).map(alb => (
                                                <div 
                                                    key={alb.id}
                                                    onClick={() => {
                                                        navigate(`/album/${alb.id}`);
                                                        setSearch("");
                                                        setShowDropdown(false);
                                                    }}
                                                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition duration-150"
                                                >
                                                    <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/5 flex-shrink-0">
                                                        {alb.cover ? (
                                                            <img src={alb.cover} alt={alb.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-[8px] text-zinc-600 font-bold">No Cover</div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-white text-xs font-bold truncate leading-snug">{alb.name}</div>
                                                        <div className="text-zinc-400 text-[10px] truncate leading-none mt-0.5">{alb.artist}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* ARTISTS SECTION */}
                                {results.artists.length > 0 && (
                                    <div className="p-2">
                                        <div className="text-[9px] text-purple-400 font-extrabold uppercase tracking-widest px-2 py-1">Artists</div>
                                        <div className="space-y-0.5">
                                            {results.artists.slice(0, 5).map(art => (
                                                <div 
                                                    key={art.id}
                                                    onClick={() => {
                                                        navigate(`/artist/${art.id}`);
                                                        setSearch("");
                                                        setShowDropdown(false);
                                                    }}
                                                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition duration-150"
                                                >
                                                    <div className="w-8 h-8 rounded-full overflow-hidden border border-white/5 flex-shrink-0">
                                                        {art.image ? (
                                                            <img src={art.image} alt={art.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-[8px] text-[#ffc107] font-bold">?</div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-white text-xs font-bold truncate leading-snug">{art.name}</div>
                                                        {art.genres.length > 0 && (
                                                            <div className="text-zinc-500 text-[9px] truncate mt-0.5 capitalize">{art.genres.slice(0, 1).join("")}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* PROFILES SECTION */}
                                {results.profiles.length > 0 && (
                                    <div className="p-2">
                                        <div className="text-[9px] text-blue-400 font-extrabold uppercase tracking-widest px-2 py-1">Profiles</div>
                                        <div className="space-y-0.5">
                                            {results.profiles.slice(0, 5).map(prof => (
                                                <div 
                                                    key={prof._id}
                                                    onClick={() => {
                                                        navigate(`/user/${prof.username}`);
                                                        setSearch("");
                                                        setShowDropdown(false);
                                                    }}
                                                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition duration-150"
                                                >
                                                    <div className="w-8 h-8 rounded-full overflow-hidden border border-white/5 flex-shrink-0">
                                                        <img 
                                                            src={prof.avatarUrl || "/src/assets/defaultprofilepicture.jpg"} 
                                                            alt={prof.username} 
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => { e.target.src = "/src/assets/defaultprofilepicture.jpg"; }}
                                                        />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-white text-xs font-bold truncate leading-snug">{prof.username}</div>
                                                        <div className="text-zinc-500 text-[9px] truncate mt-0.5 italic">{prof.bio || "No bio"}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="navbar-end">

                <div className="dropdown dropdown-end">
                    <div tabIndex={0} role="button" className="flex items-center gap-2 cursor-pointer">
                        <span className="text-white/80 hidden md:block text-sm lg:text-base">{user?.username}</span>
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                        <img src={avatar} alt="profile" className="w-8 h-8 rounded-full object-cover border border-white/10" />
                    </div>
                    <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-lg bg-white/5 backdrop-blur-md rounded-box w-52 mt-4">
                        <li><a className="text-white hover:bg-white/20" onClick={() => navigate('/profile')}>Profile</a></li>
                        <li><a className="text-white hover:bg-white/20" onClick={() => navigate('/profile')}>Your Albums</a></li>
                        <li><a className="text-white hover:bg-white/20" onClick={() => navigate('/profile')}>Settings</a></li>
                        <li><a className="text-white hover:bg-white/20" onClick={() => logout()}>Logout</a></li>
                    </ul>
                </div>

            </div>

        </div>
    );
}



export default Navbar;
