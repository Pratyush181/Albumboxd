import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import NavbarHome from './components/NavbarHome';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';
import StarRating from './components/StarRating';
import { useUser } from './UserContext';
import ReviewSection from './components/ReviewSection';

const AlbumDetail = () => {
    const { albumId } = useParams();
    const [album, setAlbum] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showTracks, setShowTracks] = useState(false);
    const [userRating, setUserRating] = useState(0)

    const { user, loading: userLoading } = useUser();
    const userId = user?._id; // This will be undefined if not logged in

    // console.log(userId);

    useEffect(() => {
            // fetch album data

        if (albumId) {
            fetchAlbumData();
        }

        //fetch user rating
        const fetchUserRating = async () => {
            const res = await fetch(`/api/ratings/${albumId}?userId=${userId}`)
            const data = await res.json();
            if (data && data.rating) setUserRating(data.rating);
        };
        if (albumId && userId) fetchUserRating();
    }, [albumId, userId]);

    const fetchAlbumData = async () => {
        try {
            setLoading(true);
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
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div>
                <NavbarHome />
                <div className="album-detail-page pt-40">
                    <p>Loading album...</p>
                </div>
            </div>
        );
    }

    // star rating
    const handleRatingChange = async (newRating) => {
        setUserRating(newRating);
        await fetch('/api/ratings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId,
                albumId,
                rating: newRating
            })
        })
        console.log('Rating changed to:', newRating);
    };    



    return (
        <div className='bg-gradient-to-b from-zinc-900 via-zinc-800 to-[#1db95410] min-h-screen'>
            <NavbarHome />
            <div className="album-detail-page pt-30 px-10 flex justify-center">
                {album ? (
                    <div>
                        <div className='w-60 md:w-120 lg:w-95 pb-4 flex justify-center mx-auto'>
                            {album.cover && <img src={album.cover} alt={album.name} />}
                        </div>
                        <h1 className='text-4xl font-bold pb-1'>{album.name}</h1>
                        <h2 className='pb-1 text-[#d4d4d4] text-lg'>{album.artist}</h2>
                        <p className='pb-1 text-[#a5a5a5]'>{album.release_date?.slice(0, 4)}</p>

                        {/* Track List Dropdown */}
                        <div className="mt-4 mb-4 flex justify-center">
                            <button
                                onClick={() => setShowTracks(!showTracks)}
                                className="flex items-center gap-2 text-[#d4d4d4] hover:text-white transition-colors"
                            >
                                <span className="font-semibold">Tracks</span>
                                {showTracks ? (
                                    <ChevronUpIcon className="w-5 h-5" />
                                ) : (
                                    <ChevronDownIcon className="w-5 h-5" />
                                )}
                            </button>
                            
                            {showTracks && (
                                <div className="mt-2 space-y-2 ">
                                    {album.tracks.map((track, index) => (
                                        <div 
                                            key={track.trackId} 
                                            className="flex items-center text-[#c6c6c6] hover:text-white transition-colors"
                                        >
                                            <span className="w-8 text-right mr-4 text-sm text-[#8c8c8c]">
                                                {index + 1}.
                                            </span>
                                            <span>{track.trackName}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                        </div>

                        <div className='mt-1 mb-10 flex flex-col items-center'>
                            <h3 className="mb-2">Rate this album</h3>
                            <StarRating
                                initialRating={userRating}
                                onRatingChange={handleRatingChange}
                            />
                        </div>

                        {/* average rating */}
                        {/* <h1>avg rating: <span>{album.averageRating}</span></h1> */}

                        <div className='flex flex-col items-center'>
                            <p className='text-white/85'>Average rating</p>
                            <div className='w-30'>
                                <StarRating
                                    initialRating={Math.round(album.averageRating * 2) / 2}
                                />
                                <p className='text-white/85'>{album.averageRating}
                                    <span className='text-white/70 text-sm justify-center'>  ({album.ratingsCount})</span>
                                </p>

                            </div>
                        </div>

                    </div>                
                ) : (
                    <p>No album found</p>
                )}
            </div>
            <ReviewSection albumId={albumId} />
        </div>
    );
}

export default AlbumDetail;