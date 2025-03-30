import { useState } from 'react';
import { uploadData } from 'aws-amplify/storage';
import styles from '../styles/songUploader.module.css';

const genres = [
  'Pop', 'Rock', 'Hip Hop', 'R&B', 'Country', 
  'Jazz', 'Electronic', 'Classical', 'Folk', 'Indie', 
  'Metal', 'Blues', 'Reggae', 'K-pop', 'Latin', 'Other'
];

export default function SongUploader() {
  // File state
  const [audioFile, setAudioFile] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState(null);
  
  // Metadata state
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [genre, setGenre] = useState('Pop');
  
  // Upload state
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const handleAudioFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setAudioFile(selectedFile);
      // Try to extract title/artist from filename if not set
      if (!title) {
        const fileName = selectedFile.name.replace(/\.(mp3|wav|ogg|flac|m4a)$/i, '');
        
        // Try to match "Artist - Title" pattern
        const artistTitleMatch = fileName.match(/^(.*?)\s*-\s*(.*?)$/);
        if (artistTitleMatch && artistTitleMatch.length === 3) {
          if (!artist) setArtist(artistTitleMatch[1].trim());
          setTitle(artistTitleMatch[2].trim());
        } else {
          setTitle(fileName);
        }
      }
    }
    setError('');
    setSuccess('');
  };
  
  const handleCoverImageChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setCoverImage(selectedFile);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setCoverImagePreview(e.target.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const validateForm = () => {
    if (!audioFile) {
      setError('Please select an audio file to upload');
      return false;
    }
    
    if (!title.trim()) {
      setError('Title is required');
      return false;
    }
    
    if (!artist.trim()) {
      setError('Artist is required');
      return false;
    }
    
    // Validate file is an audio file
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/mp4'];
    if (!validTypes.includes(audioFile.type)) {
      setError('Please select a valid audio file (MP3, WAV, OGG, FLAC, M4A)');
      return false;
    }
    
    return true;
  };

  const handleUpload = async () => {
    if (!validateForm()) return;

    try {
      setUploading(true);
      setProgress(0);
      
      // Generate safe filenames
      const timestamp = Date.now();
      const audioFileName = `${timestamp}-${audioFile.name.replace(/\s+/g, '-')}`;
      const metadataJson = JSON.stringify({
        title,
        artist,
        album,
        genre
      });

      // 1. Upload the audio file
      const audioResult = await uploadData({
        key: `public/music/${audioFileName}`,
        data: audioFile,
        options: {
          onProgress: (progress) => {
            const percentage = Math.round((progress.loaded / progress.total) * 100);
            setProgress(percentage);
          },
          contentType: audioFile.type,
          metadata: {
            title,
            artist,
            album,
            genre,
            customMetadata: metadataJson
          }
        }
      });
      
      console.log('Audio upload successful:', audioResult);

      // 2. Upload cover image if provided
      let imageUrl = '';
      if (coverImage) {
        const imageFileName = `${timestamp}-cover-${coverImage.name.replace(/\s+/g, '-')}`;
        const imageResult = await uploadData({
          key: `public/covers/${imageFileName}`,
          data: coverImage,
          options: {
            contentType: coverImage.type
          }
        });
        
        imageUrl = `s3://auralis-music-storage69e06-dev/public/covers/${imageFileName}`;
        console.log('Image upload successful:', imageResult);
      }
      
      setSuccess(`Successfully uploaded "${title}" by ${artist}`);
      
      // Clear form after successful upload
      setAudioFile(null);
      setCoverImage(null);
      setCoverImagePreview(null);
      setTitle('');
      setArtist('');
      setAlbum('');
      setGenre('Pop');
      
      // Optional: hide success message after delay
      setTimeout(() => setSuccess(''), 5000);
      
    } catch (err) {
      console.error('Error uploading:', err);
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.uploaderContainer}>
      <h2>Upload Music</h2>
      <p className={styles.note}>Add songs to the Auralis music library</p>
      
      <div className={styles.formGrid}>
        <div className={styles.fileSection}>
          {/* Audio File Uploader */}
          <div className={styles.fileInput}>
            <h3>Audio File</h3>
            <p className={styles.fileNote}>Upload MP3, WAV, OGG, FLAC, or M4A files</p>
            <input
              type="file"
              id="audio-upload"
              onChange={handleAudioFileChange}
              accept="audio/*"
              disabled={uploading}
            />
            <label htmlFor="audio-upload">
              {audioFile ? audioFile.name : 'Choose Audio File'}
            </label>
            
            {audioFile && (
              <div className={styles.fileDetails}>
                <p>Size: {(audioFile.size / 1024 / 1024).toFixed(2)} MB</p>
                <p>Type: {audioFile.type}</p>
              </div>
            )}
          </div>
          
          {/* Cover Image Uploader */}
          <div className={styles.fileInput}>
            <h3>Cover Image (Optional)</h3>
            <p className={styles.fileNote}>Upload JPG, PNG or WebP image</p>
            <input
              type="file"
              id="cover-upload"
              onChange={handleCoverImageChange}
              accept="image/*"
              disabled={uploading}
            />
            <label htmlFor="cover-upload">
              {coverImage ? coverImage.name : 'Choose Cover Image'}
            </label>
            
            {coverImagePreview && (
              <div className={styles.imagePreview}>
                <img src={coverImagePreview} alt="Cover Preview" />
              </div>
            )}
          </div>
        </div>
        
        <div className={styles.metadataSection}>
          <h3>Song Details</h3>
          
          {/* Title */}
          <div className={styles.formGroup}>
            <label htmlFor="title">Title*</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={uploading}
              placeholder="Song title"
              required
            />
          </div>
          
          {/* Artist */}
          <div className={styles.formGroup}>
            <label htmlFor="artist">Artist*</label>
            <input
              type="text"
              id="artist"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              disabled={uploading}
              placeholder="Artist name"
              required
            />
          </div>
          
          {/* Album */}
          <div className={styles.formGroup}>
            <label htmlFor="album">Album</label>
            <input
              type="text"
              id="album"
              value={album}
              onChange={(e) => setAlbum(e.target.value)}
              disabled={uploading}
              placeholder="Album name (optional)"
            />
          </div>
          
          {/* Genre */}
          <div className={styles.formGroup}>
            <label htmlFor="genre">Genre</label>
            <select
              id="genre"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              disabled={uploading}
            >
              {genres.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Upload Progress */}
      {uploading && (
        <div className={styles.progressContainer}>
          <div 
            className={styles.progressBar} 
            style={{ width: `${progress}%` }}
          ></div>
          <span>{progress}%</span>
        </div>
      )}
      
      {/* Error & Success Messages */}
      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>{success}</p>}
      
      {/* Upload Button */}
      <button 
        className={styles.uploadButton}
        onClick={handleUpload}
        disabled={!audioFile || uploading}
      >
        {uploading ? 'Uploading...' : 'Upload Song'}
      </button>
    </div>
  );
}