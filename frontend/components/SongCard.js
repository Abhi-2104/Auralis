import React from 'react';
import styles from '../styles/SongCard.module.css';

const PlayIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 5V19L19 12L8 5Z" fill="currentColor" />
  </svg>
);

const SongCard = ({ song, onPlay }) => {
  // Default values for missing data
  const title = song.title || 'Unknown Title';
  const artist = song.artist || 'Unknown Artist';
  const imageUrl = song.imageUrl || '/default-cover.jpg';

  return (
    <div className={styles.songCard} onClick={() => onPlay(song)}>
      <div className={styles.imageContainer}>
        <img 
          src={imageUrl} 
          alt={`${title} by ${artist}`}
          className={styles.coverImage}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/default-cover.jpg';
          }}
        />
        <div className={styles.playButtonOverlay}>
          <PlayIcon />
        </div>
      </div>
      <div className={styles.songInfo}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.artist}>{artist}</p>
      </div>
    </div>
  );
};

export default SongCard;