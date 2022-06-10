import { getAuth, updateProfile } from 'firebase/auth';
import {
  updateDoc,
  doc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase.config';
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import ListingItem from '../components/ListingItem';
import arrowRight from '../assets/svg/keyboardArrowRightIcon.svg';
import homeIcon from '../assets/svg/homeIcon.svg';

function Profile() {
  const auth = getAuth();
  const [listings, setListings] = useState(null);
  const [loading, setLoading] = useState(true);
  // edit user details state
  const [changeDetails, setChangeDetails] = useState(false);

  // save name and email in state form auth
  const [formData, setFormData] = useState({
    name: auth.currentUser.displayName,
    email: auth.currentUser.email,
  });

  const { name, email } = formData;

  const navigate = useNavigate();

  // Fetch all listing of the current landlord
  useEffect(() => {
    (async () => {
      // selecting the collection
      const listingsRef = collection(db, 'listings');
      // building the query
      const q = query(
        listingsRef,
        where('userRef', '==', auth.currentUser.uid),
        orderBy('timestamp', 'desc')
      );

      const querySnap = await getDocs(q);

      let listing = [];
      querySnap.forEach((doc) => {
        return listing.push({
          id: doc.id,
          data: doc.data(),
        });
      });
      setListings(listing);
      setLoading(false);
    })();
  }, [auth.currentUser.uid]);

  useEffect(() => {
    console.log(listings);
  }, [listings]);

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

  // Delete list handler
  const onDelete = async (listingId) => {
    if (window.confirm('Are you sure to delete?'));
    await deleteDoc(doc(db, 'listings', listingId));
    const updatedListings = listings.filter((listing) => listing.id !== listingId);
    setListings(updatedListings);
    toast.success('Listing has been deleted !');
  };

  // Edit handler navigate
  const onEdit = (listingId) => navigate(`/edit-listing/${listingId}`);

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

      {/* Display all the listings */}
      {!loading && listings?.length > 0 && (
        <>
          <p className="listingText">Your listings</p>
          <ul className="listingsList">
            {listings.map((listing) => (
              <ListingItem
                listing={listing.data}
                id={listing.id}
                key={listing.id}
                onDelete={() => onDelete(listing.id)}
                onEdit={() => onEdit(listing.id)}
              />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default Profile;
