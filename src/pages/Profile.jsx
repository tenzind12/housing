import { getAuth, updateProfile } from 'firebase/auth';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase.config';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import arrowRight from '../assets/svg/keyboardArrowRightIcon.svg';
import homeIcon from '../assets/svg/homeIcon.svg';

function Profile() {
  const auth = getAuth();
  // edit user details state
  const [changeDetails, setChangeDetails] = useState(false);

  // save name and email in state form auth
  const [formData, setFormData] = useState({
    name: auth.currentUser.displayName,
    email: auth.currentUser.email,
  });

  const { name, email } = formData;

  const navigate = useNavigate();

  // logout handler
  const onLogout = () => {
    auth.signOut();
    navigate('/');
  };

  // onSubmit handler to update name in firebase and firestore
  const onSubmit = async () => {
    try {
      if (auth.currentUser.displayName !== name) {
        // 1. Update display name in firebase
        await updateProfile(auth.currentUser, { displayName: name });

        // 2. Update in firestore
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, { name });
      }
    } catch (error) {
      toast.error('Could not update profile details');
    }
  };

  // onChange handler of inputs fields when editing
  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.id]: e.target.value,
    }));
  };

  return (
    <div className="profile">
      <header className="profileHeader">
        <p className="pageHeader">My Profile</p>
        <button type="button" className="logOut" onClick={onLogout}>
          Logout
        </button>
      </header>

      <main>
        <div className="profileDetailsHeader">
          <p className="profileDetailsText">Personal Details</p>
          {/* 1. if changeDetails === true then call onSubmit button 
              2. setChangeDetails value by toggling true & false */}
          <p
            className="changePersonalDetails"
            onClick={() => {
              changeDetails && onSubmit();
              setChangeDetails((prevState) => !prevState);
            }}
          >
            {changeDetails ? 'done' : 'change'}
          </p>
        </div>

        <div className="profileCard">
          <form>
            <input
              type="text"
              className={!changeDetails ? 'profileName' : 'profileNameActive'}
              id="name"
              disabled={!changeDetails}
              onChange={onChange}
              value={name}
            />

            <input
              type="email"
              className={!changeDetails ? 'profileEmail' : 'profileEmailActive'}
              id="email"
              disabled={!changeDetails}
              onChange={onChange}
              value={email}
            />
          </form>
        </div>
      </main>

      <Link to="/create-listing" className="createListing">
        <img src={homeIcon} alt="Home" />
        <p>Sell or rent your home</p>
        <img src={arrowRight} alt="arrow right" />
      </Link>
    </div>
  );
}

export default Profile;
