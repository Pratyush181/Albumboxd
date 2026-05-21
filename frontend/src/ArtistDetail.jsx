import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavbarHome from './components/NavbarHome';

const ArtistDetail = () => {
  const { artistId } = useParams();
  const navigate = useNavigate();

  const [artist, setArtist] = useState(null);
  const [discography, setDiscography] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtistData = async () => {
      setLoading(true);
      try {
        // Fetch Artist Profile Info
        const artistRes = await fetch(`/api/artists/${artistId}`);
        const artistData = await artistRes.json();
        if (artistRes.ok) {
          setArtist(artistData);
        } else {
          console.error("Failed to fetch artist details:", artistData);
        }

        // Fetch Artist Grouped Discography
        const discoRes = await fetch(`/api/artists/${artistId}/albums`);
        const discoData = await discoRes.json();
        if (discoRes.ok) {
          setDiscography(discoData.albums || []);
        } else {
          console.error("Failed to fetch discography:", discoData);
        }
      } catch (error) {
        console.error("Error loading artist data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (artistId) {
      fetchArtistData();
    }
  }, [artistId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-zinc-950">
        <NavbarHome />
        <div className="flex flex-col items-center gap-3">
          <span className="loading loading-ring loading-lg text-[#1db954]"></span>
          <p className="animate-pulse text-xs tracking-widest uppercase text-zinc-400 font-bold">Loading Discography...</p>
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center text-zinc-400">
        <NavbarHome />
        <p className="text-lg font-bold">Artist not found</p>
        <button onClick={() => navigate('/')} className="btn btn-sm btn-outline border-zinc-700 text-white rounded-full mt-4">
          Back Home
        </button>
      </div>
    );
  }

  // Group discography into categories
  const albumsList = discography.filter(a => a.album_group === 'album');
  const singlesList = discography.filter(a => a.album_group === 'single');
  const compilationsList = discography.filter(a => a.album_group === 'compilation');

  // Find dynamic cover image for the background blur (use artist profile image)
  const artistPhoto = artist.images?.[0]?.url || null;

  const renderDiscographyGrid = (list) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
      {list.map((alb) => (
        <div 
          key={alb.id} 
          onClick={() => navigate(`/album/${alb.id}`)}
          className="cursor-pointer group text-left"
        >
          <div className="relative overflow-hidden rounded-2xl aspect-square bg-zinc-800 border border-white/5 group-hover:border-[#1db954]/40 group-hover:scale-103 transition-all duration-300 shadow-md">
            {alb.cover ? (
              <img src={alb.cover} alt={alb.name} className="w-full h-full object-cover group-hover:opacity-75 transition-opacity duration-300" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">No Cover</div>
            )}
            
            {/* Ambient rating badge overlayed bottom-left */}
            <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10">
              <span className="text-[8px] text-zinc-400 font-extrabold uppercase tracking-wider">SCORE</span>
              <span className={`text-[10px] font-black ${alb.ratingsCount > 0 ? 'text-[#1db954]' : 'text-zinc-500'}`}>
                {alb.ratingsCount > 0 ? Math.round(alb.averageRating) : '—'}
              </span>
            </div>
          </div>
          <h3 className="text-white text-xs font-bold mt-2.5 truncate group-hover:text-[#1db954] transition-colors">
            {alb.name}
          </h3>
          <p className="text-zinc-500 text-[10px] font-bold mt-0.5">
            {alb.release_date?.slice(0, 4)}
          </p>
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-gradient-to-b from-zinc-900 via-zinc-800 to-[#1db95410] min-h-screen pb-16 relative overflow-hidden">
      {/* Absolute Dynamic Blurred Ambient Backdrop */}
      {artistPhoto && (
        <div 
          className="absolute top-0 left-0 w-full h-[600px] pointer-events-none z-0"
          style={{
            backgroundImage: `url(${artistPhoto})`,
            backgroundPosition: 'center 30%',
            backgroundSize: 'cover',
            filter: 'blur(100px) saturate(120%)',
            opacity: 0.15,
          }}
        />
      )}

      <div className="relative z-10 w-full">
        <NavbarHome />

        <div className="max-w-5xl mx-auto pt-32 px-6">
          
          {/* Circular Profile Header Grid */}
          <div className="bg-black/40 backdrop-blur-xl border border-white/15 p-6 sm:p-8 rounded-3xl shadow-2xl mb-12 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-2 border-white/10 shadow-lg flex-shrink-0">
              {artistPhoto ? (
                <img src={artistPhoto} alt={artist.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-500 font-bold uppercase text-sm">No Photo</div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <span className="text-[#1db954] text-[10px] font-extrabold tracking-widest uppercase mb-1 block">Verified Spotify Artist</span>
              <h1 className="text-white text-3xl sm:text-5xl font-black tracking-tight leading-none mb-3">
                {artist.name}
              </h1>
              
              <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
                {artist.genres.slice(0, 3).map((g) => (
                  <span key={g} className="text-[10px] text-zinc-400 font-bold bg-white/5 border border-white/5 px-2.5 py-0.5 rounded-full capitalize">
                    {g}
                  </span>
                ))}
                {artist.genres.length === 0 && (
                  <span className="text-[10px] text-zinc-500 font-semibold bg-white/5 border border-white/5 px-2.5 py-0.5 rounded-full">
                    Music Artist
                  </span>
                )}
                
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 mx-1 hidden sm:inline-block"></span>
                
                <span className="text-[10px] text-zinc-400 font-bold bg-[#1db95410] border border-[#1db95420] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <span className="text-[#1db954]">Popularity:</span> {artist.popularity}%
                </span>
              </div>
            </div>
          </div>

          {/* Organized Discography Section */}
          <div className="space-y-12">
            
            {/* Albums Group */}
            {albumsList.length > 0 && (
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight border-b border-white/5 pb-2 mb-6 text-left flex items-center gap-2">
                  <span>Albums</span>
                  <span className="text-xs text-zinc-500 font-semibold bg-white/5 px-2 py-0.5 rounded-md">{albumsList.length}</span>
                </h2>
                {renderDiscographyGrid(albumsList)}
              </div>
            )}

            {/* Singles & EPs Group */}
            {singlesList.length > 0 && (
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight border-b border-white/5 pb-2 mb-6 text-left flex items-center gap-2">
                  <span>Singles & EPs</span>
                  <span className="text-xs text-zinc-500 font-semibold bg-white/5 px-2 py-0.5 rounded-md">{singlesList.length}</span>
                </h2>
                {renderDiscographyGrid(singlesList)}
              </div>
            )}

            {/* Compilations Group */}
            {compilationsList.length > 0 && (
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight border-b border-white/5 pb-2 mb-6 text-left flex items-center gap-2">
                  <span>Compilations</span>
                  <span className="text-xs text-zinc-500 font-semibold bg-white/5 px-2 py-0.5 rounded-md">{compilationsList.length}</span>
                </h2>
                {renderDiscographyGrid(compilationsList)}
              </div>
            )}

            {/* Fallback if no discography matches */}
            {discography.length === 0 && (
              <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-10 text-center text-zinc-500 font-semibold text-sm">
                No discography found for this artist.
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
};

export default ArtistDetail;
