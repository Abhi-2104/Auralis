import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Amplify } from 'aws-amplify';
import { get } from 'aws-amplify/api';
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

  const handleGenreChange = (genre) => {
    setSelectedGenre(genre);
    // fetchSongs will be called by useEffect
  };

  const addToPlaylist = async (songId) => {
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
                    onClick={() => router.push(`/songs/${song.id}`)}
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