import { useEffect, useState, useRef } from 'react';
// onAuthStateChanged => state change from logged-in to not logged-in, this executes
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const useAuthStatus = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // avoiding memory leak on unmounted component
  const isMounted = useRef(true);

  useEffect(() => {
    if (isMounted) {
      const auth = getAuth();
      onAuthStateChanged(auth, (user) => {
        if (user) {
          setLoggedIn(true);
        }
        setLoading(false);
      });
    }

    return () => (isMounted.current = false);
  }, [isMounted]);
  return { loggedIn, loading };
};

// https://stackoverflow.com/questions/65505665/protected-route-with-firebase

export default useAuthStatus;
