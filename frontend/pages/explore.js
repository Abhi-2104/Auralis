import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Amplify, API } from 'aws-amplify';
import { getCurrentUser } from 'aws-amplify/auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import awsExports from '../../src/aws-exports';
import styles from '../styles/explore.module.css';

Amplify.configure(awsExports);

export default function Explore() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGenre, setSelectedGenre] = useState('all');
  const router = useRouter();
  
  const genres = ['all', 'pop', 'rock', 'hip-hop', 'electronic', 'classical', 'jazz'];
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await getCurrentUser();
        fetchSongs();
      } catch (error) {
        console.error("Authentication error:", error);
        router.push('/login');
      }
    };
    
    checkAuth();
  }, [router, selectedGenre]);
  
  const fetchSongs = async () => {
    setLoading(true);
    try {
      let path = '/api/songs';
      if (selectedGenre !== 'all') {
        path += `?genre=${selectedGenre}`;
      }
      
      const songsData = await API.get('auralisapi', path);
      setSongs(songsData.songs || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching songs:', err);
      setError('Failed to load songs. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const addToPlaylist = async (songId) => {
    // Will implement in playlist page
    router.push(`/songs/${songId}`);
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
              onClick={() => setSelectedGenre(genre)}
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
          <div className={styles.noResults}>No songs found for this genre.</div>
        ) : (
          <div className={styles.songGrid}>
            {songs.map((song) => (
              <motion.div 
                key={song.id}
                className={styles.songCard}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className={styles.songImageContainer}>
                  <img 
                    src={song.imageUrl || '/images/default-album.png'} 
                    alt={song.title} 
                    className={styles.songImage}
                  />
                  <button 
                    className={styles.playButton}
                    onClick={() => router.push(`/songs/${song.id}`)}
                  >
                    ▶
                  </button>
                </div>
                <div className={styles.songInfo}>
                  <h3>{song.title}</h3>
                  <p>{song.artist}</p>
                </div>
                <button
                  className={styles.addButton}
                  onClick={() => addToPlaylist(song.id)}
                >
                  +
                </button>
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