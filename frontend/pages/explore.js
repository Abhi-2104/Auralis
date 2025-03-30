import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Amplify, API } from 'aws-amplify';
import { getCurrentUser } from 'aws-amplify/auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import awsExports from '../../src/aws-exports';
import SongCard from '../components/SongCard';
import AudioPlayer from '../components/AudioPlayer';
import styles from '../styles/explore.module.css';

Amplify.configure(awsExports);

export default function Explore() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [currentSong, setCurrentSong] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  const router = useRouter();

  const genres = ['all', 'pop', 'rock', 'hip-hop', 'electronic', 'classical', 'jazz'];

  useEffect(() => {
    fetchSongs();
  }, [selectedGenre]);

  const fetchSongs = async () => {
    setLoading(true);
    try {
      let path = '/songs';
      if (selectedGenre !== 'all') {
        path += `?genre=${selectedGenre}`;
      }

      const response = await API.get('auralisapi', path, {});

      if (response && response.songs) {
        setSongs(response.songs);
      } else {
        setSongs([]);
        setError('No songs available');
      }
    } catch (err) {
      setError('Failed to load songs. Please try again.');
      setSongs([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = async (song) => {
    try {
      setCurrentSong(song);
      if (song.audioUrl && song.audioUrl.startsWith('http')) {
        setAudioUrl(song.audioUrl);
        return;
      }

      const response = await API.post('auralisapi', `/stream-song/${song.id}`, {});
      if (response && response.signedUrl) {
        setAudioUrl(response.signedUrl);
      } else {
        setError('Could not play this song');
      }
    } catch (error) {
      setError('Error: ' + error.message);
    }
  };

  const handleGenreChange = (genre) => {
    setSelectedGenre(genre);
  };

  return (
    <motion.div className={styles.container}>
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
          {genres.map((genre) => (
            <button key={genre} onClick={() => handleGenreChange(genre)}>{genre}</button>
          ))}
        </div>

        {loading ? (
          <div>Loading songs...</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : (
          <div className={styles.songGrid}>
            {songs.map((song) => (
              <SongCard key={song.id} song={song} onPlay={handlePlay} />
            ))}
          </div>
        )}

        {currentSong && (
          <div className={styles.playerContainer}>
            <AudioPlayer url={audioUrl} title={currentSong.title} artist={currentSong.artist} />
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        <p>© 2025 Auralis. All rights reserved.</p>
      </footer>
    </motion.div>
  );
}
