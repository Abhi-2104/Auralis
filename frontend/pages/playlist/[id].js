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
  const [playlist, setPlaylist] = useState({});
  const [songs, setSongs] = useState([]);
  const [error, setError] = useState('');
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const router = useRouter();
  const { id } = router.query;

  // Check if user is authenticated
  const checkUser = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      if (id) {
        fetchPlaylist(id);
      }
    } catch (error) {
      console.error("Error checking user:", error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router, id]);

  // Fetch playlist details
  const fetchPlaylist = async (playlistId) => {
    try {
      const response = await get({
        apiName: 'auralisapi',
        path: `/api/playlists/${playlistId}`
      });
      
      // Process the response
      let playlistData = response;
      if (response && response.body) {
        try {
          playlistData = await response.body.json();
        } catch (e) {
          console.error("Error parsing response:", e);
        }
      }
      
      setPlaylist(playlistData);
      
      // If playlist has songs, fetch them
      if (playlistData.songs && playlistData.songs.length > 0) {
        await fetchPlaylistSongs(playlistData.songs);
      }
    } catch (error) {
      console.error('Error fetching playlist:', error);
      setError('Failed to load playlist. Please try again later.');
    }
  };

  // Fetch songs in the playlist
  const fetchPlaylistSongs = async (songIds) => {
    try {
      const songPromises = songIds.map(songId => 
        get({
          apiName: 'auralisapi',
          path: `/songs/${songId}`
        })
      );
      
      const songResults = await Promise.all(songPromises);
      setSongs(songResults.filter(song => song)); // Filter out any failed requests
    } catch (error) {
      console.error('Error fetching songs:', error);
      setError('Failed to load some songs. Please try again later.');
    }
  };

  // Play song function
  const handlePlaySong = async (song) => {
    try {
      // If song URLs are stored in S3 and need signed URLs
      const streamResponse = await get({
        apiName: 'auralisapi',
        path: `/stream-song/${song.id}`
      });
      
      let streamData = streamResponse;
      if (streamResponse && streamResponse.body) {
        try {
          streamData = await streamResponse.body.json();
        } catch (e) {
          console.error("Error parsing stream response:", e);
        }
      }
      
      if (streamData && streamData.signedUrl) {
        setCurrentlyPlaying({
          ...song,
          audioUrl: streamData.signedUrl
        });
      } else {
        // Fallback to direct URL if available
        setCurrentlyPlaying(song);
      }
    } catch (error) {
      console.error('Error playing song:', error);
      setError('Failed to play this song. Please try again.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  // Format duration helper
  const formatDuration = (seconds) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  useEffect(() => {
    if (id && !loading) {
      fetchPlaylist(id);
    }
  }, [id, loading]);

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
                <button 
                  className={styles.playButton}
                  onClick={() => handlePlaySong(song)}
                >
                  <span className={styles.playIcon}>▶</span>
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
      
      {/* Audio Player */}
      {currentlyPlaying && (
        <div className={styles.audioPlayerContainer}>
          <div className={styles.nowPlaying}>
            <img 
              src={currentlyPlaying.imageUrl || '/images/default-album.png'} 
              alt={currentlyPlaying.title}
              className={styles.miniCover}
            />
            <div className={styles.songDetails}>
              <p className={styles.nowPlayingTitle}>{currentlyPlaying.title}</p>
              <p className={styles.nowPlayingArtist}>{currentlyPlaying.artist}</p>
            </div>
          </div>
          <audio 
            controls 
            autoPlay
            src={currentlyPlaying.audioUrl}
            className={styles.audioPlayer}
            onEnded={() => setCurrentlyPlaying(null)}
          />
        </div>
      )}
    </motion.div>
  );
}