import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Amplify } from 'aws-amplify';
import { get, post } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import awsExports from '../../src/aws-exports';
import styles from '../styles/explore.module.css';

Amplify.configure(awsExports);

export default function Explore() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // New state variables for playlist modal
  const [selectedSongForPlaylist, setSelectedSongForPlaylist] = useState(null);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [addingSong, setAddingSong] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  
  const router = useRouter();

  const genres = ['all', 'pop', 'rock', 'hip-hop', 'electronic', 'classical', 'jazz'];

  // Fetch songs when component mounts or genre changes
  useEffect(() => {
    fetchSongs();
  }, [selectedGenre]);

  const fetchSongs = async () => {
    setLoading(true);
    try {
      console.log(`Fetching songs for genre: ${selectedGenre}`);
      
      let path = '/songs';
      if (selectedGenre !== 'all') {
        path += `?genre=${selectedGenre}`;
      }

      const response = await get({
        apiName: 'auralisapi',
        path
      }).response;
      
      // Parse the response body as JSON
      const responseBody = await response.body.json();
      console.log('API response:', responseBody);
      
      if (responseBody && responseBody.songs) {
        console.log(`Fetched ${responseBody.songs.length} songs`);
        setSongs(responseBody.songs);
      } else {
        console.log('No songs returned or unexpected response format:', responseBody);
        setSongs([]);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching songs:', err);
      setError('Failed to load songs. Please try again.');
      setSongs([]);
    } finally {
      setLoading(false);
    }
  };

  // New function to fetch user playlists
  const fetchUserPlaylists = async () => {
    setLoadingPlaylists(true);
    try {
      const response = await get({
        apiName: 'auralisapi',
        path: '/api/playlists'
      });
      
      let playlistsData = response;
      
      // Handle if response has a body property
      if (response && response.body) {
        try {
          playlistsData = await response.body.json();
        } catch (e) {
          console.error("Error parsing response body:", e);
          playlistsData = response;
        }
      }
      
      // Ensure playlists is always an array
      const safePlaylistsData = Array.isArray(playlistsData) ? playlistsData : 
                              (playlistsData ? [playlistsData] : []);
      
      setPlaylists(safePlaylistsData);
    } catch (error) {
      console.error('Error fetching playlists:', error);
      setPlaylists([]);
    } finally {
      setLoadingPlaylists(false);
    }
  };

  const handleGenreChange = (genre) => {
    setSelectedGenre(genre);
    // fetchSongs will be called by useEffect
  };

  const playSong = async (song) => {
    console.log(`Playing song: ${song.title}`);
    
    try {
      // Show song immediately in player with loading state
      setCurrentSong({
        ...song,
        // Use null instead of empty string to avoid browser warning
        audioUrl: null
      });
      
      // Check if this is an S3 URL that needs signing
      if (song.audioUrl && song.audioUrl.startsWith('s3://')) {
        console.log('Getting signed URL for S3 path:', song.audioUrl);
        
        try {
            // Call the streamSong Lambda function via API Gateway
            const response = await get({
              apiName: 'auralisapi',
              path: `/stream-song/${song.id}`  // This should match the existing path
            }).response;
          
          
          const responseData = await response.body.json();
          console.log('Stream song response:', responseData);
          
          if (responseData && responseData.signedUrl) {
            // Update the song with the playable HTTPS URL
            setCurrentSong({
              ...song,
              audioUrl: responseData.signedUrl
            });
            setIsPlaying(true);
          } else {
            console.error('No signed URL returned from API');
            // Show error state in player
            setError('Unable to play this song - no URL returned');
          }
        } catch (apiError) {
          console.error('API error getting signed URL:', apiError);
          
          // Use a placeholder URL for audio to avoid player errors
          if (process.env.NODE_ENV === 'development') {
            // Only in development, use a sample URL so we can test UI
            setCurrentSong({
              ...song,
              audioUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0d438fb04.mp3'
            });
          } else {
            setError('Unable to stream this song');
          }
        }
      } else if (song.audioUrl && song.audioUrl.startsWith('http')) {
        // If it's already an HTTP URL, we can use it directly
        setIsPlaying(true);
      } else {
        // No usable URL
        setError('This song does not have a playable URL');
      }
    } catch (err) {
      console.error('Error getting signed URL:', err);
    }
  };

  // Updated function to show playlist selection modal
  const addToPlaylist = async (song, event) => {
    // Prevent event propagation if it's a button inside a card
    if (event) {
      event.stopPropagation();
    }
    
    // Set the selected song and show the modal
    setSelectedSongForPlaylist(song);
    
    // Fetch user's playlists before showing modal
    await fetchUserPlaylists();
    setShowPlaylistModal(true);
  };
  
  // New function to handle adding song to selected playlist
  const handleAddToPlaylist = async (playlistId) => {
    if (!selectedSongForPlaylist || !playlistId) return;
    
    setAddingSong(true);
    try {
      const response = await post({
        apiName: 'auralisapi',
        path: '/api/add-song', // Updated path to match Lambda function
        options: {
          body: {
            playlistId: playlistId,
            songId: selectedSongForPlaylist.id
          },
          headers: { 'Content-Type': 'application/json' }
        }
      });
      
      // Rest of the function remains the same
      // ...
      
      // Try to parse the response body
      let responseData = response;
      if (response && response.body) {
        try {
          responseData = await response.body.json();
        } catch (e) {
          console.error("Error parsing response body:", e);
        }
      }
      
      console.log('Song added to playlist:', responseData);
      
      // Show success message
      setAddSuccess(true);
      setTimeout(() => {
        setAddSuccess(false);
        setShowPlaylistModal(false);
      }, 1500);
// Add this near the error handling section in handleAddToPlaylist
} catch (error) {
  console.error('Error adding song to playlist:', error);
  
  // Log detailed request information for debugging
  console.error('Request details:', {
    path: '/api/addSongToPlaylist',
    playlistId,
    songId: selectedSongForPlaylist.id
  });
  
  // More detailed error message based on response status
  if (error.response) {
    if (error.response.status === 403) {
      setError("You don't have permission to modify this playlist");
    } else if (error.response.status === 404) {
      setError("Playlist or song not found");
    } else {
      setError(`Failed to add song to playlist: ${error.response.data?.message || 'Unknown error'}`);
    }
  } else {
    setError('Failed to add song to playlist. Please try again.');
  }
} finally {
  setAddingSong(false);
}
  };
  return (
    <motion.div 
      className={styles.container}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <header className={styles.header}>
        <div className={styles.logo}>AURALIS</div>
        <nav className={styles.nav}>
          <Link href="/">Home</Link>
          <Link href="/explore" className={styles.active}>Explore</Link>
          <Link href="/library">Library</Link>
        </nav>
      </header>

      <main className={styles.main}>
        <h1 className={styles.title}>Explore Music</h1>

        <div className={styles.genreSelector}>
          {genres.map(genre => (
            <button
              key={genre}
              className={`${styles.genreButton} ${selectedGenre === genre ? styles.active : ''}`}
              onClick={() => handleGenreChange(genre)}
            >
              {genre.charAt(0).toUpperCase() + genre.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className={styles.loaderContainer}>
            <div className={styles.spinner}></div>
          </div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : songs.length === 0 ? (
          <div className={styles.noResults}>
            <p>No songs found.</p>
            <p>Try a different genre or upload some music!</p>
          </div>
        ) : (
          <div className={styles.songGrid}>
            {songs.map((song) => (
              <motion.div 
                key={song.id}
                className={styles.songCard}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                onClick={() => playSong(song)}
              >
                <div className={styles.songImageContainer}>
                  <img 
                    src={song.imageUrl || '/images/default-album.png'} 
                    alt={song.title} 
                    className={styles.songImage}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/default-album.png';
                    }}
                  />
                  <button 
                    className={styles.playButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      playSong(song);
                    }}
                  >
                    ▶
                  </button>
                </div>
                <div className={styles.songInfo}>
                  <h3>{song.title || 'Unknown Title'}</h3>
                  <p>{song.artist || 'Unknown Artist'}</p>
                </div>
                <button
                  className={styles.addButton}
                  onClick={(e) => addToPlaylist(song, e)}
                >
                  +
                </button>
              </motion.div>
            ))}
          </div>
        )}
        
        {/* Simple Audio Player */}
        {currentSong && (
          <div className={styles.audioPlayerContainer || 'audioPlayerContainer'}>
            <div className={styles.nowPlaying || 'nowPlaying'}>
              <img 
                src={currentSong.imageUrl || '/images/default-album.png'} 
                alt={currentSong.title}
                className={styles.miniCover || 'miniCover'}
                onError={(e) => {
                  e.target.onerror = null; 
                  e.target.src = '/images/default-album.png';
                }}
              />
              <div className={styles.songDetails || 'songDetails'}>
                <p className={styles.nowPlayingTitle || 'nowPlayingTitle'}>
                  {currentSong.title || 'Unknown Title'}
                </p>
                <p className={styles.nowPlayingArtist || 'nowPlayingArtist'}>
                  {currentSong.artist || 'Unknown Artist'}
                </p>
              </div>
            </div>
            <audio 
              controls 
              autoPlay
              src={currentSong.audioUrl || undefined} 
              className={styles.audioElement || 'audioElement'}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onError={(e) => {
                console.error('Audio playback error:', e);
                // Don't add fallback URL here as it can cause infinite loops
              }}
            />
          </div>
        )}
        
        {/* Playlist Selection Modal */}
        <AnimatePresence>
          {showPlaylistModal && (
            <motion.div 
              className={styles.modalOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div 
                className={styles.modal}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
              >
                <button 
                  className={styles.closeModal}
                  onClick={() => setShowPlaylistModal(false)}
                >
                  ✕
                </button>
                <h3 className={styles.modalTitle}>
                  {addSuccess 
                    ? "Song Added!" 
                    : `Add "${selectedSongForPlaylist?.title}" to Playlist`}
                </h3>
                
                {addSuccess ? (
                  <div className={styles.successMessage}>
                    <div className={styles.checkmark}>✓</div>
                    <p>Song added to playlist successfully!</p>
                  </div>
                ) : (
                  <>
                    {loadingPlaylists ? (
                      <div className={styles.spinnerContainer}>
                        <div className={styles.spinner}></div>
                      </div>
                    ) : playlists.length === 0 ? (
                      <div className={styles.noPlaylists}>
                        <p>You don't have any playlists yet.</p>
                        <Link href="/playlists">
                          <button className={styles.createPlaylistButton}>
                            Create a Playlist
                          </button>
                        </Link>
                      </div>
                    ) : (
                      <div className={styles.playlistList}>
                        {playlists.map(playlist => (
  <button
    key={playlist.id || `playlist-${Math.random().toString()}`}
    className={styles.playlistSelectButton}
    onClick={() => handleAddToPlaylist(playlist.id)}
    disabled={addingSong}
  >
    <div className={styles.playlistSelectImage}>
      <div className={styles.playlistImagePlaceholder}>♪</div>
    </div>
    <div className={styles.playlistSelectInfo}>
      <h4>{playlist.name}</h4>
      <p>{playlist.songs?.length || 0} songs</p>
    </div>
    {addingSong && (
      <div className={styles.miniSpinner}></div>
    )}
  </button>
))}
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className={styles.footer}>
        <p>© 2025 Auralis. All rights reserved.</p>
      </footer>

      <style jsx>{`
        .audioPlayerContainer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background-color: rgba(18, 18, 18, 0.95);
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 1000;
          box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.3);
        }
        .nowPlaying {
          display: flex;
          align-items: center;
          flex: 1;
          min-width: 0;
          margin-right: 16px;
        }
        .miniCover {
          width: 56px;
          height: 56px;
          border-radius: 4px;
          margin-right: 16px;
          object-fit: cover;
        }
        .songDetails {
          min-width: 0;
        }
        .nowPlayingTitle {
          font-weight: 600;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .nowPlayingArtist {
          font-size: 0.85rem;
          color: #b3b3b3;
          margin: 4px 0 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .audioElement {
          flex: 2;
          max-width: 600px;
        }
        
        /* Modal styles */
        .modalOverlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          backdrop-filter: blur(4px);
        }
        
        .modal {
          background-color: #282828;
          border-radius: 8px;
          padding: 24px;
          width: 90%;
          max-width: 500px;
          max-height: 80vh;
          overflow-y: auto;
          position: relative;
        }
        
        .closeModal {
          position: absolute;
          top: 16px;
          right: 16px;
          background: none;
          border: none;
          color: #b3b3b3;
          font-size: 18px;
          cursor: pointer;
        }
        
        .closeModal:hover {
          color: white;
        }
        
        .modalTitle {
          margin-top: 0;
          margin-bottom: 24px;
          font-size: 1.4rem;
        }
        
        .playlistList {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .playlistSelectButton {
          display: flex;
          align-items: center;
          padding: 10px;
          background-color: rgba(255, 255, 255, 0.05);
          border: none;
          border-radius: 6px;
          color: white;
          cursor: pointer;
          text-align: left;
          transition: background-color 0.2s ease;
        }
        
        .playlistSelectButton:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .playlistSelectImage {
          width: 48px;
          height: 48px;
          margin-right: 16px;
          border-radius: 4px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #333;
          color: #fff;
          font-size: 24px;
        }
        
        .playlistSelectInfo {
          flex: 1;
        }
        
        .playlistSelectInfo h4 {
          margin: 0;
          font-weight: 500;
        }
        
        .playlistSelectInfo p {
          margin: 4px 0 0;
          font-size: 0.85rem;
          color: #b3b3b3;
        }
        
        .noPlaylists {
          text-align: center;
          padding: 24px 0;
        }
        
        .createPlaylistButton {
          background-color: var(--accent-color, #1DB954);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 20px;
          font-weight: 600;
          margin-top: 16px;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        
        .createPlaylistButton:hover {
          background-color: var(--accent-hover-color, #1ed760);
        }
        
        .spinnerContainer {
          display: flex;
          justify-content: center;
          padding: 32px 0;
        }
        
        .successMessage {
          text-align: center;
          padding: 24px 0;
        }
        
        .checkmark {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background-color: var(--accent-color, #1DB954);
          color: white;
          font-size: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }
        
        .miniSpinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .audioPlayerContainer {
            flex-direction: column;
            padding: 12px;
          }
          .nowPlaying {
            margin-right: 0;
            margin-bottom: 12px;
            width: 100%;
          }
          .audioElement {
            width: 100%;
          }
          .modal {
            width: 95%;
            padding: 16px;
          }
        }
      `}</style>
    </motion.div>
  );
}