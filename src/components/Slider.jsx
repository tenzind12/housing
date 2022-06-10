import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDocs, collection, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase.config';
import { Navigation, Pagination, Scrollbar, A11y } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import Spinner from './Spinner';

const Slider = () => {
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState(null);
  const navigate = useNavigate();

  //   fetch all listings
  useEffect(() => {
    (async () => {
      const listingsRef = collection(db, 'listings');
      const q = query(listingsRef, orderBy('timestamp', 'desc'), limit(5));
      const querySnap = await getDocs(q);

      let listingsArray = [];
      querySnap.forEach((doc) => {
        return listingsArray.push({
          id: doc.id,
          data: doc.data(),
        });
      });
      setListings(listingsArray);
      setLoading(false);
    })();
  }, [listings]);

  if (loading) return <Spinner />;

  // if no listings, dont take blank white space
  if (listings.length === 0) return <></>;

  return (
    listings && (
      <>
        <p className="exploreHeading">Recommended</p>
        <Swiper
          modules={[Navigation, Pagination, Scrollbar, A11y]}
          // spaceBetween={50}
          // navigation
          slidesPerView={1}
          scrollbar={{ draggable: true }}
          pagination={{ clickable: true }}
        >
          {listings.map(({ data, id }) => (
            <SwiperSlide key={id} onClick={() => navigate(`/category/${data.type}/${id}`)}>
              <div
                style={{
                  background: `url(${data.imageUrls[0]}) center no-repeat`,
                  height: '300px',
                  backgroundSize: 'cover',
                  cursor: 'pointer',
                }}
                className="swiperSlideDiv"
              >
                <p className="swiperSlideText">{data.name}</p>
                <p className="swiperSlidePrice">
                  €{data.discountedPrice ?? data.regularPrice} {data.type === 'rent' && '/ month'}
                </p>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </>
    )
  );
};

export default Slider;
