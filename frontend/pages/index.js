import { useRouter } from 'next/router';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Amplify } from 'aws-amplify';
import { get, post, put, del } from 'aws-amplify/api';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import awsExports from '../../src/aws-exports';
import { motion } from 'framer-motion';
import styles from '../styles/index.module.css';

Amplify.configure(awsExports);

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [songs, setSongs] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [featuredSongs, setFeaturedSongs] = useState([]);
  const [loadingContent, setLoadingContent] = useState(false);
  const router = useRouter();

  // Use useCallback to memoize checkUser function
  const checkUser = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      console.log("Current user in index:", currentUser);
      setUser(currentUser);
      setLoading(false);
    } catch (error) {
      console.error("Error checking user:", error);
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  // Fetch songs and playlists after authentication
  useEffect(() => {
    if (user) {
      fetchSongs();
      fetchPlaylists();
    }
  }, [user]);

  const fetchSongs = async () => {
    try {
      setLoadingContent(true);
      // Updated API call using the new method
      const response = await get({
        apiName: 'auralisapi', 
        path: '/songs'
      });
      console.log("Songs response:", response);
      
      if (response && response.songs) {
        setSongs(response.songs);
        
        // Create a featured list from the songs
        const featured = response.songs
          .sort(() => 0.5 - Math.random()) // Shuffle array
          .slice(0, 5); // Get first 5 items
        setFeaturedSongs(featured);
      }
    } catch (error) {
      console.error("Error fetching songs:", error);
    } finally {
      setLoadingContent(false);
    }
  };

  const fetchPlaylists = async () => {
    try {
      // Updated API call using the new method
      const response = await get({
        apiName: 'auralisapi', 
        path: '/api/playlists'
      });
      console.log("Playlists response:", response);
      
      if (response && Array.isArray(response)) {
        setPlaylists(response);
      }
    } catch (error) {
      console.error("Error fetching playlists:", error);
      // If the API doesn't exist yet, don't break the app
      setPlaylists([]);
    }
  };

  const handleSignOut = async () => {
    const confirmSignOut = confirm('Are you sure you want to sign out?');
    if (confirmSignOut) {
      try {
        await signOut();
        console.log("User signed out");
        router.push('/login');
      } catch (err) {
        console.error('Error signing out:', err);
      }
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
      initial={{ opacity: 0, scale: 0.95, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -50 }}
      transition={{
        duration: 0.6,
        ease: "easeInOut",
      }}
    >
      <header className={styles.header}>
        <div className={styles.logo}>AURALIS</div>
        <nav className={styles.navigation}>
          <Link href="/explore">
            <span className={styles.navLink}>Explore</span>
          </Link>
          <Link href="/library">
            <span className={styles.navLink}>Library</span>
          </Link>
          <Link href="/playlists">
            <span className={styles.navLink}>Playlists</span>
          </Link>
        </nav>
        <button className={styles.signOutButton} onClick={handleSignOut}>
          Sign Out
        </button>
      </header>

      <main className={styles.main}>
        <section className={styles.welcomeSection}>
          <h1 className={styles.welcomeText}>
            Welcome, <span className={styles.username}>{user?.username || 'Guest'}</span>
          </h1>
          <p className={styles.description}>
            Discover new music and create your personal playlists with Auralis.
          </p>
        </section>

        <section className={styles.featuredSection}>
          <h2 className={styles.sectionTitle}>Featured Tracks</h2>
          {loadingContent ? (
            <div className={styles.contentLoader}>
              <div className={styles.spinnerSmall}></div>
            </div>
          ) : (
            <div className={styles.songGrid}>
              {featuredSongs.length > 0 ? (
                featuredSongs.map((song, index) => (
                  <motion.div
                    key={song.id || index}
                    className={styles.songCard}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className={styles.songImageContainer}>
                      <img
                        src={song.imageUrl || 'https://via.placeholder.com/300?text=Album+Art'}
                        alt={song.title || 'Song'}
                        className={styles.songImage}
                      />
                      <div className={styles.playOverlay}>
                        <button className={styles.playButton}>▶</button>
                      </div>
                    </div>
                    <h3 className={styles.songTitle}>{song.title || 'Untitled'}</h3>
                    <p className={styles.songArtist}>{song.artist || 'Unknown Artist'}</p>
                  </motion.div>
                ))
              ) : (
                <div className={styles.noContent}>
                  <p>No featured songs available yet. Check back soon!</p>
                </div>
              )}
            </div>
          )}
        </section>

        <section className={styles.recentlyPlayedSection}>
          <h2 className={styles.sectionTitle}>Your Playlists</h2>
          <div className={styles.playlistGrid}>
            {playlists.length > 0 ? (
              playlists.map((playlist, index) => (
                <motion.div
                  key={playlist.id || index}
                  className={styles.playlistCard}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className={styles.playlistImageContainer}>
                    <img
                      src={playlist.imageUrl || 'https://via.placeholder.com/300?text=Playlist'}
                      alt={playlist.name || 'Playlist'}
                      className={styles.playlistImage}
                    />
                  </div>
                  <h3 className={styles.playlistTitle}>{playlist.name || 'My Playlist'}</h3>
                  <p className={styles.playlistSongs}>
                    {playlist.songs ? `${playlist.songs.length} songs` : '0 songs'}
                  </p>
                </motion.div>
              ))
            ) : (
              <div className={styles.noContent}>
                <p>No playlists created yet.</p>
                <Link href="/playlists">
                  <button className={styles.createButton}>Create Playlist</button>
                </Link>
              </div>
            )}
          </div>
        </section>

        <section className={styles.exploreSection}>
          <h2 className={styles.sectionTitle}>Explore More</h2>
          <div className={styles.actionGrid}>
            <Link href="/explore">
              <motion.div
                className={styles.actionCard}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <h3>Discover Music</h3>
                <p>Find new songs based on your taste</p>
              </motion.div>
            </Link>
            <Link href="/playlists">
              <motion.div
                className={styles.actionCard}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <h3>Create Playlist</h3>
                <p>Organize your favorite songs</p>
              </motion.div>
            </Link>
            <Link href="/library">
              <motion.div
                className={styles.actionCard}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <h3>My Library</h3>
                <p>Access your saved content</p>
              </motion.div>
            </Link>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <p>© 2025 Auralis. All rights reserved.</p>
      </footer>
    </motion.div>
  );
}