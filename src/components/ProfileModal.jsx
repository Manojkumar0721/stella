import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { 
  fetchPendingRequests, acceptFriendRequest, declineFriendRequest 
} from '../services/socialService';
import { 
  X, Camera, Check, Upload, User, Mail, Sparkles, LogOut, Loader2, Bell, UserCheck, UserX, CheckCircle2 
} from 'lucide-react';

export default function ProfileModal({ onClose }) {
  const { userProfile, updateProfileAvatar, logout } = useAuth();
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [croppedImageBlob, setCroppedImageBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  // Load Pending Friend Requests
  const loadRequests = async () => {
    if (!userProfile) return;
    setIsLoadingRequests(true);
    const reqs = await fetchPendingRequests(userProfile.uid, userProfile.email);
    setPendingRequests(reqs);
    setIsLoadingRequests(false);
  };

  useEffect(() => {
    loadRequests();
  }, [userProfile]);

  const handleAccept = async (req) => {
    await acceptFriendRequest(req.id, req);
    loadRequests();
  };

  const handleDecline = async (reqId) => {
    await declineFriendRequest(reqId);
    loadRequests();
  };

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
      processCircularCrop(reader.result, 1);
    };
    reader.readAsDataURL(file);
  };

  // Perform HTML5 Canvas Circular Crop
  const processCircularCrop = (imageDataUrl, scale) => {
    const img = new Image();
    img.src = imageDataUrl;
    img.onload = () => {
      imageRef.current = img;
      const canvas = canvasRef.current || document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const size = 300;
      canvas.width = size;
      canvas.height = size;
      
      ctx.clearRect(0, 0, size, size);
      
      // Draw circular clip path
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      
      // Calculate aspect ratio crop
      const minDim = Math.min(img.width, img.height);
      const startX = (img.width - minDim) / 2;
      const startY = (img.height - minDim) / 2;
      
      ctx.drawImage(
        img,
        startX, startY, minDim, minDim,
        0, 0, size, size
      );
      
      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setPreviewUrl(croppedDataUrl);
    };
  };

  // Upload Cropped Avatar to Cloud Storage & Update Database
  const handleSaveAvatar = async () => {
    if (!previewUrl || !userProfile?.uid) return;
    setIsUploading(true);

    try {
      let downloadURL = previewUrl;

      // Attempt Cloud Storage Upload
      try {
        const avatarRef = ref(storage, `avatars/${userProfile.uid}_${Date.now()}.jpg`);
        await uploadString(avatarRef, previewUrl, 'data_url');
        downloadURL = await getDownloadURL(avatarRef);
      } catch (storageErr) {
        console.warn("Cloud Storage upload notice, using optimized base64 URL fallback:", storageErr);
      }

      // Update Firestore user document
      try {
        await updateDoc(doc(db, 'users', userProfile.uid), {
          avatarUrl: downloadURL
        });
      } catch (dbErr) {
        console.warn("Firestore profile update fallback:", dbErr);
      }

      // Update local state in AuthContext
      if (updateProfileAvatar) {
        updateProfileAvatar(downloadURL);
      }

      setUploadSuccess(true);
      setTimeout(() => {
        setSelectedImage(null);
        setUploadSuccess(false);
      }, 1500);
    } catch (err) {
      alert('Failed to save profile picture. Please try again.');
    } finally {
      setIsUploading(false);
    }
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
            <h2 className="text-sm font-bold text-gray-100">Profile & Requests</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-[#282a2c] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {selectedImage ? (
          /* Circular Cropper Preview View */
          <div className="space-y-5 text-center">
            <p className="text-xs font-medium text-gray-300">Adjust & Save Circular Avatar</p>
            
            <div className="relative w-36 h-36 mx-auto rounded-full overflow-hidden border-2 border-blue-500 shadow-xl bg-[#131314]">
              {previewUrl && (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="px-4 py-2 rounded-full text-xs font-medium bg-[#131314] text-gray-400 hover:text-white border border-neutral-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAvatar}
                disabled={isUploading}
                className="px-5 py-2 rounded-full text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md flex items-center gap-1.5 disabled:opacity-50"
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
          /* Main Profile Menu View */
          <div className="space-y-6 text-center">
            {/* Avatar with Camera Crop Overlay */}
            <div className="relative w-24 h-24 mx-auto group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
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
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-4 rounded-full text-xs font-medium bg-[#131314] hover:bg-[#282a2c] text-gray-200 border border-neutral-800 transition-all flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4 text-blue-400" />
                <span>Change Profile Photo</span>
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
