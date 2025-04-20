import { signInWithGoogle } from '../firebase-config';

const Login = () => {
  const handleGoogleSignIn = async () => {
    try {
      const button = document.getElementById('google-signin-button');
      button.disabled = true;
      button.innerHTML = 'Signing in...';

      const result = await signInWithGoogle();
      console.log('Sign in successful:', result.user.email);
      
      // Navigate to dashboard or home page
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Sign in error:', error);
      let errorMessage = 'Failed to sign in with Google';
      
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = 'Sign-in cancelled. Please try again.';
          break;
        case 'auth/popup-blocked':
          errorMessage = 'Pop-up was blocked. Please allow pop-ups for this site.';
          break;
        case 'auth/unauthorized-domain':
          errorMessage = 'This domain is not authorized for Google sign-in. Please contact support.';
          break;
        default:
          errorMessage = `Error: ${error.message}`;
      }
      
      alert(errorMessage);
    } finally {
      const button = document.getElementById('google-signin-button');
      button.disabled = false;
      button.innerHTML = 'Sign in with Google';
    }
  };

  return (
    <button
      id="google-signin-button"
      onClick={handleGoogleSignIn}
      className="google-signin-btn"
    >
      Sign in with Google
    </button>
  );
};

export default Login;