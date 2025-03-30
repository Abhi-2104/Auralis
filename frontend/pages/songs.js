import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Amplify } from 'aws-amplify';
import { get, post } from 'aws-amplify/api';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import awsExports from '../../src/aws-exports';
import { motion, AnimatePresence } from 'framer-motion';
import AudioPlayer from '../components/AudioPlayer';
import styles from '../styles/songs.module.css';

Amplify.configure(awsExports);

// Genre filters
const GENRES = ['All', 'Pop', 'Rock', 'Hip Hop', 'Electronic', 'Classical', 'Jazz', 'R&B', 'Country'];

export default function Songs() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [songs, setSongs] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [nextToken, setNextToken] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);
  const [addingSong, setAddingSong] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null); // Add this state
  const router = useRouter();

  // Check if user is authenticated
  const checkUser = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setLoading(false);
    } catch (error) {
      console.error("Error checking user:", error);
      router.push('/login');
    }
  }, [router]);

  // Fetch songs
  const fetchSongs = useCallback(async (genre = selectedGenre, token = null, reset = false) => {
    try {
      setLoading(true);
      let path = '/api/songs';
      const queryParams = {};
      
      if (genre && genre !== 'All') {
        queryParams.genre = genre;
      }
      
      if (token) {
        queryParams.nextToken = token;
      }
      
      // Add query parameters to the path
      if (Object.keys(queryParams).length > 0) {
        const queryString = new URLSearchParams(queryParams).toString();
        path = `${path}?${queryString}`;
      }
      
      const response = await get({
        apiName: 'auralisapi',
        path
      });
      
      if (response) {
        if (reset) {
          setSongs(response.songs || []);
        } else {
          setSongs(prev => [...prev, ...(response.songs || [])]);
        }
        
        // Update pagination token
        setNextToken(response.nextToken || null);
        setHasMore(!!response.nextToken);
      }
    } catch (error) {
      console.error('Error fetching songs:', error);
      setError('Failed to load songs. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedGenre]);

  // Fetch playlists
  const fetchPlaylists = useCallback(async () => {
    try {
      const response = await get({
        apiName: 'auralisapi',
        path: '/api/playlists'
      });
      
      if (response) {
        setPlaylists(response);
      }
    } catch (error) {
      console.error('Error fetching playlists:', error);
      // We don't want to show an error for playlists fetch
      // as it's not critical to this page's function
      setPlaylists([]);
    }
  }, []);

  // Handle genre filter change
  const handleGenreChange = (genre) => {
    setSelectedGenre(genre);
    fetchSongs(genre, null, true);
  };

  // Handle load more
  const handleLoadMore = () => {
    if (hasMore && nextToken) {
      fetchSongs(selectedGenre, nextToken);
    }
  };

  // Handle play song
  const handlePlaySong = (song) => {
    setCurrentlyPlaying(song.id);
  };

  // Handle stop playing
  const handleStopPlaying = () => {
    setCurrentlyPlaying(null);
  };

  // Handle add to playlist
  const handleAddToPlaylist = (song) => {
    setSelectedSong(song);
    setShowPlaylistModal(true);
  };

  // Handle add song to playlist
  const addSongToPlaylist = async (playlistId) => {
    if (!selectedSong || !playlistId) return;
    
    try {
      setAddingSong(true);
      
      await post({
        apiName: 'auralisapi',
        path: '/api/playlists/add-song',
        options: {
          body: {
            playlistId,
            songId: selectedSong.id
          }
        }
      });
      
      // Close modal and reset state
      setShowPlaylistModal(false);
      setSelectedSong(null);
      // Show success notification here if you have one
    } catch (error) {
      console.error('Error adding song to playlist:', error);
      setError('Failed to add song to playlist. Please try again.');
    } finally {
      setAddingSong(false);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Initial data loading
  useEffect(() => {
    checkUser();
  }, [checkUser]);

  useEffect(() => {
    if (user) {
      fetchSongs(selectedGenre, null, true);
      fetchPlaylists();
    }
  }, [user, fetchSongs, fetchPlaylists]);

  if (loading && songs.length === 0) {
    return (
      <div className={styles.loaderContainer}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/">
          <div className={styles.logo}>AURALIS</div>
        </Link>
        <nav>
          <Link href="/playlists">
            <span className={styles.navLink}>Your Playlists</span>
          </Link>
          <Link href="/explore">
            <span className={styles.navLink}>Explore</span>
          </Link>
        </nav>
        <button className={styles.signOutButton} onClick={handleSignOut}>
          Sign Out
        </button>
      </header>

      <main className={styles.main}>
        <h1 className={styles.title}>Music Library</h1>

        {/* Genre filter buttons */}
        <div className={styles.genreFilter}>
          {GENRES.map(genre => (
            <button
              key={genre}
              className={`${styles.genreButton} ${selectedGenre === genre ? styles.active : ''}`}
              onClick={() => handleGenreChange(genre)}
            >
              {genre}
            </button>
          ))}
        </div>

        {/* Error message */}
        {error && <div className={styles.error}>{error}</div>}

        {/* Now Playing section */}
        <AnimatePresence>
          {currentlyPlaying && (
            <motion.div 
              className={styles.nowPlaying}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ type: "spring", damping: 20 }}
            >
              <h2 className={styles.sectionTitle}>Now Playing</h2>
              <AudioPlayer 
                songId={currentlyPlaying} 
                onClose={handleStopPlaying}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Songs grid */}
        <div className={styles.songsGrid}>
          {songs.map(song => (
            <motion.div 
              key={song.id} 
              className={styles.songCard}
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", damping: 20 }}
            >
              <div className={styles.songImageContainer}>
                <img 
                  src={song.imageUrl || 'https://via.placeholder.com/300?text=Album+Art'} 
                  alt={song.title || 'Song'} 
                  className={styles.songImage}
                />
                <div className={styles.songOverlay}>
                  <button 
                    className={styles.playButton}
                    onClick={() => handlePlaySong(song)}
                  >
                    ▶
                  </button>
                  <button 
                    className={styles.addToPlaylistButton}
                    onClick={() => handleAddToPlaylist(song)}
                  >
                    +
                  </button>
                </div>
              </div>
              <h3 className={styles.songTitle}>{song.title || 'Untitled'}</h3>
              <p className={styles.songArtist}>{song.artist || 'Unknown Artist'}</p>
            </motion.div>
          ))}

          {/* Loading more indicator */}
          {loading && songs.length > 0 && (
            <div className={styles.loadingMore}>
              <div className={styles.spinnerSmall}></div>
              <span>Loading more songs...</span>
            </div>
          )}
        </div>

        {/* Load more button */}
        {hasMore && !loading && (
          <div className={styles.loadMoreContainer}>
            <button 
              className={styles.loadMoreButton}
              onClick={handleLoadMore}
            >
              Load More Songs
            </button>
          </div>
        )}

        {/* No songs message */}
        {!loading && songs.length === 0 && (
          <div className={styles.noContent}>
            <p>No songs found. Try a different genre filter or check back later!</p>
          </div>
        )}

        {/* Add to playlist modal */}
        {showPlaylistModal && selectedSong && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h3>Add to Playlist</h3>
                <button 
                  className={styles.closeModal}
                  onClick={() => setShowPlaylistModal(false)}
                >
                  ×
                </button>
              </div>
              <div className={styles.modalContent}>
                <p>Select a playlist to add "{selectedSong.title}":</p>
                
                {playlists.length === 0 ? (
                  <div className={styles.noPlaylists}>
                    <p>You don't have any playlists yet.</p>
                    <Link href="/playlists">
                      <button className={styles.createPlaylistButton}>
                        Create a Playlist
                      </button>
                    </Link>
                  </div>
                ) : (
                  <div className={styles.playlistsList}>
                    {playlists.map(playlist => (
                      <button
                        key={playlist.id}
                        className={styles.playlistItem}
                        onClick={() => addSongToPlaylist(playlist.id)}
                        disabled={addingSong}
                      >
                        {playlist.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className={styles.modalFooter}>
                <button 
                  className={styles.cancelButton}
                  onClick={() => setShowPlaylistModal(false)}
                  disabled={addingSong}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        <p>© 2025 Auralis. All rights reserved.</p>
      </footer>
    </div>
  );
}