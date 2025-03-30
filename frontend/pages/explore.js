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
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
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

  const playSong = (song) => {
    // Instead of navigating to a detail page, play the song directly
    console.log(`Playing song: ${song.title}`);
    setCurrentSong(song);
    setIsPlaying(true);
  };

  const addToPlaylist = async (songId, event) => {
    // Prevent event propagation if it's a button inside a card
    if (event) {
      event.stopPropagation();
    }
    
    // Here you would add song to playlist feature
    // For now we'll just alert
    alert(`Added song ${songId} to your playlist`);
    
    // Don't navigate away - that was causing the 404
    // router.push(`/songs/${songId}`);
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
                  onClick={(e) => addToPlaylist(song.id, e)}
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
              src={currentSong.audioUrl || 'https://example.com/song1.mp3'} 
              className={styles.audioElement || 'audioElement'}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onError={(e) => {
                console.error('Audio playback error:', e);
                // If test song, use a fallback audio source
                if (currentSong.id?.startsWith('test-song')) {
                  e.target.src = 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0d438fb04.mp3';
                  e.target.play();
                }
              }}
            />
          </div>
        )}
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
        }
      `}</style>
    </motion.div>
  );
}