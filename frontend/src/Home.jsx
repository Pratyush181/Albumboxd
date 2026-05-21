import React, { useState, useEffect } from 'react';
import './Home.css';
import Navbar from './components/NavbarHome';
import { useUser } from './UserContext';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const { user } = useUser();
    const navigate = useNavigate();

    const [yourAlbums, setYourAlbums] = useState([]);
    const [loadingYour, setLoadingYour] = useState(true);
    const [errorYour, setErrorYour] = useState(false);

    const [popularAlbums, setPopularAlbums] = useState([]);
    const [loadingPopular, setLoadingPopular] = useState(true);
    const [errorPopular, setErrorPopular] = useState(false);

    const [followingActivity, setFollowingActivity] = useState([]);
    const [loadingActivity, setLoadingActivity] = useState(false);
    const [errorActivity, setErrorActivity] = useState(false);

    useEffect(() => {
        // Fetch popular albums
        fetch('/api/albums/popular')
            .then(res => {
                if (!res.ok) throw new Error();
                return res.json();
            })
            .then(data => {
                setPopularAlbums(data.albums || []);
                setErrorPopular(false);
            })
            .catch(() => setErrorPopular(true))
            .finally(() => setLoadingPopular(false));
    }, []);

    useEffect(() => {
        if (user?.username) {
            setLoadingYour(true);
            fetch(`/api/profile/${user.username}/diary`)
                .then(res => {
                    if (!res.ok) throw new Error();
                    return res.json();
                })
                .then(data => {
                    // Map from hydrated diary format to renderAlbumList expected format
                    const mapped = data.map(item => ({
                        id: item.spotifyId,
                        name: item.title,
                        artist: item.artist,
                        cover: item.imageUrl,
                        averageRating: item.rating
                    }));
                    setYourAlbums(mapped);
                    setErrorYour(false);
                })
                .catch(() => setErrorYour(true))
                .finally(() => setLoadingYour(false));
        } else {
            setYourAlbums([]);
            setLoadingYour(false);
            setErrorYour(false);
        }
    }, [user?.username]);

    useEffect(() => {
        if (user?._id) {
            setLoadingActivity(true);
            fetch(`/api/profile/social/following-activity?userId=${user._id}`)
                .then(res => {
                    if (!res.ok) throw new Error();
                    return res.json();
                })
                .then(data => {
                    setFollowingActivity(data || []);
                    setErrorActivity(false);
                })
                .catch(() => setErrorActivity(true))
                .finally(() => setLoadingActivity(false));
        } else {
            setFollowingActivity([]);
            setLoadingActivity(false);
            setErrorActivity(false);
        }
    }, [user?._id]);

    const renderSkeletons = () => (
        <div className="flex gap-6 overflow-x-auto py-2 no-scrollbar">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-36 sm:w-40 h-56 bg-white/5 animate-pulse rounded-xl border border-white/5"></div>
            ))}
        </div>
    );

    const handleArtistClickByName = async (artistName) => {
        if (!artistName) return;
        const primaryArtist = artistName.split(',')[0].trim();
        try {
            const res = await fetch(`/api/artists/search-by-name?name=${encodeURIComponent(primaryArtist)}`);
            const data = await res.json();
            if (res.ok && data.id) {
                navigate(`/artist/${data.id}`);
            } else {
                navigate(`/search?query=${encodeURIComponent(primaryArtist)}`);
            }
        } catch (error) {
            console.error("Error looking up artist:", error);
            navigate(`/search?query=${encodeURIComponent(primaryArtist)}`);
        }
    };

    const renderAlbumList = (albums, onAlbumClick) => (
        <div className="flex gap-6 overflow-x-auto py-2 no-scrollbar scroll-smooth">
            {albums.map((alb) => (
                <div 
                    key={alb.id} 
                    onClick={() => onAlbumClick(alb.id)}
                    className="flex-shrink-0 w-36 sm:w-40 cursor-pointer group transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
                >
                    <div className="relative overflow-hidden rounded-xl shadow-lg aspect-square bg-zinc-800/80 border border-white/10 group-hover:border-[#1db954]/50 transition-colors">
                        {alb.cover ? (
                            <img 
                                src={alb.cover} 
                                alt={alb.name} 
                                className="w-full h-full object-cover group-hover:opacity-75 transition-opacity duration-300"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs">No Cover</div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <span className="text-white text-xs font-semibold bg-[#1db954]/90 px-3 py-1 rounded-full shadow-md">
                                View Details
                            </span>
                        </div>
                    </div>
                    <h3 className="text-white text-xs font-bold mt-3 text-left truncate group-hover:text-[#1db954] transition-colors duration-200">
                        {alb.name}
                    </h3>
                    <div className="flex items-center justify-between mt-0.5 gap-2">
                        <p 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleArtistClickByName(alb.artist);
                            }}
                            className="text-zinc-400 text-[10px] sm:text-[11px] text-left truncate flex-1 hover:text-[#1db954] hover:underline"
                        >
                            {alb.artist}
                        </p>
                        {alb.averageRating > 0 && (
                            <span className="text-[10px] font-black text-[#1db954] bg-[#1db95415] border border-[#1db95430] px-1.5 py-0.25 rounded flex-shrink-0">
                                {Math.round(alb.averageRating)}
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );

    const handleAlbumClick = (albumId) => {
        navigate(`/album/${albumId}`);
    };


    return (
        <>
        <div className='home-page pb-12'>
          <div className="home-content">
            <Navbar />

            {/* user info */}
            {user ? (
              <div style={{
                  padding: '120px 2rem 20px',
                  color: 'white',
                  textAlign: 'left',
                  maxWidth: '1200px',
                  margin: '0 auto'
                }}>
                  <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">Welcome back, {user?.username}!</h1>
                  <p className="text-zinc-400 mt-1 text-sm sm:text-base">Explore popular albums and manage your musical diary today.</p>
                </div>
            ) : (
              <div style={{
                padding: '120px 2rem 20px',
                color: 'white',
                textAlign: 'left',
                maxWidth: '1200px',
                margin: '0 auto'
              }}>
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">Discover your next favorite album</h1>
                <p className="text-zinc-400 mt-1 text-sm sm:text-base">Sign in to rate, review, and track albums you love.</p>
                <div className='mt-4 flex gap-3'>
                    <button onClick={() => navigate('/signup')} className="btn btn-soft bg-[#212121] hover:bg-zinc-800 text-white rounded-full px-6 h-10 border border-white/10 text-xs sm:text-sm font-semibold">Sign Up</button>
                    <button onClick={() => navigate('/login')} className="btn btn-soft bg-[#1db954] hover:bg-[#1db954bb] text-black rounded-full px-6 h-10 text-xs sm:text-sm font-semibold">Login</button>
                </div>
              </div>
            )}

            {/* content display */}
            <div className="max-w-[1200px] mx-auto mt-6">
                {/* popular on albumboxd */}
                <div className='popular-on-albumboxd px-6 py-4'>
                    <h2 className="text-xs sm:text-sm text-zinc-400 font-extrabold tracking-widest mb-3 text-left">POPULAR ON ALBUMBOXD</h2>
                    <div className="w-full p-4 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl min-h-[220px]">
                        {loadingPopular ? (
                            renderSkeletons()
                        ) : errorPopular ? (
                            <div className="flex flex-col items-center justify-center h-48 text-zinc-500 text-sm">
                                <p>Failed to load popular albums from database.</p>
                            </div>
                        ) : popularAlbums.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-zinc-500 text-sm">
                                <p>No popular albums rated yet.</p>
                            </div>
                        ) : (
                            renderAlbumList(popularAlbums, handleAlbumClick)
                        )}
                    </div>
                </div>

                {/* your albums */}
                <div className='your-albums px-6 py-4'>
                    <h2 className="text-xs sm:text-sm text-zinc-400 font-extrabold tracking-widest mb-3 text-left">YOUR ALBUMS</h2>
                    <div className="w-full p-4 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl min-h-[220px]">
                        {loadingYour ? (
                            renderSkeletons()
                        ) : errorYour ? (
                            <div className="flex flex-col items-center justify-center h-48 text-zinc-500 text-sm">
                                <p>Failed to load your albums.</p>
                            </div>
                        ) : !user ? (
                            <div className="flex flex-col items-center justify-center h-48 text-center py-6 px-4">
                                <p className="text-zinc-300 font-semibold">Sign in to view your albums</p>
                                <p className="text-zinc-500 text-xs mt-1 max-w-md">Track, score, and review albums you've listened to. Your rated and reviewed albums will be beautifully showcased here.</p>
                                <div className="flex gap-3 mt-4">
                                    <button onClick={() => navigate('/login')} className="btn btn-sm btn-soft bg-[#1db954] hover:bg-[#1db954bb] text-black rounded-full px-5 font-bold">Login</button>
                                    <button onClick={() => navigate('/signup')} className="btn btn-sm btn-soft bg-[#212121] hover:bg-zinc-800 text-white rounded-full px-5 border border-white/10 font-bold">Sign Up</button>
                                </div>
                            </div>
                        ) : yourAlbums.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-zinc-500 text-sm text-center">
                                <p>You haven't rated or reviewed any albums yet.</p>
                                <p className="text-zinc-400 mt-1">Search for an album to leave your first score!</p>
                            </div>
                        ) : (
                            renderAlbumList(yourAlbums, handleAlbumClick)
                        )}
                    </div>
                </div>

                {/* following activity feed */}
                {user && (
                    <div className='following-activity px-6 py-4 mt-6'>
                        <h2 className="text-xs sm:text-sm text-zinc-400 font-extrabold tracking-widest mb-3 text-left">FOLLOWING ACTIVITY FEED</h2>
                        <div className="w-full p-6 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl min-h-[150px]">
                            {loadingActivity ? (
                                <div className="flex justify-center py-10">
                                    <span className="loading loading-spinner text-[#1db954] loading-md"></span>
                                </div>
                            ) : errorActivity ? (
                                <div className="flex flex-col items-center justify-center py-10 text-zinc-500 text-sm">
                                    <p>Failed to load activity feed.</p>
                                </div>
                            ) : followingActivity.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 text-center px-4 max-w-lg mx-auto">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-10 h-10 text-zinc-600 mb-3 animate-bounce">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                                    </svg>
                                    <p className="text-zinc-300 font-semibold text-sm">Your activity feed is empty</p>
                                    <p className="text-zinc-500 text-xs mt-1 leading-relaxed">
                                        You aren't following anyone yet, or they haven't posted any ratings or reviews yet. Search for friends to see their ratings here!
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4 max-w-3xl mx-auto text-left">
                                    {followingActivity.map((activity, idx) => {
                                        const hasRating = typeof activity.rating === 'number' && activity.rating !== null;
                                        const hasReview = activity.review && activity.review.trim() !== '';
                                        const author = activity.userId;
                                        const defaultAvatar = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' fill='%2327272a'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2371717a' font-size='30' font-family='sans-serif'>?</text></svg>";
                                        
                                        return (
                                            <div 
                                                key={`${activity.userId?._id || idx}_${activity.albumId}`}
                                                className="bg-zinc-900/40 border border-white/5 rounded-2xl p-5 hover:border-white/10 hover:bg-zinc-900/60 transition duration-200 flex gap-4 sm:gap-5 items-start"
                                            >
                                                {/* User avatar */}
                                                <img 
                                                    src={author?.avatarUrl || defaultAvatar} 
                                                    alt={author?.username} 
                                                    onClick={() => navigate(`/user/${author?.username}`)}
                                                    className="w-10 h-10 rounded-full border border-white/10 cursor-pointer object-cover shadow-md hover:scale-105 active:scale-95 transition flex-shrink-0"
                                                />
                                                
                                                {/* Details */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                                        <span 
                                                            onClick={() => navigate(`/user/${author?.username}`)}
                                                            className="font-bold text-white text-sm hover:text-[#1db954] hover:underline cursor-pointer transition-colors"
                                                        >
                                                            {author?.username}
                                                        </span>
                                                        <span className="text-zinc-500 text-xs">rated</span>
                                                        <span 
                                                            onClick={() => navigate(`/album/${activity.albumId}`)}
                                                            className="font-bold text-zinc-300 hover:text-white hover:underline cursor-pointer text-sm truncate"
                                                        >
                                                            {activity.title}
                                                        </span>
                                                        <span className="text-zinc-500 text-xs">by</span>
                                                        <span className="text-zinc-400 text-xs italic truncate">{activity.artist}</span>
                                                    </div>

                                                    {/* Review bubble */}
                                                    {hasReview ? (
                                                        <p className="text-zinc-300 text-xs leading-relaxed bg-black/20 p-3 rounded-xl border border-white/5 italic whitespace-pre-wrap break-words mb-3">
                                                            "{activity.review}"
                                                        </p>
                                                    ) : null}

                                                    {/* Badges footer */}
                                                    <div className="flex items-center gap-3">
                                                        {hasRating && (
                                                            <span className="text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full border text-[#1db954] bg-[#1db95408] border-[#1db95420]">
                                                                SCORE: {activity.rating}
                                                            </span>
                                                        )}
                                                        <span className="text-[9px] text-zinc-500 font-extrabold uppercase ml-auto">
                                                            {new Date(activity.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Right clickable mini-cover card */}
                                                <div 
                                                    onClick={() => navigate(`/album/${activity.albumId}`)}
                                                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden border border-white/5 cursor-pointer shadow-md hover:scale-105 active:scale-95 transition duration-200 flex-shrink-0"
                                                >
                                                    {activity.imageUrl ? (
                                                        <img src={activity.imageUrl} alt={activity.title} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-[8px] text-zinc-600 font-bold">No Cover</div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
          </div>
        </div>
        </>
    );
}

export default Home;