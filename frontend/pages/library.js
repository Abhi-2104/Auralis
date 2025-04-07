import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Amplify } from 'aws-amplify';
import { get, post, put, del } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import awsExports from '../../src/aws-exports';
import styles from '../styles/library.module.css';

Amplify.configure(awsExports);

export default function Library() {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await getCurrentUser();
        fetchPlaylists();
      } catch (error) {
        console.error("Authentication error:", error);
        router.push('/login');
      }
    };
    
    checkAuth();
  }, [router]);
  
  const fetchPlaylists = async () => {
    setLoading(true);
    try {
      // Updated API call using the new method
      const response = await get({apiName: 'auralisapi', path: '/api/playlists'});
      
      // Ensure we always have an array for playlists
      let playlistsData;
      
      if (response && typeof response === 'object') {
        if (response.body) {
          try {
            // If response has a body property that needs parsing
            playlistsData = await response.body.json();
          } catch (e) {
            // If body isn't JSON parseable, use response directly
            playlistsData = response;
          }
        } else {
          // If response doesn't have a body, use it directly
          playlistsData = response;
        }
      }
      
      // Ensure playlistsData is an array
      const safePlaylistsData = Array.isArray(playlistsData) ? playlistsData : 
                                (playlistsData ? [playlistsData] : []);
                                
      setPlaylists(safePlaylistsData);
      setError(null);
    } catch (err) {
      console.error('Error fetching playlists:', err);
      setError('Failed to load your playlists. Please try again.');
      // Always set to empty array on error
      setPlaylists([]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreatePlaylist = () => {
    router.push('/playlists/');
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
          <Link href="/explore">Explore</Link>
          <Link href="/library" className={styles.active}>Library</Link>
        </nav>
      </header>
      
      <main className={styles.main}>
        <div className={styles.titleContainer}>
          <h1 className={styles.title}>Your Library</h1>
          <button 
            className={styles.createButton}
            onClick={handleCreatePlaylist}
          >
            Create Playlist
          </button>
        </div>
        
        {loading ? (
          <div className={styles.loaderContainer}>
            <div className={styles.spinner}></div>
          </div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : playlists.length === 0 ? (
          <div className={styles.emptyState}>
            <h2>No playlists yet</h2>
            <p>Create your first playlist to start organizing your music!</p>
            <button 
              className={styles.createEmptyButton}
              onClick={handleCreatePlaylist}
            >
              Create Playlist
            </button>
          </div>
        ) : (
          <div className={styles.playlistGrid}>
            {playlists.map((playlist) => (
              <motion.div 
                key={playlist.id || Math.random().toString()}
                className={styles.playlistCard}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                onClick={() => router.push(`/playlist/${playlist.id}`)}              >
                <div className={styles.playlistImageContainer}>
                  <img 
                    src={playlist.imageUrl || '/images/default-playlist.png'} 
                    alt={playlist.name} 
                    className={styles.playlistImage}
                  />
                </div>
                <div className={styles.playlistInfo}>
                  <h3>{playlist.name}</h3>
                  <p>{playlist.songs?.length || 0} songs</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
      
      <footer className={styles.footer}>
        <p>© 2025 Auralis. All rights reserved.</p>
      </footer>
    </motion.div>
  );
}