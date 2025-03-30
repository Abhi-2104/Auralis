import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Amplify } from 'aws-amplify';
import { get, post, put, del } from 'aws-amplify/api';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import awsExports from '../../src/aws-exports';
import { motion } from 'framer-motion';
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
  const fetchSongs = useCallback(async (genre = 'All', token = null) => {
    try {
      const apiName = 'auralisapi';
      let path = '/api/songs';
      const queryParams = {};
      
      if (genre && genre !== 'All') {
        queryParams.genre = genre;
      }
      
      if (token) {
        queryParams.nextToken = token;
      }
      
      // Add query params to path
      if (Object.keys(queryParams).length > 0) {
        const queryString = new URLSearchParams(queryParams).toString();
        path = `${path}?${queryString}`;
      }
      
      // Updated API call
      const response = await get({ apiName, path });
      
      if (!token) {
        setSongs(response.songs);
      } else {
        setSongs(prev => [...prev, ...response.songs]);
      }
      
      setNextToken(response.nextToken);
      setHasMore(!!response.nextToken);
    } catch (error) {
      console.error('Error fetching songs:', error);
      setError('Failed to load songs. Please try again later.');
    }
  }, []);

  // Fetch playlists for the add to playlist modal
  const fetchPlaylists = useCallback(async () => {
    try {
      const apiName = 'auralisapi';
      const path = '/api/playlists';
      // Updated API call
      const response = await get({ apiName, path });
      setPlaylists(response);
    } catch (error) {
      console.error('Error fetching playlists:', error);
      // Don't set error here to avoid confusion with song loading errors
    }
  }, []);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  useEffect(() => {
    if (user) {
      fetchSongs(selectedGenre);
      fetchPlaylists();
    }
  }, [user, selectedGenre, fetchSongs, fetchPlaylists]);

  const handleSignOut = async () => {
    const confirmSignOut = confirm('Are you sure you want to sign out?');
    if (confirmSignOut) {
      try {
        await signOut();
        router.push('/login');
      } catch (err) {
        console.error('Error signing out:', err);
      }
    }
  };

  const handleGenreChange = (genre) => {
    setSelectedGenre(genre);
    setSongs([]);
    setNextToken(null);
    setHasMore(true);
  };

  const handleLoadMore = () => {
    if (nextToken && hasMore) {
      fetchSongs(selectedGenre, nextToken);
    }
  };

  const openAddToPlaylistModal = (song) => {
    setSelectedSong(song);
    setShowPlaylistModal(true);
  };

  const handleAddToPlaylist = async (playlistId) => {
    if (!selectedSong || !playlistId) return;
    
    setAddingSong(true);
    try {
      const apiName = 'auralisapi';
      const path = '/api/playlists/add-song';
      // Updated API call
      await post({
        apiName, 
        path,
        options: {
          body: {
            playlistId,
            songId: selectedSong.id
          },
          headers: { 'Content-Type': 'application/json' }
        }
      });
      
      // Show success message
      alert(`"${selectedSong.title}" added to playlist!`);
      setShowPlaylistModal(false);
    } catch (error) {
      console.error('Error adding song to playlist:', error);
      alert('Failed to add song to playlist. Please try again.');
    } finally {
      setAddingSong(false);
    }
  };

  if (loading) {
    return (
      <motion.div
        className={styles.loaderContainer}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className={styles.spinner}></div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={styles.container}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      <header className={styles.header}>
        <Link href="/">
          <div className={styles.logo}>AURALIS</div>
        </Link>
        <nav className={styles.nav}>
          <Link href="/playlists">
            <span className={styles.navLink}>Your Playlists</span>
          </Link>
          <span className={`${styles.navLink} ${styles.navLinkActive}`}>
            Explore Music
          </span>
        </nav>
        <button className={styles.signOutButton} onClick={handleSignOut}>
          Sign Out
        </button>
      </header>

      <h1 className={styles.title}>Explore Music</h1>
      <p className={styles.description}>
        Discover new songs and add them to your playlists
      </p>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.filters}>
        {GENRES.map(genre => (
          <button
            key={genre}
            className={`${styles.filterButton} ${selectedGenre === genre ? styles.filterButtonActive : ''}`}
            onClick={() => handleGenreChange(genre)}
          >
            {genre}
          </button>
        ))}
      </div>

      {songs.length > 0 ? (
        <div className={styles.songGrid}>
          {songs.map((song, index) => (
            <motion.div
              key={song.id}
              className={styles.songCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className={styles.songImage}>
                {song.imageUrl ? (
                  <img src={song.imageUrl} alt={song.title} />
                ) : (
                  <div className={styles.songImagePlaceholder}>♪</div>
                )}
                <div className={styles.playButton}>
                  <div className={styles.playIcon}></div>
                </div>
              </div>
              <div className={styles.songInfo}>
                <h3 className={styles.songTitle}>{song.title}</h3>
                <p className={styles.songArtist}>{song.artist}</p>
                <button 
                  className={styles.addButton}
                  onClick={() => openAddToPlaylistModal(song)}
                >
                  Add to Playlist
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <p>No songs found. Try a different genre filter.</p>
        </div>
      )}

      {hasMore && (
        <button 
          className={`${styles.button} ${styles.loadMore}`}
          onClick={handleLoadMore}
        >
          Load More
        </button>
      )}

      {/* Add to Playlist Modal */}
      {showPlaylistModal && (
        <div className={styles.modalOverlay}>
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <h3 className={styles.modalTitle}>
              Add "{selectedSong?.title}" to Playlist
            </h3>
            
            {playlists.length > 0 ? (
              <div className={styles.playlistOptions}>
                {playlists.map(playlist => (
                  <button
                    key={playlist.id}
                    className={styles.playlistOption}
                    onClick={() => handleAddToPlaylist(playlist.id)}
                    disabled={addingSong}
                  >
                    {playlist.name}
                  </button>
                ))}
              </div>
            ) : (
              <p>You don't have any playlists yet. Create one first!</p>
            )}
            
            <div className={styles.modalActions}>
              <button
                className={`${styles.button} ${styles.cancelButton}`}
                onClick={() => setShowPlaylistModal(false)}
                disabled={addingSong}
              >
                Cancel
              </button>
              <Link href="/playlists">
                <button className={styles.button} disabled={addingSong}>
                  Create New Playlist
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}