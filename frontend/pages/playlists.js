import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Amplify, API } from 'aws-amplify';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import awsExports from '../../src/aws-exports';
import { motion } from 'framer-motion';
import styles from '../styles/playlist.module.css';

Amplify.configure(awsExports);

export default function Playlists() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playlists, setPlaylists] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylist, setNewPlaylist] = useState({ name: '', description: '' });
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState('');
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

  // Fetch user playlists
  const fetchPlaylists = useCallback(async () => {
    try {
      const apiName = 'auralisapi';
      const path = '/api/playlists';
      const response = await API.get(apiName, path);
      setPlaylists(response);
    } catch (error) {
      console.error('Error fetching playlists:', error);
      setError('Failed to load playlists. Please try again later.');
    }
  }, []);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  useEffect(() => {
    if (user) {
      fetchPlaylists();
    }
  }, [user, fetchPlaylists]);

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

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!newPlaylist.name.trim()) {
      setError('Playlist name is required');
      return;
    }

    setCreateLoading(true);
    setError('');

    try {
      const apiName = 'auralisapi';
      const path = '/api/playlists';
      const init = {
        body: newPlaylist,
        headers: { 'Content-Type': 'application/json' }
      };

      const response = await API.post(apiName, path, init);
      setPlaylists([...playlists, response]);
      setNewPlaylist({ name: '', description: '' });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating playlist:', error);
      setError('Failed to create playlist. Please try again.');
    } finally {
      setCreateLoading(false);
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
        <nav>
          <Link href="/songs">
            <span className={styles.navLink}>Explore Music</span>
          </Link>
        </nav>
        <button className={styles.signOutButton} onClick={handleSignOut}>
          Sign Out
        </button>
      </header>

      <h1 className={styles.title}>Your Playlists</h1>
      <p className={styles.description}>Create and manage your music collections</p>

      {error && <div className={styles.error}>{error}</div>}

      {!showCreateForm ? (
        <button 
          className={styles.button} 
          onClick={() => setShowCreateForm(true)}
        >
          Create New Playlist
        </button>
      ) : (
        <motion.div 
          className={styles.createPlaylistForm}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
        >
          <h2 className={styles.formTitle}>Create New Playlist</h2>
          <form onSubmit={handleCreatePlaylist}>
            <div className={styles.inputGroup}>
              <label htmlFor="playlistName">Name</label>
              <input
                id="playlistName"
                type="text"
                value={newPlaylist.name}
                onChange={(e) => setNewPlaylist({ ...newPlaylist, name: e.target.value })}
                placeholder="Enter playlist name"
                disabled={createLoading}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="playlistDescription">Description (optional)</label>
              <input
                id="playlistDescription"
                type="text"
                value={newPlaylist.description}
                onChange={(e) => setNewPlaylist({ ...newPlaylist, description: e.target.value })}
                placeholder="Enter a brief description"
                disabled={createLoading}
              />
            </div>
            <div className={styles.formActions}>
              <button
                type="button"
                className={`${styles.button} ${styles.cancelButton}`}
                onClick={() => setShowCreateForm(false)}
                disabled={createLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.button}
                disabled={createLoading}
              >
                {createLoading ? <div className={styles.spinner}></div> : "Create Playlist"}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {playlists.length > 0 ? (
        <div className={styles.playlistGrid}>
          {playlists.map((playlist) => (
            <Link href={`/playlist/${playlist.id}`} key={playlist.id}>
              <motion.div
                className={styles.playlistCard}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <div className={styles.playlistImage}>
                  <div className={styles.playlistImagePlaceholder}>♪</div>
                </div>
                <div className={styles.playlistInfo}>
                  <h3 className={styles.playlistName}>{playlist.name}</h3>
                  <p className={styles.playlistSongs}>
                    {playlist.songs?.length || 0} songs
                  </p>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <p>You don't have any playlists yet. Create your first playlist to get started!</p>
        </div>
      )}
    </motion.div>
  );
}