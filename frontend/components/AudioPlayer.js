import React, { useState, useRef, useEffect } from 'react';
import { get } from 'aws-amplify/api';
import styles from '../styles/audioPlayer.module.css';

const AudioPlayer = ({ songId, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [songData, setSongData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const audioPlayer = useRef();
  const progressBar = useRef();
  const animationRef = useRef();
  
  useEffect(() => {
    if (songId) {
      loadSong(songId);
    }
    
    // Cleanup function
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioPlayer.current) {
        audioPlayer.current.pause();
      }
    };
  }, [songId]);
  
  const loadSong = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get signed URL from API
      const response = await get({
        apiName: 'auralisapi',
        path: `/songs/${id}/stream`
      });
      
      console.log('Stream URL response:', response);
      setSongData(response);
      
      // Reset player state
      setCurrentTime(0);
      setDuration(response.duration || 0);
      
      // Wait for audio to load
      if (audioPlayer.current) {
        audioPlayer.current.pause();
        audioPlayer.current.src = response.streamUrl;
        audioPlayer.current.load();
        
        // Auto-play when loaded
        audioPlayer.current.onloadeddata = () => {
          setIsPlaying(true);
          audioPlayer.current.play().catch(e => {
            console.error('Auto-play prevented:', e);
            setIsPlaying(false);
          });
        };
      }
    } catch (err) {
      console.error('Error loading song:', err);
      setError('Failed to load song. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const togglePlayPause = () => {
    const prevValue = isPlaying;
    setIsPlaying(!prevValue);
    
    if (!prevValue) {
      audioPlayer.current.play();
      animationRef.current = requestAnimationFrame(whilePlaying);
    } else {
      audioPlayer.current.pause();
      cancelAnimationFrame(animationRef.current);
    }
  };
  
  const whilePlaying = () => {
    if (audioPlayer.current) {
      progressBar.current.value = audioPlayer.current.currentTime;
      setCurrentTime(audioPlayer.current.currentTime);
      animationRef.current = requestAnimationFrame(whilePlaying);
    }
  };
  
  const changeRange = () => {
    audioPlayer.current.currentTime = progressBar.current.value;
    setCurrentTime(progressBar.current.value);
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  if (loading) {
    return <div className={styles.loading}>Loading song...</div>;
  }
  
  if (error) {
    return <div className={styles.error}>{error}</div>;
  }
  
  if (!songData) {
    return <div className={styles.error}>No song selected</div>;
  }
  
  return (
    <div className={styles.audioPlayer}>
      <audio ref={audioPlayer} preload="metadata">
        <source src={songData.streamUrl} />
        Your browser does not support the audio element.
      </audio>
      
      <div className={styles.songInfo}>
        <h3 className={styles.title}>{songData.title}</h3>
        <p className={styles.artist}>{songData.artist}</p>
      </div>
      
      <div className={styles.controls}>
        <button onClick={togglePlayPause} className={styles.playPause}>
          {isPlaying ? '❚❚' : '▶'}
        </button>
        
        <div className={styles.progressContainer}>
          <span className={styles.currentTime}>{formatTime(currentTime)}</span>
          <input 
            type="range" 
            className={styles.progressBar}
            ref={progressBar}
            defaultValue="0"
            onChange={changeRange}
            max={duration}
          />
          <span className={styles.duration}>{formatTime(duration)}</span>
        </div>
        {onClose && (
          <button onClick={onClose} className={styles.closeButton}>
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default AudioPlayer;