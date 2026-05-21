import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import NavbarHome from "./components/NavbarHome";
import "./SearchResults.css"; 

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("query") || "";
  const [albums, setAlbums] = useState([]);
  const [artists, setArtists] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [activeTab, setActiveTab] = useState("albums"); // "albums", "artists", or "profiles"
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    if (!query) return;

    setLoading(true);
    fetch(`/api/search?query=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((d) => {
        setAlbums(d.albums || []);
        setArtists(d.artists || []);
        setProfiles(d.profiles || []);
        // Auto-switch tab if albums is empty but artists or profiles has hits
        if (d.albums?.length === 0 && d.artists?.length > 0) {
          setActiveTab("artists");
        } else if (d.albums?.length === 0 && d.artists?.length === 0 && d.profiles?.length > 0) {
          setActiveTab("profiles");
        } else {
          setActiveTab("albums");
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [query]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-zinc-950">
        <NavbarHome />
        <div className="flex flex-col items-center gap-3">
          <span className="loading loading-ring loading-lg text-[#1db954]"></span>
          <p className="animate-pulse text-xs tracking-widest uppercase text-zinc-400 font-bold">Searching Albumboxd...</p>
        </div>
      </div>
    );
  }

  if (!albums.length && !artists.length && !profiles.length) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center text-zinc-400">
        <NavbarHome />
        <p className="text-lg font-bold">No results found for "{query}"</p>
        <p className="text-xs text-zinc-500 mt-1">Try checking for spelling or search another keyword.</p>
      </div>
    );
  }

  const handleAlbumClick = (albumId) => {
    navigate(`/album/${albumId}`);
  };

  const handleArtistClick = (artistId) => {
    navigate(`/artist/${artistId}`);
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
    <div className="search-info bg-gradient-to-b from-zinc-900 via-zinc-800 to-[#1db95410] min-h-screen pb-16">
      <NavbarHome />
      
      <div className="search-content max-w-5xl mx-auto pt-32 px-6">
        <h1 className="text-zinc-400 text-sm font-bold tracking-widest uppercase text-center mb-6">
          Search Results for <span className="text-white">"{query}"</span>
        </h1>

        {/* Dynamic Capsule Tab Switcher */}
        <div className="flex gap-3 justify-center mb-8">
          <button 
            onClick={() => setActiveTab("albums")}
            className={`px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-wider transition-all duration-300 flex items-center gap-2 ${
              activeTab === "albums" 
                ? "bg-[#1db954] text-black shadow-lg shadow-[#1db95430] scale-102" 
                : "bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-white/5"
            }`}
          >
            <span>Albums</span>
            <span className={`text-[10px] px-1.5 py-0.25 rounded-full font-extrabold ${activeTab === "albums" ? "bg-black/10 text-black" : "bg-white/5 text-zinc-400"}`}>
              {albums.length}
            </span>
          </button>
          
          <button 
            onClick={() => setActiveTab("artists")}
            className={`px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-wider transition-all duration-300 flex items-center gap-2 ${
              activeTab === "artists" 
                ? "bg-[#1db954] text-black shadow-lg shadow-[#1db95430] scale-102" 
                : "bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-white/5"
            }`}
          >
            <span>Artists</span>
            <span className={`text-[10px] px-1.5 py-0.25 rounded-full font-extrabold ${activeTab === "artists" ? "bg-black/10 text-black" : "bg-white/5 text-zinc-400"}`}>
              {artists.length}
            </span>
          </button>

          <button 
            onClick={() => setActiveTab("profiles")}
            className={`px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-wider transition-all duration-300 flex items-center gap-2 ${
              activeTab === "profiles" 
                ? "bg-[#1db954] text-black shadow-lg shadow-[#1db95430] scale-102" 
                : "bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-white/5"
            }`}
          >
            <span>Profiles</span>
            <span className={`text-[10px] px-1.5 py-0.25 rounded-full font-extrabold ${activeTab === "profiles" ? "bg-black/10 text-black" : "bg-white/5 text-zinc-400"}`}>
              {profiles.length}
            </span>
          </button>
        </div>

        {/* Albums Tab Content */}
        {activeTab === "albums" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
            {albums.length === 0 ? (
              <p className="text-zinc-500 text-center col-span-full py-10 font-bold text-sm">No albums matched your search.</p>
            ) : (
              albums.map((alb) => (
                <div 
                  key={alb.id} 
                  className="bg-black/40 backdrop-blur-md p-5 rounded-3xl border border-white/5 hover:border-white/10 flex gap-4 transition-all duration-200"
                >
                  <div 
                    className="flex-shrink-0 w-28 sm:w-32 cursor-pointer aspect-square rounded-2xl overflow-hidden border border-white/10 hover:border-[#1db954]/50 transition-colors relative group" 
                    onClick={() => handleAlbumClick(alb.id)}
                  >
                    {alb.cover ? (
                      <img src={alb.cover} alt={alb.name} className="w-full h-full object-cover group-hover:opacity-75 transition-opacity duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs">No Cover</div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <span className="text-white text-[10px] sm:text-xs font-semibold bg-[#1db954]/90 px-2.5 py-1 rounded-full shadow-md">
                        View Details
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col justify-center min-w-0">
                    <h2 
                      className="text-white text-left font-bold text-base sm:text-lg hover:text-[#1db954] cursor-pointer transition-colors line-clamp-2" 
                      onClick={() => handleAlbumClick(alb.id)}
                    >
                      {alb.name}
                    </h2>
                    <h4 className="text-zinc-400 text-left text-xs font-semibold mt-1">
                      {alb.release_date?.slice(0, 4)}
                    </h4>
                    <h6 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleArtistClickByName(alb.artist);
                      }}
                      className="text-[#1db954] text-left text-sm font-bold mt-0.5 truncate hover:underline cursor-pointer inline-block transition-all"
                    >
                      {alb.artist}
                    </h6>

                    <div className="flex items-center gap-2 mt-3">
                      <div className="flex items-center gap-1.5 bg-black/40 border border-zinc-800 px-3 py-1 rounded-full">
                        <span className="text-[9px] text-zinc-500 font-black tracking-wider">SCORE</span>
                        <span className={`text-[11px] font-black ${alb.ratingsCount > 0 ? 'text-[#1db954]' : 'text-zinc-500'}`}>
                          {alb.ratingsCount > 0 ? `${Math.round(alb.averageRating)}/100` : '—'}
                        </span>
                      </div>
                      {alb.ratingsCount > 0 && (
                        <span className="text-[10px] text-zinc-500 font-bold">({alb.ratingsCount} {alb.ratingsCount === 1 ? 'rating' : 'ratings'})</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}


        {/* Artists Tab Content */}
        {activeTab === "artists" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 sm:gap-8 animate-fadeIn">
            {artists.length === 0 ? (
              <p className="text-zinc-500 text-center col-span-full py-10 font-bold text-sm">No artists matched your search.</p>
            ) : (
              artists.map((art) => (
                <div 
                  key={art.id} 
                  onClick={() => handleArtistClick(art.id)}
                  className="flex flex-col items-center cursor-pointer group text-center"
                >
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden mb-3 border border-white/5 group-hover:border-[#1db954]/50 shadow-lg group-hover:scale-105 transition-all duration-300 flex-shrink-0 relative">
                    {art.image ? (
                      <img src={art.image} alt={art.name} className="w-full h-full object-cover group-hover:opacity-75 transition-opacity" />
                    ) : (
                      <div className="w-full h-full bg-zinc-800/80 flex items-center justify-center text-zinc-500 font-bold text-xs uppercase">No Photo</div>
                    )}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  
                  <h3 className="text-white text-sm font-bold group-hover:text-[#1db954] transition-colors line-clamp-1 px-1">
                    {art.name}
                  </h3>
                  {art.genres.length > 0 && (
                    <span className="text-[10px] text-zinc-500 font-semibold truncate max-w-[130px] capitalize mt-0.5">
                      {art.genres.slice(0, 1).join(", ")}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Profiles Tab Content */}
        {activeTab === "profiles" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 animate-fadeIn">
            {profiles.length === 0 ? (
              <p className="text-zinc-500 text-center col-span-full py-10 font-bold text-sm">No profiles matched your search.</p>
            ) : (
              profiles.map((prof) => (
                <div 
                  key={prof._id} 
                  onClick={() => navigate(`/user/${prof.username}`)}
                  className="bg-black/40 backdrop-blur-md p-5 rounded-3xl border border-white/5 hover:border-[#1db954]/30 hover:bg-zinc-900/40 flex items-center gap-4 cursor-pointer transition-all duration-200"
                >
                  <div className="w-14 h-14 rounded-full overflow-hidden border border-white/10 flex-shrink-0">
                    <img 
                      src={prof.avatarUrl || "/src/assets/defaultprofilepicture.jpg"} 
                      alt={prof.username} 
                      className="w-full h-full object-cover" 
                      onError={(e) => { e.target.src = "/src/assets/defaultprofilepicture.jpg"; }}
                    />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <h3 className="text-white font-bold text-base hover:text-[#1db954] transition-colors truncate">
                      {prof.username}
                    </h3>
                    <p className="text-zinc-500 text-xs truncate max-w-full italic mt-1">
                      {prof.bio || "No biography written"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
