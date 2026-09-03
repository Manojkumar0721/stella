import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { 
  fetchPendingRequests, acceptFriendRequest, declineFriendRequest, fetchFriends
} from '../services/socialService';
import { 
  X, Camera, Check, Upload, User, Mail, Sparkles, LogOut, Loader2, Bell, UserCheck, UserX, CheckCircle2,
  ZoomIn, ZoomOut, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Move, RotateCcw, Users
} from 'lucide-react';

export default function ProfileModal({ onClose, onSelectFriend, activeFriendUser }) {
  const { userProfile, updateProfileAvatar, logout } = useAuth();
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Customization state: Zoom level & 2D Position Offsets (Pan)
  const [zoomLevel, setZoomLevel] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Mouse & Touch Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const [pendingRequests, setPendingRequests] = useState([]);
  const [friendsList, setFriendsList] = useState([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);

  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  // Load Social Data (Pending Friend Requests & Active Connections)
  const loadSocialData = async () => {
    if (!userProfile) return;
    setIsLoadingRequests(true);
    setIsLoadingFriends(true);
    const [reqs, friends] = await Promise.all([
      fetchPendingRequests(userProfile.uid, userProfile.email),
      fetchFriends(userProfile.uid, userProfile.email)
    ]);
    setPendingRequests(reqs);
    setFriendsList(friends);
    setIsLoadingRequests(false);
    setIsLoadingFriends(false);
  };

  useEffect(() => {
    loadSocialData();
  }, [userProfile]);

  const handleAccept = async (req) => {
    await acceptFriendRequest(req.id, req);
    loadSocialData();
  };

  const handleDecline = async (reqId) => {
    await declineFriendRequest(reqId);
    loadSocialData();
  };

  // Perform HTML5 Canvas Circular Crop with Zoom & Position offset
  const updateCropCanvas = (img, zoom, pos) => {
    if (!img) return;
    const canvas = canvasRef.current || document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const size = 250; // Optimized 250x250 resolution for ultra-fast performance
    canvas.width = size;
    canvas.height = size;
    
    ctx.clearRect(0, 0, size, size);
    
    ctx.save();
    
    // Draw circular clip path
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    
    // Background fill in case image is panned
    ctx.fillStyle = '#131314';
    ctx.fillRect(0, 0, size, size);
    
    // Calculate scale and dimensions to cover container
    const baseScale = Math.max(size / img.width, size / img.height);
    const drawWidth = img.width * baseScale * zoom;
    const drawHeight = img.height * baseScale * zoom;
    
    // Center coordinates with positional offsets (Up/Down/Left/Right)
    const drawX = (size - drawWidth) / 2 + pos.x;
    const drawY = (size - drawHeight) / 2 + pos.y;
    
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    
    ctx.restore();
    
    try {
      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
      setPreviewUrl(croppedDataUrl);
    } catch (err) {
      console.error("Canvas export error:", err);
    }
  };

  // Trigger canvas updates whenever zoom, position, or image changes
  useEffect(() => {
    if (imageRef.current && selectedImage) {
      updateCropCanvas(imageRef.current, zoomLevel, position);
    }
  }, [zoomLevel, position, selectedImage]);

  // Handle File Selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result);
      setZoomLevel(1);
      setPosition({ x: 0, y: 0 });

      const img = new Image();
      img.src = reader.result;
      img.onload = () => {
        imageRef.current = img;
        updateCropCanvas(img, 1, { x: 0, y: 0 });
      };
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // Positional Pan (Up, Down, Left, Right) Controls
  const handlePan = (dx, dy) => {
    setPosition(prev => ({
      x: prev.x + dx,
      y: prev.y + dy
    }));
  };

  const handleReset = () => {
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  };

  // Mouse Drag Handlers for direct interactive panning
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Drag Handlers for Mobile Devices
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Instant 0ms Latency Avatar Save (Instant local update + non-blocking background cloud sync)
  const handleSaveAvatar = () => {
    if (!previewUrl || !userProfile?.uid) {
      alert('Unable to save profile picture. User session not active.');
      return;
    }

    const currentPreview = previewUrl;

    // 1. INSTANT 0ms Update local AuthContext & LocalStorage session & registry!
    if (updateProfileAvatar) {
      updateProfileAvatar(currentPreview);
    }

    setUploadSuccess(true);

    setTimeout(() => {
      setSelectedImage(null);
      setUploadSuccess(false);
    }, 500);

    // 2. Non-blocking background sync to Firebase Storage & Firestore
    (async () => {
      try {
        let downloadURL = currentPreview;

        try {
          const avatarRef = ref(storage, `avatars/${userProfile.uid}_${Date.now()}.jpg`);
          await uploadString(avatarRef, currentPreview, 'data_url');
          downloadURL = await getDownloadURL(avatarRef);
        } catch (storageErr) {
          console.warn("Cloud Storage upload notice, using optimized base64 URL fallback:", storageErr);
        }

        // Sync to Firestore user document
        await setDoc(doc(db, 'users', userProfile.uid), {
          avatarUrl: downloadURL
        }, { merge: true }).catch(() => {});

        // Update with remote cloud URL if storage upload succeeded
        if (downloadURL !== currentPreview && updateProfileAvatar) {
          updateProfileAvatar(downloadURL);
        }
      } catch (err) {
        console.warn("Background avatar sync note:", err);
      }
    })();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in font-sans">
      <div className="relative w-full max-w-md bg-[#1e1f20] border border-neutral-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Background Glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-gray-100">
              {selectedImage ? "Customize Profile Picture" : "Profile & Connections"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-[#282a2c] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {selectedImage ? (
          /* Circular Avatar Customizer View */
          <div className="space-y-5 text-center">
            <div>
              <p className="text-xs font-medium text-gray-300">
                Drag to adjust position or use zoom & directional controls
              </p>
            </div>
            
            {/* Interactive Circular Preview */}
            <div 
              className="relative w-44 h-44 sm:w-48 sm:h-48 mx-auto rounded-full overflow-hidden border-2 border-blue-500 shadow-2xl bg-[#131314] cursor-grab active:cursor-grabbing select-none group touch-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {previewUrl ? (
                <img 
                  src={previewUrl} 
                  alt="Avatar Preview" 
                  className="w-full h-full object-cover pointer-events-none" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                  Loading preview...
                </div>
              )}

              {/* Hover overlay hint */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center pointer-events-none text-white gap-1">
                <Move className="w-6 h-6 text-blue-400 animate-pulse" />
                <span className="text-[10px] font-semibold">Drag to Pan</span>
              </div>
            </div>

            <canvas ref={canvasRef} className="hidden" />

            {/* Zoom Controls */}
            <div className="bg-[#131314] p-3 rounded-2xl border border-neutral-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-300 font-medium px-1">
                <span className="flex items-center gap-1.5">
                  <ZoomIn className="w-3.5 h-3.5 text-blue-400" />
                  <span>Zoom Level</span>
                </span>
                <span className="font-mono text-blue-400 font-bold">{Math.round(zoomLevel * 100)}%</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.max(1, +(prev - 0.1).toFixed(2)))}
                  className="p-1.5 rounded-full bg-[#1e1f20] hover:bg-[#282a2c] text-gray-300 transition-colors border border-neutral-800 shrink-0 active:scale-95"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={zoomLevel}
                  onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer h-1.5 bg-[#282a2c] rounded-lg appearance-none"
                />
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.min(3, +(prev + 0.1).toFixed(2)))}
                  className="p-1.5 rounded-full bg-[#1e1f20] hover:bg-[#282a2c] text-gray-300 transition-colors border border-neutral-800 shrink-0 active:scale-95"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Directional Position Controls (Up, Down, Left, Right & Reset) */}
            <div className="bg-[#131314] p-3 rounded-2xl border border-neutral-800/80 flex items-center justify-between gap-2">
              <div className="text-left space-y-0.5 min-w-0">
                <p className="text-xs font-bold text-gray-200">Position Controls</p>
                <p className="text-[10px] text-gray-400">Pan up, down, left & right</p>
              </div>

              {/* Compact Directional D-Pad */}
              <div className="bg-[#1e1f20] p-1.5 rounded-2xl border border-neutral-800 shrink-0">
                <div className="grid grid-cols-3 gap-1">
                  <div />
                  <button
                    type="button"
                    onClick={() => handlePan(0, -15)}
                    className="p-1.5 rounded-lg bg-[#282a2c] hover:bg-blue-600 text-gray-200 hover:text-white transition-colors active:scale-95 flex items-center justify-center"
                    title="Pan Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <div />

                  <button
                    type="button"
                    onClick={() => handlePan(-15, 0)}
                    className="p-1.5 rounded-lg bg-[#282a2c] hover:bg-blue-600 text-gray-200 hover:text-white transition-colors active:scale-95 flex items-center justify-center"
                    title="Pan Left"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="p-1.5 rounded-lg bg-[#131314] hover:bg-neutral-700 text-amber-400 transition-colors active:scale-95 flex items-center justify-center"
                    title="Reset Zoom & Position"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePan(15, 0)}
                    className="p-1.5 rounded-lg bg-[#282a2c] hover:bg-blue-600 text-gray-200 hover:text-white transition-colors active:scale-95 flex items-center justify-center"
                    title="Pan Right"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <div />
                  <button
                    type="button"
                    onClick={() => handlePan(0, 15)}
                    className="p-1.5 rounded-lg bg-[#282a2c] hover:bg-blue-600 text-gray-200 hover:text-white transition-colors active:scale-95 flex items-center justify-center"
                    title="Pan Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <div />
                </div>
              </div>
            </div>

            {/* Hidden Input for re-selecting file */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Footer Action Buttons */}
            <div className="flex items-center justify-center gap-2 pt-1 flex-wrap sm:flex-nowrap">
              <button
                type="button"
                onClick={() => {
                  setSelectedImage(null);
                  handleReset();
                }}
                className="px-3.5 py-2 rounded-full text-xs font-medium bg-[#131314] text-gray-400 hover:text-white border border-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={triggerFileInput}
                className="px-3.5 py-2 rounded-full text-xs font-medium bg-[#131314] text-gray-300 hover:text-white border border-neutral-800 transition-colors"
              >
                Change Photo
              </button>
              <button
                type="button"
                onClick={handleSaveAvatar}
                disabled={isUploading}
                className="px-4 py-2 rounded-full text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md flex items-center gap-1.5 disabled:opacity-50 transition-all active:scale-95"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : uploadSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Save Avatar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Main Profile & Connections View */
          <div className="space-y-6 text-center">
            {/* Avatar with Camera Overlay */}
            <div className="relative w-24 h-24 mx-auto group cursor-pointer" onClick={triggerFileInput}>
              <img
                src={userProfile?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${userProfile?.username}`}
                alt={userProfile?.displayName}
                className="w-full h-full rounded-full object-cover bg-[#131314] border-2 border-neutral-700/60 p-0.5 shadow-lg group-hover:border-blue-500 transition-colors"
              />
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* User Info Display */}
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white tracking-tight">
                {userProfile?.displayName || userProfile?.email}
              </h3>
              <p className="text-xs text-gray-400 flex items-center justify-center gap-1 mt-1">
                <Mail className="w-3.5 h-3.5 text-gray-500" />
                <span>{userProfile?.email}</span>
              </p>
            </div>

            {/* Dedicated Connections / Friends Section */}
            <div className="bg-[#131314] border border-neutral-800/80 rounded-2xl p-4 text-left space-y-3 shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider">
                    My Connections ({friendsList.length})
                  </h4>
                </div>
              </div>

              {isLoadingFriends ? (
                <p className="text-xs text-gray-400 text-center py-2">Loading connections...</p>
              ) : friendsList.length > 0 ? (
                <div className="space-y-2 max-h-44 overflow-y-auto custom-scrollbar pr-1">
                  {friendsList.map(friend => {
                    const isSelected = activeFriendUser?.uid === friend.uid;
                    return (
                      <div
                        key={friend.uid}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                          isSelected
                            ? 'bg-blue-600/20 border-blue-500/50 text-white font-medium'
                            : 'bg-[#1e1f20] border-neutral-800 text-gray-200 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <img
                            src={friend.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${friend.email}`}
                            alt={friend.displayName || friend.email}
                            className="w-7 h-7 rounded-full bg-[#131314] shrink-0 border border-neutral-700/40 p-0.5"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-gray-100 truncate">
                              {friend.displayName || friend.email}
                            </p>
                            <p className="text-[10px] text-gray-400 truncate">
                              {friend.email}
                            </p>
                          </div>
                        </div>

                        {onSelectFriend && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectFriend(friend);
                              onClose();
                            }}
                            className="px-3 py-1 rounded-full text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-all shrink-0 active:scale-95"
                          >
                            View Profile
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-3 text-gray-500 space-y-1">
                  <Users className="w-5 h-5 text-gray-600 mx-auto opacity-50" />
                  <p className="text-xs">No active connections yet</p>
                </div>
              )}
            </div>

            {/* Dedicated Pending Friend Requests Section */}
            <div className="bg-[#131314] border border-neutral-800/80 rounded-2xl p-4 text-left space-y-3 shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-400" />
                  <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider">
                    Friend Requests ({pendingRequests.length})
                  </h4>
                </div>
                {pendingRequests.length > 0 && (
                  <span className="bg-blue-500/20 text-blue-300 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold animate-pulse">
                    Action Needed
                  </span>
                )}
              </div>

              {isLoadingRequests ? (
                <p className="text-xs text-gray-400 text-center py-2">Checking requests...</p>
              ) : pendingRequests.length > 0 ? (
                <div className="space-y-2 max-h-44 overflow-y-auto custom-scrollbar pr-1">
                  {pendingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="bg-[#1e1f20] p-3 rounded-xl border border-neutral-800 flex items-center justify-between gap-3 shadow-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-100 truncate">
                          {req.senderDisplayName || req.senderEmail}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate">
                          {req.senderEmail}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAccept(req)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-md flex items-center gap-1 active:scale-95"
                          title="Accept Friend Request"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDecline(req.id)}
                          className="bg-[#282a2c] hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 px-2.5 py-1.5 rounded-full text-xs font-medium border border-neutral-700/50 transition-all flex items-center gap-1 active:scale-95"
                          title="Decline Request"
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-3 text-gray-500 space-y-1">
                  <CheckCircle2 className="w-5 h-5 text-gray-600 mx-auto" />
                  <p className="text-xs">No pending friend requests</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={triggerFileInput}
                className="w-full py-2.5 px-4 rounded-full text-xs font-medium bg-[#131314] hover:bg-[#282a2c] text-gray-200 border border-neutral-800 transition-all flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4 text-blue-400" />
                <span>Upload Profile Photo</span>
              </button>

              <button
                type="button"
                onClick={logout}
                className="w-full py-2.5 px-4 rounded-full text-xs font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
