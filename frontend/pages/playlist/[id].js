import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Amplify } from 'aws-amplify';
import { get } from 'aws-amplify/api';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import awsExports from '../../../src/aws-exports';
import { motion } from 'framer-motion';
import styles from '../../styles/playlist.module.css';

Amplify.configure(awsExports);

export default function PlaylistDetail() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playlist, setPlaylist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [error, setError] = useState('');
  const router = useRouter();
  const { id } = router.query;

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

  // Fetch playlist details
  const fetchPlaylist = useCallback(async (playlistId) => {
    try {
      // Updated API call
      const response = await get({
        apiName: 'auralisapi',
        path: `/api/playlists/${playlistId}`
      });
      
      setPlaylist(response);
      
      // Fetch songs in the playlist
      if (response.songs && response.songs.length > 0) {
        await fetchPlaylistSongs(response.songs);
      }
    } catch (error) {
      console.error('Error fetching playlist:', error);
      setError('Failed to load playlist. Please try again later.');
    }
  }, []);

  // Fetch songs in the playlist
  const fetchPlaylistSongs = async (songIds) => {
    try {
      // Updated API calls
      const songPromises = songIds.map(songId => 
        get({
          apiName: 'auralisapi',
          path: `/api/songs/${songId}`
        })
      );
      
      const songResults = await Promise.all(songPromises);
      setSongs(songResults.filter(song => song)); // Filter out any failed requests
    } catch (error) {
      console.error('Error fetching songs:', error);
      setError('Failed to load some songs. Please try again later.');
    }
  };

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  useEffect(() => {
    if (user && id) {
      fetchPlaylist(id);
    }
  }, [user, id, fetchPlaylist]);

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

  // Format duration from seconds to MM:SS
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };

  if (loading || !playlist) {
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
        <nav>
          <Link href="/playlists">
            <span className={styles.navLink}>Your Playlists</span>
          </Link>
          <Link href="/songs">
            <span className={styles.navLink}>Explore Music</span>
          </Link>
        </nav>
        <button className={styles.signOutButton} onClick={handleSignOut}>
          Sign Out
        </button>
      </header>

      <div className={styles.playlistHeader}>
        <div className={styles.playlistImage}>
          <div className={styles.playlistImagePlaceholder}>♪</div>
        </div>
        <div className={styles.playlistHeaderInfo}>
          <h1 className={styles.title}>{playlist.name}</h1>
          {playlist.description && (
            <p className={styles.description}>{playlist.description}</p>
          )}
          <p className={styles.playlistMeta}>
            {songs.length} songs • Created by {user?.username || 'you'}
          </p>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {songs.length > 0 ? (
        <div className={styles.songList}>
          {songs.map((song, index) => (
            <motion.div
              key={song.id}
              className={styles.songItem}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className={styles.songNumber}>{index + 1}</div>
              <div className={styles.songInfo}>
                <h3 className={styles.songTitle}>{song.title}</h3>
                <p className={styles.songArtist}>{song.artist}</p>
              </div>
              <div className={styles.songDuration}>
                {song.duration ? formatDuration(song.duration) : '--:--'}
              </div>
              <div className={styles.songControls}>
                <button className={styles.playButton}>
                  <span className={styles.playIcon}></span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <p>This playlist is empty. Add songs from the Explore Music page.</p>
          <Link href="/songs">
            <button className={styles.button}>Find Songs</button>
          </Link>
        </div>
      )}
    </motion.div>
  );
}