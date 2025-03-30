import { useRouter } from 'next/router';
import { useEffect, useState, useCallback } from 'react'; // Import useCallback
import { Amplify } from 'aws-amplify';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import awsExports from '../../src/aws-exports';
import { motion } from 'framer-motion';
import styles from '../styles/index.module.css';

Amplify.configure(awsExports);

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
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
  }, [router]); // Add router as dependency

  useEffect(() => {
    checkUser();
  }, [checkUser]);

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
        <button className={styles.signOutButton} onClick={handleSignOut}>
          Sign Out
        </button>
      </header>
      <main className={styles.main}>
        <h1 className={styles.welcomeText}>
          Welcome, <span className={styles.username}>{user?.username || 'Guest'}</span>
        </h1>
        <p className={styles.description}>
          You are successfully logged in! Explore the features of Auralis.
        </p>
        <div className={styles.actions}>
          <button className={styles.actionButton}>Explore Music</button>
          <button className={styles.actionButton}>Your Library</button>
        </div>
      </main>
      <footer className={styles.footer}>
        <p>© 2025 Auralis. All rights reserved.</p>
      </footer>
    </motion.div>
  );
}