import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("query") || "";
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="mt-24 p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
      {albums.map((alb) => (
        <div key={alb.id} className="bg-white/5 rounded-xl p-3">
          {alb.cover && <img src={alb.cover} alt={alb.name} className="rounded-lg aspect-square object-cover" />}
          <h3 className="text-white mt-2 text-sm font-semibold">{alb.name}</h3>
          <p className="text-white/60 text-xs">{alb.artist}</p>
          <p className="text-white/40 text-[10px]">{alb.release_date}</p>
        </div>
      ))}
    </div>
  );
};

export default SearchResults;
