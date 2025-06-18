import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import NavbarHome from './components/NavbarHome';


const AlbumDetail = () => {


    const { albumId } = useParams();
    const [album, setAlbum] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (albumId) {
            fetchAlbumData();
        }
    }, [albumId]);

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
                    cover: data.imageUrl
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

    return (
        <div>
            <NavbarHome />
            <div className="album-detail-page pt-40">
                {album ? (
                    <div>
                        <h1>{album.name}</h1>
                        <h2>{album.artist}</h2>
                        <p>{album.release_date?.slice(0, 4)}</p>
                        {album.cover && <img src={album.cover} alt={album.name} />}
                    </div>
                ) : (
                    <p>No album found</p>
                )}
            </div>
        </div>
    );
    
}

export default AlbumDetail;