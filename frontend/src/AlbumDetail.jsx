import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavbarHome from './components/NavbarHome';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';
import { useUser } from './UserContext';
import ReviewSection from './components/ReviewSection';

const AlbumDetail = () => {
    const { albumId } = useParams();
    const navigate = useNavigate();
    const [album, setAlbum] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showTracks, setShowTracks] = useState(false);
    const [userRating, setUserRating] = useState(null);
    const [showRatingSlider, setShowRatingSlider] = useState(false);
    const [sliderValue, setSliderValue] = useState(50);
    const [isFavorited, setIsFavorited] = useState(false);
    const [favLoading, setFavLoading] = useState(false);

    const { user, loading: userLoading } = useUser();
    const userId = user?._id; // This will be undefined if not logged in

    const fetchUserRating = async () => {
        if (!albumId || !userId) return;
        try {
            const res = await fetch(`/api/ratings/${albumId}?userId=${userId}`);
            const data = await res.json();
            if (data && typeof data.rating !== 'undefined' && data.rating !== null) {
                setUserRating(data.rating);
                setSliderValue(data.rating);
            } else {
                setUserRating(null);
                setSliderValue(50);
            }
        } catch (error) {
            console.error('Error fetching user rating:', error);
        }
    };

    const fetchAlbumData = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const response = await fetch(`/api/albums/${albumId}`);
            const data = await response.json();        
            
            if (response.ok) {
                setAlbum({
                    id: data.spotifyId,
                    name: data.title,
                    artist: data.artist,
                    release_date: data.releaseDate,
                    cover: data.imageUrl,
                    tracks: data.tracks || [],
                    averageRating: data.averageRating,
                    ratingsCount: data.ratingsCount
                });
            } else{
                console.error('Failed to fetch album data:', data);
                setAlbum(null);
            }

        } catch (error) {
            console.error('Error fetching album data:', error);
            setAlbum(null);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        if (albumId) {
            fetchAlbumData();
        }
    }, [albumId]);

    useEffect(() => {
        if (albumId && userId) {
            fetchUserRating();
        } else {
            setUserRating(null);
        }
    }, [albumId, userId]);

    const fetchFavoritesStatus = async () => {
        if (!userId || !user?.username) return;
        try {
            const res = await fetch(`/api/profile/${user.username}`);
            if (res.ok) {
                const profileData = await res.json();
                const favorites = profileData.favorites || [];
                setIsFavorited(favorites.some(fav => fav.spotifyId === albumId));
            }
        } catch (error) {
            console.error('Error checking favorites status:', error);
        }
    };

    const handleToggleFavorite = async () => {
        if (!userId || !album) return;
        setFavLoading(true);
        try {
            if (isFavorited) {
                const res = await fetch('/api/profile/favorites/remove', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, spotifyId: albumId })
                });
                if (res.ok) {
                    setIsFavorited(false);
                }
            } else {
                const res = await fetch('/api/profile/favorites/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId,
                        album: {
                            spotifyId: albumId,
                            title: album.name,
                            artist: album.artist,
                            imageUrl: album.cover
                        }
                    })
                });
                const data = await res.json();
                if (res.ok) {
                    setIsFavorited(true);
                } else {
                    alert(data.error || 'Failed to pin favorite');
                }
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
        } finally {
            setFavLoading(false);
        }
    };

    useEffect(() => {
        if (albumId && userId && user?.username) {
            fetchFavoritesStatus();
        } else {
            setIsFavorited(false);
        }
    }, [albumId, userId, user]);

    if (loading) {
        return (
            <div className="bg-zinc-950 min-h-screen">
                <NavbarHome />
                <div className="album-detail-page pt-40 flex justify-center items-center text-zinc-400 font-bold">
                    <div className="flex flex-col items-center gap-3">
                        <span className="loading loading-ring loading-lg text-[#1db954]"></span>
                        <p className="animate-pulse text-xs tracking-widest uppercase">Loading album...</p>
                    </div>
                </div>
            </div>
        );
    }

    const handleSubmitRating = async () => {
        setUserRating(sliderValue);
        setShowRatingSlider(false);
        try {
            const res = await fetch('/api/ratings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    albumId,
                    rating: sliderValue
                })
            });
            if (res.ok) {
                fetchAlbumData(true);
                fetchUserRating();
            }
        } catch (error) {
            console.error('Error submitting rating:', error);
        }
    };

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

    return (
        <div className='bg-gradient-to-b from-zinc-900 via-zinc-800 to-[#1db95410] min-h-screen pb-16 relative overflow-hidden'>
            {album && album.cover && (
                <div 
                    className="absolute top-0 left-0 w-full h-[600px] pointer-events-none z-0"
                    style={{
                        backgroundImage: `url(${album.cover})`,
                        backgroundPosition: 'center',
                        backgroundSize: 'cover',
                        filter: 'blur(100px) saturate(130%)',
                        opacity: 0.18,
                    }}
                />
            )}
            <div className="relative z-10 w-full">
                <NavbarHome />
                <div className="album-detail-page pt-30 px-10 flex justify-center">
                {album ? (
                    <div className="max-w-2xl w-full text-center">
                        <div className='w-60 pb-6 flex justify-center mx-auto transform hover:scale-102 transition-transform duration-300'>
                            {album.cover && <img src={album.cover} alt={album.name} className="rounded-2xl shadow-2xl border border-white/10" />}
                        </div>
                        <h1 className='text-3xl sm:text-5xl font-black tracking-tight text-white mb-2'>{album.name}</h1>
                        <h2 
                            onClick={() => handleArtistClickByName(album.artist)}
                            className='text-[#1db954] text-xl font-bold mb-1 hover:underline cursor-pointer inline-block transition-all'
                        >
                            {album.artist}
                        </h2>
                        <p className='text-zinc-500 font-semibold mb-4'>{album.release_date?.slice(0, 4)}</p>


                        {/* Track List Dropdown */}
                        <div className="mt-2 mb-6 flex flex-col items-center">
                            <button
                                onClick={() => setShowTracks(!showTracks)}
                                className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors duration-250 font-bold text-sm bg-white/5 px-4 py-1.5 rounded-full border border-white/5"
                            >
                                <span>Tracks</span>
                                {showTracks ? (
                                    <ChevronUpIcon className="w-4 h-4" />
                                ) : (
                                    <ChevronDownIcon className="w-4 h-4" />
                                )}
                            </button>
                            
                            {showTracks && (
                                <div className="mt-3 bg-black/30 backdrop-blur-md rounded-2xl border border-white/5 p-4 w-full max-w-md text-left space-y-2">
                                    {album.tracks.map((track, index) => (
                                        <div 
                                            key={track.trackId} 
                                            className="flex items-center text-zinc-300 hover:text-white transition-colors"
                                        >
                                            <span className="w-6 text-right mr-4 text-xs text-zinc-500 font-bold">
                                                {index + 1}.
                                            </span>
                                            <span className="text-sm font-semibold">{track.trackName}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                        </div>

                        {/* 0-100 Community & User Score Panel */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-3xl max-w-md mx-auto mb-8 shadow-2xl">
                            <div className="flex flex-col items-center flex-1">
                                <span className="text-zinc-400 text-[10px] font-extrabold tracking-widest uppercase mb-2">Community Score</span>
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center border-4 ${album.ratingsCount > 0 ? 'border-[#1db954] text-[#1db954] bg-[#1db95408]' : 'border-zinc-700 text-zinc-500'} shadow-inner`}>
                                    <span className="text-3xl font-black">{album.ratingsCount > 0 ? Math.round(album.averageRating) : '—'}</span>
                                </div>
                                <span className="text-zinc-500 text-xs mt-2 font-bold">
                                    {album.ratingsCount} {album.ratingsCount === 1 ? 'rating' : 'ratings'}
                                </span>
                            </div>
                            
                            <div className="w-px h-16 bg-white/10 hidden sm:block"></div>
                            
                            <div className="flex flex-col items-center flex-1">
                                <span className="text-zinc-400 text-[10px] font-extrabold tracking-widest uppercase mb-2">Your Score</span>
                                {userId ? (
                                    <div className="flex flex-col items-center">
                                        <div className="text-2xl font-black text-white mb-2">
                                            {userRating !== null ? `${userRating}/100` : '—'}
                                        </div>
                                        <button 
                                            onClick={() => setShowRatingSlider(!showRatingSlider)} 
                                            className="btn btn-sm btn-outline border-zinc-700 hover:border-[#1db954] hover:bg-[#1db954] hover:text-black rounded-full px-5 text-xs font-bold transition-all"
                                        >
                                            {userRating !== null ? 'Change Score' : 'Rate Album'}
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => navigate('/login')} 
                                        className="btn btn-sm bg-[#1db954] text-black hover:bg-[#1db954bb] rounded-full px-5 text-xs font-bold"
                                    >
                                        Sign in to Rate
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Interactive Range Slider Popup */}
                        {showRatingSlider && userId && (
                            <div className="bg-zinc-900/90 border border-white/10 p-5 rounded-2xl max-w-sm mx-auto mb-8 shadow-2xl animate-fadeIn">
                                <h4 className="text-white text-xs font-bold text-center mb-3 tracking-wide">ADJUST SCORE (0-100)</h4>
                                
                                <div className="flex items-center gap-4 mb-4 justify-center">
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="100" 
                                        value={sliderValue} 
                                        onChange={(e) => setSliderValue(Number(e.target.value))}
                                        className="range range-success range-sm w-full bg-zinc-700 h-1.5 accent-[#1db954]"
                                    />
                                    <input 
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={sliderValue}
                                        onChange={(e) => setSliderValue(Math.max(0, Math.min(100, Number(e.target.value))))}
                                        className="w-16 bg-zinc-950 border border-zinc-800 text-white rounded-lg py-1 px-2 text-center text-sm font-black focus:outline-none focus:border-[#1db954]"
                                    />
                                </div>
                                
                                <div className="flex gap-2 justify-center">
                                    <button 
                                        onClick={() => setShowRatingSlider(false)} 
                                        className="btn btn-xs bg-zinc-800 text-white hover:bg-zinc-700 rounded-full px-4"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleSubmitRating} 
                                        className="btn btn-xs bg-[#1db954] text-black hover:bg-[#1db954bb] rounded-full px-4 font-bold"
                                    >
                                        Submit
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>                
                ) : (
                    <p>No album found</p>
                )}
            </div>
            <ReviewSection 
                albumId={albumId} 
                userRating={userRating}
                key={`${albumId}-${userRating}`}
                onReviewSubmitted={() => {
                    fetchAlbumData(true);
                    fetchUserRating();
                }}
            />
            </div>
        </div>
    );
}

export default AlbumDetail;