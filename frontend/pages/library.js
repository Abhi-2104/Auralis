import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Amplify, API } from 'aws-amplify';
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
      // This endpoint would need to be created in your API
      const userPlaylists = await API.get('auralisapi', '/api/playlists');
      setPlaylists(userPlaylists || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching playlists:', err);
      setError('Failed to load your playlists. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreatePlaylist = () => {
    router.push('/playlists/create');
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
                key={playlist.id}
                className={styles.playlistCard}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                onClick={() => router.push(`/playlists/${playlist.id}`)}
              >
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