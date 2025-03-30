import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Amplify } from 'aws-amplify';
import { get, post, put, del } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import awsExports from '../../src/aws-exports';
import styles from '../styles/playlist.module.css';

Amplify.configure(awsExports);

export default function CreatePlaylist() {
  const [playlistName, setPlaylistName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await getCurrentUser();
      } catch (error) {
        console.error("Authentication error:", error);
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!playlistName.trim()) {
      setError('Playlist name is required');
      return;
    }

    setLoading(true);
    try {
      const newPlaylist = await post({
        apiName: 'auralisapi',
        path: '/api/playlists',
        options: {
          body: {
            name: playlistName,
            description
          }
        }
      });

      router.push(`/playlists/${newPlaylist.id}`);
    } catch (err) {
      console.error('Error creating playlist:', err);
      setError('Failed to create playlist. Please try again.');
      setLoading(false);
    }
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
          <Link href="/library">Library</Link>
        </nav>
      </header>

      <main className={styles.main}>
        <div className={styles.formContainer}>
          <h1 className={styles.title}>Create New Playlist</h1>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="playlistName">Playlist Name *</label>
              <input
                id="playlistName"
                type="text"
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                placeholder="My Awesome Playlist"
                required
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description">Description (Optional)</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this playlist about?"
                rows={4}
                disabled={loading}
              />
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.formActions}>
              <button 
                type="button"
                className={styles.cancelButton}
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit"
                className={styles.submitButton}
                disabled={loading}
              >
                {loading ? <div className={styles.spinner}></div> : "Create Playlist"}
              </button>
            </div>
          </form>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>© 2025 Auralis. All rights reserved.</p>
      </footer>
    </motion.div>
  );
}
