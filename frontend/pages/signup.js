import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Amplify } from 'aws-amplify';
import { signUp, confirmSignUp } from 'aws-amplify/auth';
import awsExports from '../../src/aws-exports';
import styles from '../styles/auth.module.css';

// Configure Amplify
Amplify.configure(awsExports);

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [stage, setStage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  const validateForm = () => {
    setErrorMessage('');
    
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      return false;
    }
    
    if (!password || password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long');
      return false;
    }
    
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return false;
    }
    
    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      console.log('Attempting to sign up with email:', email);
      
      await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email
          }
        }
      });
      
      setStage(1);
      setLoading(false);
    } catch (err) {
      console.error('Error signing up:', err);
      setErrorMessage(err.message || 'An error occurred during sign up');
      setLoading(false);
    }
  };

  const handleConfirmSignUp = async () => {
    if (!confirmationCode) {
      setErrorMessage('Please enter the confirmation code');
      return;
    }
    
    setLoading(true);
    try {
      await confirmSignUp({
        username: email,
        confirmationCode
      });
      
      // Show success message with animation before redirecting
      setErrorMessage('');
      setLoading(false);
      
      // Redirect after a short delay to show the success state
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err) {
      console.error('Error confirming sign up:', err);
      setErrorMessage(err.message || 'An error occurred during confirmation');
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.logo}>AURALIS</div>
        
        {stage === 0 ? (
          <div className={styles.stageTransition}>
            <h1 className={styles.title}>Create Account</h1>
            <div className={styles.form}>
              <div className={styles.inputGroup}>
                <input
                  className={styles.input}
                  placeholder="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              
              <div className={styles.inputGroup}>
                <input
                  className={styles.input}
                  placeholder="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
              
              <div className={styles.inputGroup}>
                <input
                  className={styles.input}
                  placeholder="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
              
              {errorMessage && (
                <div className={styles.errorMessage}>{errorMessage}</div>
              )}
              
              <button
                className={styles.button}
                onClick={handleSignUp}
                disabled={loading}
              >
                {loading ? <div className={styles.spinner}></div> : 'Sign Up'}
              </button>
              
              <div className={styles.switchText}>
                Already have an account?{' '}
                <Link href="/login">
                  <span className={styles.link}>Log in</span>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.stageTransition}>
            <h1 className={styles.title}>Confirm Your Account</h1>
            <p style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
              We've sent a confirmation code to your email.
            </p>
            
            <div className={styles.form}>
              <div className={styles.inputGroup}>
                <input
                  className={styles.input}
                  placeholder="Confirmation Code"
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value)}
                  disabled={loading}
                />
              </div>
              
              {errorMessage && (
                <div className={styles.errorMessage}>{errorMessage}</div>
              )}
              
              <button
                className={styles.button}
                onClick={handleConfirmSignUp}
                disabled={loading}
              >
                {loading ? <div className={styles.spinner}></div> : 'Confirm Account'}
              </button>
              
              <div className={styles.switchText}>
                Didn't receive code?{' '}
                <span 
                  className={styles.link}
                  onClick={() => {
                    // Add resend code functionality here
                    alert('Resend functionality to be implemented');
                  }}
                >
                  Resend
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}