import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavbarHome from './components/NavbarHome';
import { useUser } from './UserContext';
import defaultProfile from './assets/defaultprofilepicture.jpg';

// Gorgeous built-in music gradient avatars represented as optimized SVG data-URIs
const GRADIENT_AVATARS = [
  { name: 'Green Glow', url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><defs><linearGradient id='g1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%231db954'/><stop offset='100%25' stop-color='%23191414'/></linearGradient></defs><circle cx='50' cy='50' r='50' fill='url(%23g1)'/></svg>" },
  { name: 'Cyberpunk Sunset', url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><defs><linearGradient id='g2' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%23ff007f'/><stop offset='100%25' stop-color='%237b2cbf'/></linearGradient></defs><circle cx='50' cy='50' r='50' fill='url(%23g2)'/></svg>" },
  { name: 'Deep Ocean', url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><defs><linearGradient id='g3' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%2300f2fe'/><stop offset='100%25' stop-color='%234facfe'/></linearGradient></defs><circle cx='50' cy='50' r='50' fill='url(%23g3)'/></svg>" },
  { name: 'Purple Dream', url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><defs><linearGradient id='g4' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%23b224ef'/><stop offset='100%25' stop-color='%237579ff'/></linearGradient></defs><circle cx='50' cy='50' r='50' fill='url(%23g4)'/></svg>" },
  { name: 'Solar Flare', url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><defs><linearGradient id='g5' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%23ff930f'/><stop offset='100%25' stop-color='%23ff1b68'/></linearGradient></defs><circle cx='50' cy='50' r='50' fill='url(%23g5)'/></svg>" },
  { name: 'Silver Slate', url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><defs><linearGradient id='g6' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%23bdc3c7'/><stop offset='100%25' stop-color='%232c3e50'/></linearGradient></defs><circle cx='50' cy='50' r='50' fill='url(%23g6)'/></svg>" },
];

const UserProfile = () => {
  const { username: paramUsername } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useUser();

  // If no username parameter, display logged-in user's profile
  const targetUsername = paramUsername || currentUser?.username;
  const isOwnProfile = currentUser && targetUsername && currentUser.username.toLowerCase() === targetUsername.toLowerCase();

  const [profile, setProfile] = useState(null);
  const [diary, setDiary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [diaryLoading, setDiaryLoading] = useState(true);

  // Social Following States
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  // Edit Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [newBio, setNewBio] = useState('');
  const [newAvatar, setNewAvatar] = useState('');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [updating, setUpdating] = useState(false);

  // Search & Sort States for Diary
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date-desc'); // date-desc, date-asc, rating-desc, rating-asc

  // Sync followers / following counts from profile object initially
  useEffect(() => {
    if (profile) {
      setFollowersCount(profile.followersCount || 0);
      setFollowingCount(profile.followingCount || 0);
    }
  }, [profile]);

  // Fetch follow status of logged-in user to this user
  useEffect(() => {
    if (!targetUsername) return;
    const fetchFollowStatus = async () => {
      try {
        const url = `/api/profile/social/follow-status/${targetUsername}` + (currentUser?._id ? `?userId=${currentUser._id}` : '');
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setIsFollowing(data.isFollowing);
          setFollowersCount(data.followersCount);
          setFollowingCount(data.followingCount);
        }
      } catch (err) {
        console.error('Error fetching follow status:', err);
      }
    };
    fetchFollowStatus();
  }, [targetUsername, currentUser]);

  // Toggle follow/unfollow status
  const handleFollowToggle = async () => {
    if (!currentUser?._id) {
      alert('You must be logged in to follow users!');
      return;
    }
    
    const action = isFollowing ? 'unfollow' : 'follow';
    try {
      const res = await fetch(`/api/profile/social/${action}/${targetUsername}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser._id })
      });
      const data = await res.json();
      if (res.ok) {
        setIsFollowing(data.isFollowing);
        setFollowersCount(data.followersCount);
        setFollowingCount(data.followingCount);
      } else {
        alert(data.error || `Failed to ${action} user`);
      }
    } catch (err) {
      console.error(`Error trying to ${action}:`, err);
    }
  };

  const fetchProfileData = async () => {
    if (!targetUsername) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/profile/${targetUsername}`);
      const data = await res.json();
      if (res.ok) {
        setProfile(data);
        setNewBio(data.bio || '');
        setNewAvatar(data.avatarUrl || defaultProfile);
      } else {
        console.error('Failed to load profile:', data);
        setProfile(null);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchDiaryData = async () => {
    if (!targetUsername) return;
    try {
      setDiaryLoading(true);
      const res = await fetch(`/api/profile/${targetUsername}/diary`);
      const data = await res.json();
      if (res.ok) {
        setDiary(data || []);
      }
    } catch (err) {
      console.error('Error fetching diary:', err);
    } finally {
      setDiaryLoading(false);
    }
  };

  useEffect(() => {
    if (targetUsername) {
      fetchProfileData();
      fetchDiaryData();
    }
  }, [targetUsername, currentUser]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!currentUser?._id) return;
    setUpdating(true);

    const finalAvatar = customAvatarUrl.trim() || newAvatar;

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser._id,
          bio: newBio,
          avatarUrl: finalAvatar
        })
      });
      const data = await res.json();
      if (res.ok) {
        setShowEditModal(false);
        fetchProfileData();
        // Force window navigation or state update to refresh navbar avatar
        window.location.reload();
      } else {
        alert(data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveFavorite = async (e, spotifyId) => {
    e.stopPropagation(); // Avoid navigating to the album page
    if (!currentUser?._id) return;

    try {
      const res = await fetch('/api/profile/favorites/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser._id,
          spotifyId
        })
      });
      if (res.ok) {
        fetchProfileData();
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  // Split and handle artist lookup & navigation
  const handleArtistClick = async (artistName) => {
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

  // Filter and Sort Diary Items
  const filteredDiary = diary.filter(item => {
    const q = searchQuery.toLowerCase();
    return (item.title?.toLowerCase().includes(q) || item.artist?.toLowerCase().includes(q));
  });

  const sortedDiary = [...filteredDiary].sort((a, b) => {
    if (sortBy === 'date-desc') return new Date(b.date) - new Date(a.date);
    if (sortBy === 'date-asc') return new Date(a.date) - new Date(b.date);
    if (sortBy === 'rating-desc') return (b.rating || 0) - (a.rating || 0);
    if (sortBy === 'rating-asc') return (a.rating || 0) - (b.rating || 0);
    return 0;
  });

  if (loading) {
    return (
      <div className="bg-zinc-950 min-h-screen">
        <NavbarHome />
        <div className="pt-40 flex justify-center items-center text-zinc-400 font-bold">
          <div className="flex flex-col items-center gap-3">
            <span className="loading loading-ring loading-lg text-[#1db954]"></span>
            <p className="animate-pulse text-xs tracking-widest uppercase">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-zinc-950 min-h-screen flex flex-col justify-center items-center text-zinc-400">
        <NavbarHome />
        <h2 className="text-xl font-bold mb-2">User not found</h2>
        <p className="text-sm text-zinc-500 mb-6">The username "{targetUsername}" does not exist in Albumboxd.</p>
        <button onClick={() => navigate('/')} className="btn btn-sm btn-outline border-zinc-700 text-white rounded-full">
          Back Home
        </button>
      </div>
    );
  }

  // Set ambient cover photo based on first favorite album cover
  const ambientCover = profile.favorites?.[0]?.imageUrl || null;

  return (
    <div className="bg-gradient-to-b from-zinc-900 via-zinc-800 to-[#1db95410] min-h-screen pb-20 relative overflow-hidden text-left">
      {/* Ambient background blur */}
      {ambientCover ? (
        <div 
          className="absolute top-0 left-0 w-full h-[600px] pointer-events-none z-0"
          style={{
            backgroundImage: `url(${ambientCover})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            filter: 'blur(100px) saturate(130%)',
            opacity: 0.18,
          }}
        />
      ) : (
        <div className="absolute top-0 left-0 w-full h-[600px] pointer-events-none z-0 bg-gradient-to-r from-[#1db954]/5 to-purple-500/5 filter blur-3xl opacity-20" />
      )}

      <div className="relative z-10 w-full">
        <NavbarHome />

        <div className="max-w-4xl mx-auto pt-32 px-4 sm:px-6">
          
          {/* Glassmorphic User Info Card */}
          <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center md:items-start gap-8 shadow-2xl transition duration-300">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-[#1db954] shadow-2xl flex-shrink-0 relative group">
              <img 
                src={profile.avatarUrl || defaultProfile} 
                alt={profile.username} 
                className="w-full h-full object-cover" 
              />
            </div>

            <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-4 mb-2">
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">{profile.username}</h1>
                
                {isOwnProfile && (
                  <button 
                    onClick={() => setShowEditModal(true)}
                    className="btn btn-xs bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white rounded-full px-3.5 border border-white/5 font-bold transition duration-200"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-3">
                Joined {new Date(profile.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
              </p>

              <p className="text-zinc-300 text-sm leading-relaxed max-w-xl mb-4">
                {profile.bio || <span className="text-zinc-600 italic">No bio written yet.</span>}
              </p>

              {!isOwnProfile && (
                <button 
                  id="follow-btn"
                  onClick={handleFollowToggle}
                  className={`btn btn-xs rounded-full px-4 font-bold border transition duration-200 ${
                    isFollowing 
                      ? 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-[#ab0a35]/20 hover:text-[#ff4c7d] hover:border-[#ff4c7d]/30' 
                      : 'bg-[#1db954] text-black border-transparent hover:bg-[#1db954bb] hover:scale-102 active:scale-98'
                  }`}
                >
                  {isFollowing ? '✓ Following' : '+ Follow'}
                </button>
              )}
            </div>

            {/* Counts Panel */}
            <div className="flex flex-wrap justify-center gap-6 border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-8 flex-shrink-0">
              <div className="text-center px-2">
                <span className="block text-2xl sm:text-3xl font-black text-[#1db954]">{profile.ratingsCount}</span>
                <span className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-widest">Ratings</span>
              </div>
              <div className="text-center px-2">
                <span className="block text-2xl sm:text-3xl font-black text-purple-400">{profile.reviewsCount}</span>
                <span className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-widest">Reviews</span>
              </div>
              <div className="text-center px-2">
                <span className="block text-2xl sm:text-3xl font-black text-blue-400">{followersCount}</span>
                <span className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-widest">Followers</span>
              </div>
              <div className="text-center px-2">
                <span className="block text-2xl sm:text-3xl font-black text-amber-400">{followingCount}</span>
                <span className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-widest">Following</span>
              </div>
            </div>
          </div>

          {/* Letterboxd-style Favorites Grid */}
          <div className="mt-12">
            <h2 className="text-xs text-[#1db954] font-extrabold tracking-widest uppercase mb-4">Four Favorites (Highest Rated)</h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 bg-black/25 backdrop-blur-md p-6 rounded-3xl border border-white/5 shadow-xl">
              {profile.favorites && profile.favorites.length > 0 ? (
                profile.favorites.map((fav) => (
                  <div 
                    key={fav.spotifyId}
                    onClick={() => navigate(`/album/${fav.spotifyId}`)}
                    className="relative cursor-pointer group rounded-2xl overflow-hidden aspect-square border border-white/5 group-hover:border-[#1db954]/40 shadow-lg transform hover:scale-102 hover:shadow-2xl transition duration-300"
                  >
                    {fav.imageUrl ? (
                      <img 
                        src={fav.imageUrl} 
                        alt={fav.title} 
                        className="w-full h-full object-cover group-hover:opacity-75 transition duration-300" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-600 font-bold text-xs">No Cover</div>
                    )}

                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3 text-left">
                      <span className="text-white text-xs font-black truncate">{fav.title}</span>
                      <span className="text-zinc-400 text-[10px] truncate">{fav.artist}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-10 text-center text-zinc-600 text-sm font-semibold italic flex flex-col items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8 h-8 text-zinc-700 mb-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {isOwnProfile ? 'Rate some albums 0-100 to automatically display your top 4 highest rated here!' : 'No favorites to display.'}
                </div>
              )}
            </div>
          </div>

          {/* Chronological Diary Panel */}
          <div className="mt-16">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-6">
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Personal Diary & History</span>
                <span className="text-xs bg-zinc-800 text-[#1db954] px-2 py-0.5 rounded-full font-black">
                  {filteredDiary.length} entries
                </span>
              </h2>

              {/* Search & Sort Panel */}
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <input 
                  type="text" 
                  placeholder="Filter diary..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-full py-1.5 px-4 text-xs text-white placeholder-zinc-500 w-full sm:w-44 focus:outline-none focus:border-[#1db954] transition shadow-inner"
                />
                
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-full py-1.5 px-4 text-xs text-white focus:outline-none focus:border-[#1db954] cursor-pointer"
                >
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="rating-desc">Highest Rating</option>
                  <option value="rating-asc">Lowest Rating</option>
                </select>
              </div>
            </div>

            {diaryLoading ? (
              <div className="flex justify-center py-12">
                <span className="loading loading-spinner text-[#1db954] loading-md"></span>
              </div>
            ) : sortedDiary.length === 0 ? (
              <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-10 text-center text-zinc-500 font-semibold text-sm">
                No entries match your search or diary is empty.
              </div>
            ) : (
              <div className="space-y-4">
                {sortedDiary.map((item) => {
                  const hasRating = typeof item.rating === 'number' && item.rating !== null;
                  const hasReview = item.review && item.review.trim() !== '';

                  return (
                    <div 
                      key={item.spotifyId}
                      className="bg-zinc-900/40 border border-white/5 rounded-2xl p-5 hover:border-white/10 hover:bg-zinc-900/60 transition duration-200 flex gap-5 items-start"
                    >
                      {/* Album cover */}
                      <div 
                        onClick={() => navigate(`/album/${item.spotifyId}`)}
                        className="w-16 h-16 rounded-xl overflow-hidden border border-white/5 flex-shrink-0 cursor-pointer shadow-md hover:scale-103 transition duration-200"
                      >
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-600 font-bold">No Cover</div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <div>
                            <h3 
                              onClick={() => navigate(`/album/${item.spotifyId}`)}
                              className="font-bold text-white text-base leading-tight hover:underline cursor-pointer truncate"
                            >
                              {item.title}
                            </h3>
                            <h4 
                              onClick={() => handleArtistClick(item.artist)}
                              className="text-zinc-400 hover:text-[#1db954] hover:underline cursor-pointer text-xs font-bold mt-0.5 truncate"
                            >
                              {item.artist}
                            </h4>
                          </div>

                          <div className="flex items-center gap-3">
                            {/* Score badge */}
                            <span className={`text-[10px] font-black tracking-wider px-2.5 py-1 rounded-full border flex-shrink-0 ${
                              hasRating 
                                ? 'text-[#1db954] bg-[#1db95408] border-[#1db95420]' 
                                : 'text-zinc-500 bg-white/5 border-white/5'
                            }`}>
                              SCORE: {hasRating ? `${item.rating}/100` : '—'}
                            </span>

                            <span className="text-[10px] text-zinc-500 font-extrabold uppercase whitespace-nowrap">
                              {new Date(item.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        </div>

                        {/* Review bubble */}
                        {hasReview ? (
                          <p className="text-zinc-300 text-xs leading-relaxed bg-black/20 p-3 rounded-xl border border-white/5 italic whitespace-pre-wrap break-words">
                            "{item.review}"
                          </p>
                        ) : (
                          <p className="text-zinc-600 text-xs italic">Rated without writing a review</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Edit Profile Glassmorphic Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-zinc-900/90 border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-left animate-scaleIn">
            <h2 className="text-2xl font-black text-white mb-6 border-b border-white/5 pb-2">Edit Profile Dashboard</h2>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              
              {/* Biography Section */}
              <div>
                <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Biography</label>
                <textarea 
                  value={newBio}
                  onChange={(e) => setNewBio(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-white/10 text-white rounded-2xl p-3 text-sm focus:outline-none focus:border-[#1db954] transition resize-none placeholder-zinc-600 shadow-inner"
                  rows={3}
                  placeholder="Share a bit about your music taste..."
                  maxLength={250}
                />
                <span className="text-[10px] text-zinc-600 font-bold block text-right mt-1">{newBio.length}/250 characters</span>
              </div>

              {/* Avatar Selector Grid */}
              <div>
                <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-3">Choose Music Avatar</label>
                <div className="grid grid-cols-6 gap-3 mb-4">
                  {GRADIENT_AVATARS.map((av) => {
                    const isSelected = newAvatar === av.url && !customAvatarUrl;
                    return (
                      <button
                        type="button"
                        key={av.name}
                        onClick={() => {
                          setNewAvatar(av.url);
                          setCustomAvatarUrl('');
                        }}
                        className={`aspect-square rounded-full overflow-hidden border-2 transition duration-200 hover:scale-105 active:scale-95 ${
                          isSelected ? 'border-[#1db954] scale-102 shadow-lg shadow-[#1db95415]' : 'border-transparent'
                        }`}
                        title={av.name}
                      >
                        <img src={av.url} alt={av.name} className="w-full h-full object-cover" />
                      </button>
                    );
                  })}
                </div>

                <div className="w-full flex items-center justify-between text-zinc-600 text-xs font-bold mb-3">
                  <div className="h-px bg-white/10 flex-1 mr-3"></div>
                  <span>OR CUSTOM URL</span>
                  <div className="h-px bg-white/10 flex-1 ml-3"></div>
                </div>

                {/* Custom Avatar Input */}
                <input 
                  type="url" 
                  value={customAvatarUrl}
                  onChange={(e) => setCustomAvatarUrl(e.target.value)}
                  placeholder="Paste image URL here..."
                  className="w-full bg-zinc-950/80 border border-white/10 text-white rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-[#1db954] transition shadow-inner"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-white/5">
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(false)}
                  className="btn btn-sm btn-ghost text-zinc-400 hover:text-white rounded-full px-5 text-xs font-bold transition duration-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={updating}
                  className="btn btn-sm bg-[#1db954] text-black hover:bg-[#1db954bb] rounded-full px-6 text-xs font-black tracking-wide shadow-lg hover:scale-102 active:scale-98 transition duration-200"
                >
                  {updating ? 'Saving...' : 'Save Settings'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
