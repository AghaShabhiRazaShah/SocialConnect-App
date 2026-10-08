import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

// Current user ki ID nikalne ka helper function
const getCurrentUserId = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.userId;
  } catch {
    return null;
  }
};

const Profile = () => {
  const { userId } = useParams();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [userData, setUserData] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState('');

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const currentUserId = getCurrentUserId();
  const isOwnProfile = currentUserId && currentUserId == userId;

  // Comments states
  const [commentText, setCommentText] = useState('');
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [postComments, setPostComments] = useState({});

  // ✅ NAYE STATES: Post banane ke liye
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    try {
      const userResponse = await axios.get(`http://localhost:5000/api/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
      setUserData(userResponse.data);
      setEditBio(userResponse.data.bio || '');

      const postsResponse = await axios.get(`http://localhost:5000/api/users/${userId}/posts`, { headers: { Authorization: `Bearer ${token}` } });
      setUserPosts(postsResponse.data);

      const followResponse = await axios.get(`http://localhost:5000/api/users/${userId}/follow-status`, { headers: { Authorization: `Bearer ${token}` } });
      setIsFollowing(followResponse.data.isFollowing);
      setFollowerCount(followResponse.data.followerCount);
      setFollowingCount(followResponse.data.followingCount);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      if (isFollowing) {
        await axios.delete(`http://localhost:5000/api/follow/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post(`http://localhost:5000/api/follow/${userId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      }
      loadProfile(); 
    } catch (error) {
      console.error('Follow/Unfollow Error:', error);
    }
  };

  const handleSaveProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await axios.put(`http://localhost:5000/api/users/${userId}`, { bio: editBio }, { headers: { Authorization: `Bearer ${token}` } });
      setUserData({ ...userData, bio: editBio });
      setIsEditing(false);
      alert("Bio update ho gaya!");
    } catch (error) {
      console.error('Error updating profile:', error);
      alert("Profile update karne mein masla aa gaya");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Kya aap waqai is post ko delete karna chahte hain?")) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`http://localhost:5000/api/posts/${postId}`, { headers: { Authorization: `Bearer ${token}` } });
      setUserPosts(userPosts.filter(post => post.id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
      alert(error.response?.data?.message || 'Post delete karne mein masla aa gaya');
    }
  };

  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('profilePic', file);
    try {
      const response = await axios.put(`http://localhost:5000/api/users/${userId}/profile-pic`, formData, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
      setUserData({ ...userData, profile_pic: response.data.profile_pic });
      alert('Profile picture updated! 📸');
    } catch (error) {
      console.error('Profile pic upload error:', error);
      alert(error.response?.data?.message || 'Image upload failed');
    }
  };

  const handleCoverPicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('coverPic', file);
    try {
      const response = await axios.put(`http://localhost:5000/api/users/${userId}/cover-pic`, formData, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
      setUserData({ ...userData, cover_pic: response.data.cover_pic });
      alert('Cover banner updated! 🎨');
    } catch (error) {
      console.error('Cover pic upload error:', error);
      alert(error.response?.data?.message || 'Image upload failed');
    }
  };

  // ✅ NAYE FUNCTIONS: Post banane ke liye
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && !selectedImage) {
      alert('Please write something or add an image!');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const formData = new FormData();
      formData.append('content', newPostContent);
      if (selectedImage) formData.append('postImage', selectedImage);

      await axios.post('http://localhost:5000/api/posts', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });

      setNewPostContent('');
      setSelectedImage(null);
      setImagePreview(null);
      
      // ✅ Post banne ke baad profile refresh karein taake nayi post dikhe
      loadProfile(); 
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post.');
    }
  };

  const handleLike = async (postId, currentIsLiked, currentLikesCount) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await axios.post(`http://localhost:5000/api/posts/${postId}/like`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setUserPosts(userPosts.map(post => {
        if (post.id === postId) {
          const newLikedStatus = !currentIsLiked;
          return { ...post, is_liked: newLikedStatus ? 1 : 0, likes_count: newLikedStatus ? (currentLikesCount || 0) + 1 : (currentLikesCount || 0) - 1 };
        }
        return post;
      }));
    } catch (error) { console.error('Error liking post:', error); }
  };

  const toggleComments = async (postId) => {
    if (activeCommentPostId === postId) { setActiveCommentPostId(null); return; }
    setActiveCommentPostId(postId);
    if (!postComments[postId]) {
      try {
        const response = await axios.get(`http://localhost:5000/api/posts/${postId}/comments`);
        setPostComments(prev => ({ ...prev, [postId]: response.data }));
      } catch (error) { console.error('Error fetching comments:', error); }
    }
  };

  const handleAddComment = async (postId) => {
    if (!commentText.trim()) return;
    const token = localStorage.getItem('token');
    try {
      await axios.post(`http://localhost:5000/api/posts/${postId}/comments`, { content: commentText }, { headers: { Authorization: `Bearer ${token}` } });
      setCommentText('');
      const response = await axios.get(`http://localhost:5000/api/posts/${postId}/comments`);
      setPostComments(prev => ({ ...prev, [postId]: response.data }));
    } catch (error) { console.error('Error adding comment:', error); }
  };

  const handleDeleteComment = async (postId, commentId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`http://localhost:5000/api/comments/${commentId}`, { headers: { Authorization: `Bearer ${token}` } });
      setPostComments(prev => ({ ...prev, [postId]: prev[postId].filter(comment => comment.id !== commentId) }));
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert(error.response?.data?.message || 'Comment delete karne mein masla aa gaya');
    }
  };

  if (loading) return <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center"><p className="text-xl text-gray-500">Loading profile...</p></div>;
  if (!userData) return <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center"><p className="text-xl text-gray-500">User not found</p></div>;

  return (
    <div className="min-h-screen bg-[#f8f9ff]">
      <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md shadow-sm z-50 h-16">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 px-4 py-2 bg-[#e5eeff] hover:bg-[#1d9bf0] hover:text-white text-[#00629d] font-semibold rounded-full transition-all">
            <span className="text-xl">⬅️</span><span>Back to Feed</span>
          </Link>
          <div className="flex items-center gap-2"><span className="text-xl font-bold text-[#00629d]">SocialConnect</span></div>
          <div className="relative">
            <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="p-2 hover:bg-[#e5eeff] rounded-full transition-colors">
              <img src="https://ui-avatars.com/api/?name=Agha+Shabhi&background=00629d&color=fff" alt="Profile" className="w-8 h-8 rounded-full" />
            </button>
            {showProfileMenu && (
              <div className="absolute top-12 right-0 w-48 bg-white shadow-lg rounded-xl border border-gray-100 overflow-hidden z-50">
                <Link to={`/profile/${userId}`} onClick={() => setShowProfileMenu(false)} className="block px-4 py-3 hover:bg-[#f0f4f8] transition-colors text-[#0b1c30] font-medium">👤 My Profile</Link>
                <button onClick={handleLogout} className="w-full text-left px-4 py-3 hover:bg-red-50 transition-colors text-red-500 font-medium border-t border-gray-100">🚪 Logout</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto pt-20 px-4">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
          <div className="h-48 bg-gradient-to-r from-[#1d9bf0] to-[#316bf3] relative">
            {userData.cover_pic && <img src={userData.cover_pic} alt="Cover" className="w-full h-full object-cover" />}
            {isOwnProfile && isEditing && (
              <label className="absolute top-4 right-4 bg-white/95 hover:bg-white px-4 py-2 rounded-full cursor-pointer text-sm font-semibold shadow-lg transition-all flex items-center gap-2">
                📷 Change Cover <input type="file" accept="image/*" onChange={handleCoverPicUpload} className="hidden" />
              </label>
            )}
          </div>

          <div className="px-6 pb-6">
            <div className="flex items-end justify-between -mt-12 mb-4">
              <div className="relative">
                <img src={userData.profile_pic || `https://ui-avatars.com/api/?name=${userData.username}&background=00629d&color=fff&size=200`} alt="Profile" className="w-28 h-28 rounded-full border-4 border-white shadow-md object-cover" />
                {isOwnProfile && isEditing && (
                  <label className="absolute bottom-1 right-1 bg-[#00629d] hover:bg-[#0051d5] text-white w-9 h-9 rounded-full cursor-pointer flex items-center justify-center shadow-lg transition-all border-2 border-white">
                    📷 <input type="file" accept="image/*" onChange={handleProfilePicUpload} className="hidden" />
                  </label>
                )}
              </div>

              <div className="flex items-center gap-2 mb-2">
                {isOwnProfile ? (
                  isEditing ? (
                    <>
                      <button onClick={handleSaveProfile} className="px-6 py-2 rounded-full bg-[#00629d] text-white hover:bg-[#0051d5] font-semibold transition-colors">💾 Save</button>
                      <button onClick={() => setIsEditing(false)} className="px-6 py-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 font-semibold transition-colors">Cancel</button>
                    </>
                  ) : (
                    <button onClick={() => setIsEditing(true)} className="px-6 py-2 rounded-full bg-[#e5eeff] hover:bg-gray-200 font-semibold transition-colors">✏️ Edit Profile</button>
                  )
                ) : (
                  <button onClick={handleFollow} className={`px-6 py-2 rounded-full font-semibold transition-all ${isFollowing ? 'bg-gray-200 text-gray-700' : 'bg-[#00629d] text-white hover:bg-[#0051d5]'}`}>
                    {isFollowing ? '✓ Following' : 'Follow'}
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2"><h1 className="text-2xl font-bold text-[#0b1c30]">{userData.username}</h1><span className="text-[#00629d]">✓</span></div>
              <p className="text-gray-500">@{userData.username.toLowerCase()}</p>
              {isEditing && isOwnProfile ? (
                <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00629d]" rows="3" placeholder="Apne baare mein kuch likhein..." />
              ) : (
                <p className="text-[#0b1c30]">{userData.bio || 'Full Stack Developer & UI/UX Enthusiast • Building amazing web applications 🚀'}</p>
              )}
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-1"><span className="font-bold text-[#0b1c30] text-lg">{followerCount.toLocaleString()}</span><span className="text-gray-500">Followers</span></div>
                <div className="flex items-center gap-1"><span className="font-bold text-[#0b1c30] text-lg">{followingCount}</span><span className="text-gray-500">Following</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ NAYA SECTION: Create Post Box (Sirf apni profile par dikhega) */}
        {isOwnProfile && (
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
            <div className="flex gap-3">
              <img src={userData.profile_pic || `https://ui-avatars.com/api/?name=${userData.username}&background=00629d&color=fff`} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
              <div className="flex-1">
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="What's on your mind?"
                  className="w-full p-3 bg-[#f0f4f8] rounded-xl outline-none focus:ring-2 focus:ring-[#00629d]/20 resize-none"
                  rows="3"
                />
                
                {imagePreview && (
                  <div className="relative mt-3">
                    <img src={imagePreview} alt="Preview" className="w-full max-h-60 object-cover rounded-xl border border-gray-200" />
                    <button onClick={handleRemoveImage} className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all">✕</button>
                  </div>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <label className="flex items-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-full cursor-pointer transition-colors font-medium text-sm">
                    <span className="text-lg">🖼️</span><span>Photo</span>
                    <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                  </label>
                  <button onClick={handleCreatePost} className="px-6 py-2 bg-[#1d9bf0] hover:bg-[#00629d] text-white font-semibold rounded-full transition-colors">Post</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-4">
          <h2 className="text-xl font-bold text-[#0b1c30] mb-4">My Posts ({userPosts.length})</h2>
          <div className="space-y-4">
            {userPosts.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-bold text-[#0b1c30] mb-2">No posts yet</h3>
              </div>
            ) : (
              userPosts.map((post) => (
                <article key={post.id} className="bg-white rounded-2xl shadow-sm p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex gap-3 flex-1">
                      <img src={post.profile_pic || `https://ui-avatars.com/api/?name=${post.username}&background=00629d&color=fff`} alt={post.username} className="w-11 h-11 rounded-full object-cover" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#0b1c30]">{post.username}</span>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-500 text-sm">{new Date(post.created_at).toLocaleDateString()} {new Date(post.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                      </div>
                    </div>
                    {currentUserId === post.user_id && (
                      <button onClick={() => handleDeletePost(post.id)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-all" title="Delete Post">️</button>
                    )}
                  </div>

                  <p className="text-[#0b1c30] leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>
                  {post.image_url && <img src={post.image_url} alt="Post" className="w-full rounded-xl mb-4 object-cover max-h-96" />}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <button onClick={() => handleLike(post.id, post.is_liked, post.likes_count)} className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${post.is_liked ? 'text-red-500 bg-red-50' : 'text-gray-500 hover:bg-red-50'}`}>
                      <span>{post.is_liked ? '❤️' : '🤍'}</span><span className="font-semibold">{post.likes_count || 0}</span>
                    </button>
                    <button onClick={() => toggleComments(post.id)} className="flex items-center gap-2 px-4 py-2 rounded-full text-gray-500 hover:bg-[#e5eeff]">
                      <span>💬</span><span className="font-semibold">{post.comments_count || 0}</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-full text-gray-500 hover:bg-[#e5eeff]"><span>🔄</span><span className="font-semibold">0</span></button>
                  </div>

                  {activeCommentPostId === post.id && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                        {postComments[post.id] && postComments[post.id].length > 0 ? (
                          postComments[post.id].map((comment) => (
                            <div key={comment.id} className="flex gap-2 items-start">
                              <img src={comment.profile_pic || `https://ui-avatars.com/api/?name=${comment.username}`} className="w-8 h-8 rounded-full mt-1" alt="user" />
                              <div className="bg-[#f0f4f8] p-2 rounded-xl flex-1">
                                <div className="flex justify-between items-start">
                                  <p className="text-sm font-bold text-[#0b1c30]">{comment.username}</p>
                                  <button onClick={() => handleDeleteComment(post.id, comment.id)} className="text-red-500 text-xs hover:text-red-700 font-semibold px-2 hover:bg-red-50 rounded transition-colors">🗑️ Delete</button>
                                </div>
                                <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-gray-400 text-sm">No comments yet. Be the first!</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write a comment..." className="flex-1 p-2 border border-gray-200 rounded-full outline-none focus:border-[#00629d]" />
                        <button onClick={() => handleAddComment(post.id)} className="px-4 py-2 bg-[#00629d] text-white rounded-full text-sm font-semibold hover:bg-[#0051d5]">Post</button>
                      </div>
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;