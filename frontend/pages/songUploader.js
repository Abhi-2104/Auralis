import { useState } from 'react';
import { uploadData } from 'aws-amplify/storage';
import styles from '../styles/songUploader.module.css';

export default function SongUploader() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setError('');
    setSuccess('');
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    // Validate file is an audio file
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/mp4'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid audio file (MP3, WAV, OGG, FLAC, M4A)');
      return;
    }

    try {
      setUploading(true);
      setProgress(0);

      // Upload to the music/ folder with specific naming
      const result = await uploadData({
        key: `music/${Date.now()}-${file.name.replace(/\s+/g, '-')}`, // Replace spaces with dashes
        data: file,
        options: {
          onProgress: (progress) => {
            const percentage = Math.round((progress.loaded / progress.total) * 100);
            setProgress(percentage);
          },
          contentType: file.type,
        }
      });

      console.log('Upload successful:', result);
      setSuccess(`Successfully uploaded ${file.name}. Processing may take a moment.`);
      setFile(null);
      
      // Optional: Delay before hiding success message
      setTimeout(() => setSuccess(''), 5000);
      
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Rest of component remains the same
  return (
    <div className={styles.uploaderContainer}>
      <h2>Upload Music</h2>
      <p className={styles.note}>Upload MP3, WAV, OGG, FLAC, or M4A files to the Auralis music library</p>
      
      <div className={styles.fileInput}>
        <input
          type="file"
          id="file-upload"
          onChange={handleFileChange}
          accept="audio/*"
          disabled={uploading}
        />
        <label htmlFor="file-upload">
          {file ? file.name : 'Choose File'}
        </label>
      </div>
      
      {file && (
        <div className={styles.fileDetails}>
          <p>Selected: {file.name}</p>
          <p>Size: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
        </div>
      )}
      
      {uploading && (
        <div className={styles.progressContainer}>
          <div 
            className={styles.progressBar} 
            style={{ width: `${progress}%` }}
          ></div>
          <span>{progress}%</span>
        </div>
      )}
      
      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>{success}</p>}
      
      <button 
        className={styles.uploadButton}
        onClick={handleUpload}
        disabled={!file || uploading}
      >
        {uploading ? 'Uploading...' : 'Upload Song'}
      </button>
    </div>
  );
}