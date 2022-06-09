import { useState, useRef, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase.config';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';
import Spinner from '../components/Spinner';

const CreateListing = () => {
  const [geolocationEnabled, setGeolocationEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'rent',
    name: '',
    bedrooms: 1,
    bathrooms: 1,
    parking: false,
    furnished: false,
    address: '',
    offer: true,
    regularPrice: 0,
    discountedPrice: 0,
    images: {},
    latitude: 0,
    longitude: 0,
  });

  // prettier-ignore
  const {type, name, bedrooms, bathrooms, parking, furnished, address, offer, regularPrice, discountedPrice, images, latitude, longitude} = formData

  const auth = getAuth();
  const navigate = useNavigate();
  const isMounted = useRef(true);

  useEffect(() => {
    if (isMounted) {
      onAuthStateChanged(auth, (user) => {
        if (user) setFormData({ ...formData, userRef: user.uid });
        else navigate('/sign-in');
      });
    }
    return () => (isMounted.current = false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth, isMounted, navigate]);

  // form submit Handler
  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // error price
    if (parseFloat(discountedPrice) >= parseFloat(regularPrice)) {
      setLoading(false);
      toast.error('The discounted price cannot be bigger than regular price');
      return;
    }

    // maximum images
    if (images.length > 6) {
      setLoading(false);
      toast.error('Max 6 images');
      return;
    }

    // geolocation
    let geolocation = {};
    let location;

    // IF BLOCK for geolocation handling
    if (geolocationEnabled) {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${process.env.REACT_APP_GEOCODE_API_KEY}`
      );
      const data = await response.json();

      if (!data.status === 'REQUEST_DENIED') {
        // if no lat and lng available, make them 0
        geolocation.lat = data.result[0]?.geometry.location.lat ?? 0;
        geolocation.lng = data.result[0]?.geometry.location.lng ?? 0;

        // when user enters invalid address field
        location = data.status === 'ZERO_RESULTS' ? undefined : data.results[0]?.formatted_address;

        if (location === undefined || location.includes('undefined')) {
          setLoading(false);
          toast.error('Please enter a correct address');
        }
      } else {
        toast.error(
          'The api key is currently having issues. Please enter latitude and longitude manually'
        );
      }
    } else {
      geolocation.lat = latitude;
      geolocation.lng = longitude;
    }

    // Store images in firebase
    const storeImage = async (image) => {
      return new Promise((resolve, reject) => {
        const storage = getStorage();
        const fileName = `${auth.currentUser.uid}-${image.name}-${uuidv4()}`;

        const storageRef = ref(storage, 'images/' + fileName);
        const uploadTask = uploadBytesResumable(storageRef, image);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            // Observe state change events such as progress, pause, and resume
            // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('uplaod is currently ' + progress + '%');

            switch (snapshot.state) {
              case 'paused':
                console.log('Upload is paused');
                break;
              case 'running':
                console.log('Upload is running');
                break;
              default:
                console.log(snapshot.state);
                break;
            }
          },
          (error) => {
            reject(error);
          },
          () => {
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
              resolve(downloadURL);
            });
          }
        );
      });
    };

    // Calling the async/await image function
    const imageUrls = await Promise.all([...images].map((image) => storeImage(image))).catch(() => {
      setLoading(false);
      toast.error('Image upload failed');
      return;
    });

    // upload to firebase database
    const formDataCopy = {
      ...formData,
      imageUrls,
      geolocation,
      timestamp: serverTimestamp(),
    };

    formDataCopy.location = address;
    delete formDataCopy.images;
    delete formDataCopy.address;

    !formDataCopy.offer && delete formDataCopy.discountedPrice;

    const docRef = await addDoc(collection(db, 'listings'), formDataCopy);
    setLoading(false);
    toast.success('Listing saved');
    navigate('/category/' + formDataCopy.type + '/' + docRef.id);

    setLoading(false);
  };

  // === onChange input fields
  const onMutate = (e) => {
    // turning the string 'true' & 'false' into type boolean
    let boolean = null;
    if (e.target.value === 'true') boolean = true;
    if (e.target.value === 'false') boolean = false;

    // Files (images)
    if (e.target.files) {
      setFormData((prevState) => ({ ...prevState, images: e.target.files }));
    }

    // Text/Boolean/Numbers (all other than images)
    if (!e.target.files) {
      setFormData((prevState) => ({ ...prevState, [e.target.id]: boolean ?? e.target.value }));
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="profile">
      <header>
        <p className="pageHeader">Create a Listing</p>
      </header>

      <main>
        <form onSubmit={onSubmit}>
          <label className="formLabel">Sell / Rent</label>
          <div className="formButtons">
            <button
              type="button"
              className={type === 'sale' ? 'formButtonActive' : 'formButton'}
              id="type"
              value="sale"
              onClick={onMutate}
            >
              Sell
            </button>

            <button
              type="button"
              className={type === 'rent' ? 'formButtonActive' : 'formButton'}
              id="type"
              value="rent"
              onClick={onMutate}
            >
              Rent
            </button>
          </div>

          {/* name input */}
          <label className="formLabel">Name</label>
          <input
            type="text"
            id="name"
            className="formInputName"
            value={name}
            onChange={onMutate}
            maxLength="32"
            minLength="10"
            required
          />

          {/* bedroom and bathroom */}
          <div className="formRooms flex">
            <div>
              <label className="formLabel">Bedrooms</label>
              <input
                type="number"
                id="bedrooms"
                className="formInputSmall"
                value={bedrooms}
                onChange={onMutate}
                min="1"
                max="50"
                required
              />
            </div>

            <div>
              <label className="formLabel">Bathrooms</label>
              <input
                type="number"
                id="bathrooms"
                className="formInputSmall"
                value={bathrooms}
                onChange={onMutate}
                min="1"
                max="50"
                required
              />
            </div>
          </div>

          {/* parking spot */}
          <label className="formLabel">Parking Spot</label>
          <div className="formButtons">
            <button
              type="button"
              className={parking ? 'formButtonActive' : 'formButton'}
              id="parking"
              value={true}
              onClick={onMutate}
              max="50"
              min="1"
            >
              Yes
            </button>

            <button
              type="button"
              className={!parking && parking !== null ? 'formButtonActive' : 'formButton'}
              id="parking"
              value={false}
              onClick={onMutate}
            >
              No
            </button>
          </div>

          {/* furnished button */}
          <label className="formLabel">Furnished</label>
          <div className="formButtons">
            <button
              type="button"
              className={furnished ? 'formButtonActive' : 'formButton'}
              id="furnished"
              value={true}
              onClick={onMutate}
            >
              Yes
            </button>

            <button
              type="button"
              className={!furnished && furnished !== null ? 'formButtonActive' : 'formButton'}
              id="furnished"
              value={false}
              onClick={onMutate}
            >
              No
            </button>
          </div>

          {/* address */}
          <label className="formLabel">Address</label>
          <textarea
            id="address"
            className="formInputAddress"
            type="text"
            value={address}
            onChange={onMutate}
            required
          />

          {/* geolocation manual input */}
          {!geolocationEnabled && (
            <div className="formLatLng flex">
              <div>
                <label className="formLabel">Latitude</label>
                <input
                  type="number"
                  className="formInputSmall"
                  id="latitude"
                  value={latitude}
                  onChange={onMutate}
                  required
                />
              </div>

              <div>
                <label className="formLabel">Longitude</label>
                <input
                  type="number"
                  className="formInputSmall"
                  id="longitude"
                  value={longitude}
                  onChange={onMutate}
                  required
                />
              </div>
            </div>
          )}

          {/* Offer buttons */}
          <label className="formLabel">Offer</label>
          <div className="formButtons">
            <button
              type="button"
              className={offer ? 'formButtonActive' : 'formButton'}
              id="offer"
              value={true}
              onClick={onMutate}
            >
              Yes
            </button>

            <button
              type="button"
              className={!offer && offer !== null ? 'formButtonActive' : 'formButton'}
              id="offer"
              value={false}
              onClick={onMutate}
            >
              No
            </button>
          </div>

          {/* Regular Price input */}
          <label className="formLabel">Regular Price</label>
          <div className="formPriceDiv">
            <input
              type="number"
              id="regularPrice"
              className="formInputSmall"
              value={regularPrice}
              onChange={onMutate}
              min="50"
              max="750000000"
              required
            />
            {type === 'rent' && <p className="formPriceText">€ / Month</p>}
          </div>

          {/* discounted price input */}
          {offer && (
            <>
              <label className="formLabel">Discounted Price</label>
              <div className="formPriceDiv">
                <input
                  type="number"
                  id="discountedPrice"
                  className="formInputSmall"
                  value={discountedPrice}
                  onChange={onMutate}
                  min="50"
                  max="750000000"
                  required={offer}
                />
                {type === 'rent' && <p className="formPriceText">€ / Month</p>}
              </div>
            </>
          )}

          {/* images field */}
          <label className="formLabel">Images</label>
          <p className="imagesInfo">The first image will be the cover (max 6)</p>
          <input
            type="file"
            id="images"
            className="formInputFile"
            onChange={onMutate}
            max="6"
            accept=".jpg,.png,.jpeg"
            multiple
            required
          />

          <button type="submit" className="primaryButton createListingButton">
            Create Listing
          </button>
        </form>
      </main>
    </div>
  );
};

export default CreateListing;
