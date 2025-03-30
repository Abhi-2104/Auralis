import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Amplify } from "aws-amplify";
import { signIn, getCurrentUser, signOut } from "aws-amplify/auth";
import awsExports from "../../src/aws-exports";
import styles from "../styles/auth.module.css";

// Configure Amplify
Amplify.configure(awsExports);

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const router = useRouter();
    
    // Check if user is already authenticated when page loads
    useEffect(() => {
        checkAuthStatus();
    }, []);
    
    const checkAuthStatus = async () => {
        try {
            const user = await getCurrentUser();
            console.log("User already signed in:", user);
            setIsAuthenticated(true);
            setLoading(false);
        } catch (error) {
            console.log("No authenticated user");
            setIsAuthenticated(false);
            setLoading(false);
        }
    };
  
    const handleSignIn = async () => {
        setErrorMessage("");
        try {
            setLoading(true);
            
            // Validate inputs
            if (!email || !password) {
                setErrorMessage("Email and password are required");
                setLoading(false);
                return;
            }
        
            console.log("Attempting to sign in with:", email);
            
            // Using the direct signIn function with the correct parameter format
            const signInResult = await signIn({
                username: email,
                password
            });
            
            console.log("Sign in successful:", signInResult);
            
            // Redirect to home page
            router.replace("/");
        } catch (err) {
            console.error("Error signing in:", err);
            
            // If already authenticated, offer to go to home page
            if (err.name === "UserAlreadyAuthenticatedException") {
                setIsAuthenticated(true);
            } else {
                setErrorMessage(err.message || "Login Failed");
            }
            setLoading(false);
        }
    };
    
    const handleSignOut = async () => {
        try {
            setLoading(true);
            await signOut();
            setIsAuthenticated(false);
            setLoading(false);
        } catch (err) {
            console.error("Error signing out:", err);
            setErrorMessage("Failed to sign out");
            setLoading(false);
        }
    };
  
    if (loading && !isAuthenticated) {
        return (
            <div className={styles.authContainer}>
                <div className={styles.loader}>
                    <div className={styles.spinner}></div>
                </div>
            </div>
        );
    }
    
    if (isAuthenticated) {
        return (
            <div className={`${styles.authContainer} ${styles.alreadyAuthenticated}`}>
                <div className={styles.authCard}>
                    <div className={styles.logo}>AURALIS</div>
                    <h1 className={styles.title}>You're already logged in</h1>
                    <button className={styles.button} onClick={() => router.push("/")}>
                        Go to Dashboard
                    </button>
                    <button 
                        className={`${styles.button} ${styles.secondaryButton}`}
                        onClick={handleSignOut}
                        style={{ background: "transparent", border: "1px solid var(--accent-primary)", marginTop: "1rem" }}
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        );
    }
  
    return (
        <div className={styles.authContainer}>
            <div className={styles.authCard}>
                <div className={styles.logo}>AURALIS</div>
                <h1 className={styles.title}>Log In</h1>
                <div className={styles.form}>
                    <div className={styles.inputGroup}>
                        <input 
                            className={styles.input}
                            placeholder="Email" 
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
                    
                    {errorMessage && (
                        <div className={styles.errorMessage}>{errorMessage}</div>
                    )}
                    
                    <button 
                        className={styles.button}
                        onClick={handleSignIn} 
                        disabled={loading}
                    >
                        {loading ? <div className={styles.spinner}></div> : "Sign In"}
                    </button>
                    
                    <div className={styles.switchText}>
                        Don't have an account?{" "}
                        <Link href="/signup">
                            <span className={styles.link}>Sign up</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}