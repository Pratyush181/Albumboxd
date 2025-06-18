import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import NavbarHome from "./components/NavbarHome";
import "./SearchResults.css"; 
import fivestarimg from "./assets/5starpng.webp"; 

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("query") || "";
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    if (!query) return;

    setLoading(true);
    fetch(`/api/search?query=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((d) => setAlbums(d.albums || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [query]);

  if (loading) return <div className="mt-24 text-center text-white">Loading…</div>;
  if (!albums.length) return <div className="mt-24 text-center text-white">No albums found.</div>;

  const handleAlbumClick = (albumId) => {
    navigate(`/album/${albumId}`);
  }

  return (

    <>

    <div className="search-info">

    <div className="search-content mt-16 p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
    <NavbarHome />

      
    {albums.map((alb) => (
      
        <div key={alb.id} className="album-display-container flex gap-4">

          <div className="album-cover container flex-shrink-0 w-40" onClick={() => handleAlbumClick(alb.id)}>
            {alb.cover && <img src={alb.cover} alt={alb.name} className="rounded-lg aspect-square object-cover" />}
          </div>

          <div className="album-info flex-1 flex flex-col justify-center">
            <div className="album-details gap-1"> 
              <h2 className="album-name text-left font-bold text-lg sm:text-2xl md:text-xl" onClick={() => handleAlbumClick(alb.id)}>
                <span className="block sm:hidden">
                  {alb.name.length > 23 ? `${alb.name.slice(0, 23)}...` : alb.name}
                </span>
                <span className="hidden sm:block lg:hidden">
                  {alb.name.length > 28 ? `${alb.name.slice(0, 28)}...` : alb.name}
                </span>
                <span className="hidden lg:block">
                  {alb.name.length > 35 ? `${alb.name.slice(0, 35)}...` : alb.name}
                </span>
              </h2>
              <h4 className="album-date text-left text-gray-300">{alb.release_date?.slice(0, 4)}</h4>
            </div>
            <h6 className="album-artist text-left text-lg sm:text-md text-[#1db954ec]" alt={alb.artist}>
              {alb.artist.length > 24 ? `${alb.artist.slice(0, 24)}...` : alb.artist}
            </h6>

            <div className="flex items-center gap-2">
              <img src={fivestarimg} alt={alb.name} className="w-32 h-8 object-contain" style={{filter: 'brightness(0) saturate(100%) invert(48%) sepia(79%) saturate(2476%) hue-rotate(86deg) brightness(118%) contrast(119%)'}} />
              <p className="text-gray-400">5/5</p>
            </div>

          </div>

        </div>
          
      ))}

    </div>


    </div>

    </>
  );
};

export default SearchResults;
