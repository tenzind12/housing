import { Link } from 'react-router-dom';
import { ReactComponent as DeleteIcon } from '../assets/svg/deleteIcon.svg';
import { ReactComponent as EditIcon } from '../assets/svg/editIcon.svg';
import bedIcon from '../assets/svg/bedIcon.svg';
import bathtubIcon from '../assets/svg/bathtubIcon.svg';

const ListingItem = ({ listing, id, onDelete, onEdit }) => {
  return (
    <li className="categoryListing">
      <Link to={`/category/${listing.type}/${id}`} className="categoryListingLink">
        <img src={listing.imageUrls[0]} alt={listing.name} className="categoryListingImg" />
        <div className="categoryListingDetails">
          <p className="categoryListingLocation">{listing.location}</p>
          <p className="categoryListingName">{listing.name}</p>

          <p className="categoryListingPrice">
            €
            {listing.offer
              ? listing.discountedPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
              : listing.regularPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            {listing.type === 'rent' && ' / Month'}
          </p>

          <div className="categoryListingInfoDiv">
            <img src={bedIcon} alt="bed" />
            <p className="categoryListingInfoText">
              {listing.bedrooms > 1 ? listing.bedrooms + ' Bedrooms' : '1 Bedroom'}
            </p>

            <img src={bathtubIcon} alt="bathtub" />
            <p className="categoryListingInfoText">
              {listing.bathroom > 1 ? listing.bathroom + ' Bathrooms' : '1 Bathroom'}
            </p>
          </div>
        </div>
      </Link>

      {/* on delete button */}
      {onDelete && (
        <DeleteIcon
          className="removeIcon"
          fill="rgb(231,76,60)"
          onClick={() => onDelete(listing.id)}
        />
      )}

      {/* edit button button*/}
      {onEdit && <EditIcon className="editIcon" fill="#777" onClick={() => onEdit(id)} />}
    </li>
  );
};

export default ListingItem;
