import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreatePropertyMutation } from '../hooks/useProperty';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { 
  Building2, MapPin, DollarSign, BedDouble, Bath, Maximize, 
  Sparkles, Upload, Image as ImageIcon, Trash2, ArrowRight, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const defaultIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapPickerEvents({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function UpdateMapCenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, 15);
    }
  }, [center, map]);
  return null;
}

const AMENITIES_LIST = [
  'Swimming Pool', 'Gym / Fitness Center', 'High-Speed Wi-Fi', 'Power Backup',
  '24/7 Security', 'Covered Parking', 'Elevator', 'Private Balcony',
  'Air Conditioning', 'Pet Friendly', 'Garden / Lawn', 'Clubhouse'
];

const createPropertySchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(1, 'Zip code is required'),
  contactNumber: z.string().min(10, 'Contact number must be at least 10 digits'),
  latitude: z.preprocess((val) => Number(val), z.number().min(-90).max(90)),
  longitude: z.preprocess((val) => Number(val), z.number().min(-180).max(180)),
  price: z.preprocess((val) => Number(val), z.number().min(0, 'Price must be positive')),
  bedrooms: z.preprocess((val) => Number(val), z.number().min(0)),
  bathrooms: z.preprocess((val) => Number(val), z.number().min(0)),
  area: z.preprocess((val) => Number(val), z.number().min(0)),
  propertyType: z.enum(['APARTMENT', 'HOUSE', 'CONDO', 'VILLA']),
  furnishing: z.enum(['FURNISHED', 'SEMI-FURNISHED', 'UNFURNISHED']),
  amenities: z.array(z.string()).default([]),
  upiId: z.string().optional().default(''),
  bankAccountNumber: z.string().optional().default(''),
  bankIfscCode: z.string().optional().default(''),
});

export default function ListProperty() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const createMutation = useCreatePropertyMutation({
    onSuccess: () => {
      const targetDashboard = user?.role === 'RENTER' ? '/dashboard/renter' : '/dashboard/owner';
      navigate(targetDashboard);
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createPropertySchema),
    defaultValues: {
      title: '',
      description: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      contactNumber: '',
      latitude: 12.9716, // Default Bangalore center lat
      longitude: 77.5946, // Default Bangalore center lng
      price: '',
      bedrooms: '',
      bathrooms: '',
      area: '',
      propertyType: 'APARTMENT',
      furnishing: 'UNFURNISHED',
      amenities: [],
      upiId: user?.upiId || '',
      bankAccountNumber: user?.bankAccountNumber || '',
      bankIfscCode: user?.bankIfscCode || '',
    },
  });

  const location = useLocation();

  useEffect(() => {
    if (location.state?.externalProperty) {
      const ext = location.state.externalProperty;
      setValue('title', ext.title || '');
      setValue('description', ext.description || `${ext.title} is available for rent with full security.`);
      setValue('address', ext.address || '');
      setValue('city', ext.city || 'Chennai');
      setValue('state', 'Tamil Nadu');
      setValue('zipCode', '600053');
      setValue('price', ext.price ? Number(ext.price) : '');
      setValue('bedrooms', ext.bedrooms ? Number(ext.bedrooms) : '');
      setValue('bathrooms', ext.bathrooms ? Number(prop => prop.bathrooms) : 2);
      setValue('contactNumber', ext.contactNumber || '');
      setValue('area', 1200);
      setValue('propertyType', ext.propertyType === 'PG' ? 'APARTMENT' : ext.propertyType);
      if (ext.latitude && ext.longitude) {
        setValue('latitude', Number(ext.latitude));
        setValue('longitude', Number(ext.longitude));
      }
    }
  }, [location, setValue]);

  const selectedAmenities = watch('amenities');

  const locateCoordinates = async () => {
    const vals = watch();
    if (!vals.address || !vals.city) {
      alert("Please enter street address and city first.");
      return;
    }
    const query = `${vals.address}, ${vals.city}, ${vals.state || ''}`;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        setValue('latitude', parseFloat(data[0].lat));
        setValue('longitude', parseFloat(data[0].lon));
      } else {
        // Fallback 1: try searching just the last part of the address (e.g. Chettipedu)
        const addressParts = vals.address.split(',').map(s => s.trim()).filter(Boolean);
        let found = false;
        if (addressParts.length > 1) {
          const lastSegment = addressParts[addressParts.length - 1].replace(/\.$/, ''); // clean trailing dot
          const subRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(lastSegment)}&limit=1`);
          const subData = await subRes.json();
          if (subData && subData.length > 0) {
            setValue('latitude', parseFloat(subData[0].lat));
            setValue('longitude', parseFloat(subData[0].lon));
            found = true;
          }
        }

        // Fallback 2: final fallback to city center
        if (!found) {
          const fallbackRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(vals.city)}&limit=1`);
          const fallbackData = await fallbackRes.json();
          if (fallbackData && fallbackData.length > 0) {
            setValue('latitude', parseFloat(fallbackData[0].lat));
            setValue('longitude', parseFloat(fallbackData[0].lon));
          } else {
            alert("Coordinates auto-lookup failed. Please input them manually.");
          }
        }
      }
    } catch (err) {
      console.error(err);
      alert("Error looking up address. Please type coordinates manually.");
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 10) {
      alert('You can only upload up to 10 images');
      return;
    }

    setImages(prev => [...prev, ...files]);

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const toggleAmenity = (amenity) => {
    const current = selectedAmenities || [];
    const updated = current.includes(amenity)
      ? current.filter(a => a !== amenity)
      : [...current, amenity];
    setValue('amenities', updated);
  };

  const onSubmit = (data) => {
    const formData = new FormData();
    // Append standard fields
    Object.keys(data).forEach(key => {
      if (key === 'amenities') {
        formData.append(key, JSON.stringify(data[key]));
      } else {
        formData.append(key, data[key]);
      }
    });

    // Append images
    images.forEach(image => {
      formData.append('images', image);
    });

    createMutation.mutate(formData);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold gold-gradient-text flex items-center gap-2">
          <Building2 size={28} />
          List New Property
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Provide accurate details to list your luxury property and submit for review.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Core Description Panel */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200/60 dark:border-slate-900 shadow-lg space-y-6">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-900 pb-3 flex items-center gap-2">
            <Sparkles size={18} className="text-amber-500" />
            Property Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Property Title
              </label>
              <input
                type="text"
                {...register('title')}
                placeholder="e.g. Premium 3BHK Penthouse with Sea View"
                className="w-full bg-slate-100/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-900 rounded-xl py-3 px-4 text-sm text-slate-800 dark:text-slate-250 focus:outline-none focus:border-brand-500"
              />
              {errors.title && <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.title.message}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Description
              </label>
              <textarea
                rows={4}
                {...register('description')}
                placeholder="Provide a descriptive overview highlighting keys, space size, surrounding areas..."
                className="w-full bg-slate-100/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-900 rounded-xl py-3 px-4 text-sm text-slate-800 dark:text-slate-250 focus:outline-none focus:border-brand-500"
              ></textarea>
              {errors.description && <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.description.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Property Type
              </label>
              <select
                {...register('propertyType')}
                className="w-full bg-slate-100/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-900 rounded-xl py-3 px-4 text-sm text-slate-800 dark:text-slate-250 focus:outline-none focus:border-brand-500"
              >
                <option value="APARTMENT">Apartment</option>
                <option value="HOUSE">House</option>
                <option value="CONDO">Condo</option>
                <option value="VILLA">Villa</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Furnishing Status
              </label>
              <select
                {...register('furnishing')}
                className="w-full bg-slate-100/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-900 rounded-xl py-3 px-4 text-sm text-slate-800 dark:text-slate-250 focus:outline-none focus:border-brand-500"
              >
                <option value="UNFURNISHED">Unfurnished</option>
                <option value="SEMI-FURNISHED">Semi-Furnished</option>
                <option value="FURNISHED">Fully Furnished</option>
              </select>
            </div>
          </div>
        </div>

        {/* Pricing & Dimensions Panel */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200/60 dark:border-slate-900 shadow-lg space-y-6">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-900 pb-3 flex items-center gap-2">
            <DollarSign size={18} className="text-brand-500" />
            Pricing & Specifications
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Price (INR / Month)
              </label>
              <input
                type="number"
                {...register('price')}
                placeholder="45000"
                className="w-full bg-slate-100/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-900 rounded-xl py-3 px-4 text-sm text-slate-800 dark:text-slate-250 focus:outline-none focus:border-brand-500"
              />
              {errors.price && <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.price.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                <BedDouble size={14} /> Bedrooms
              </label>
              <input
                type="number"
                {...register('bedrooms')}
                placeholder="3"
                className="w-full bg-slate-100/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-900 rounded-xl py-3 px-4 text-sm text-slate-800 dark:text-slate-250 focus:outline-none focus:border-brand-500"
              />
              {errors.bedrooms && <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.bedrooms.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                <Bath size={14} /> Bathrooms
              </label>
              <input
                type="number"
                {...register('bathrooms')}
                placeholder="2"
                className="w-full bg-slate-100/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-900 rounded-xl py-3 px-4 text-sm text-slate-800 dark:text-slate-250 focus:outline-none focus:border-brand-500"
              />
              {errors.bathrooms && <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.bathrooms.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                <Maximize size={14} /> Area (Sq.Ft)
              </label>
              <input
                type="number"
                {...register('area')}
                placeholder="1650"
                className="w-full bg-slate-100/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-900 rounded-xl py-3 px-4 text-sm text-slate-800 dark:text-slate-250 focus:outline-none focus:border-brand-500"
              />
              {errors.area && <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.area.message}</p>}
            </div>
          </div>
        </div>

        {/* Payout Settings Panel */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200/60 dark:border-slate-900 shadow-lg space-y-6">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-900 pb-3 flex items-center gap-2">
            <DollarSign size={18} className="text-emerald-500" />
            Landlord Payout Settings (Rent Payouts)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                UPI ID (Recommended)
              </label>
              <input
                type="text"
                {...register('upiId')}
                placeholder="landlord@okaxis"
                className="w-full bg-slate-100/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-900 rounded-xl py-3 px-4 text-sm text-slate-800 dark:text-slate-250 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Bank Account Number
              </label>
              <input
                type="text"
                {...register('bankAccountNumber')}
                placeholder="987654321098"
                className="w-full bg-slate-100/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-900 rounded-xl py-3 px-4 text-sm text-slate-800 dark:text-slate-250 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Bank IFSC Code
              </label>
              <input
                type="text"
                {...register('bankIfscCode')}
                placeholder="SBIN0001234"
                className="w-full bg-slate-100/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-900 rounded-xl py-3 px-4 text-sm text-slate-800 dark:text-slate-250 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Location Information Panel */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200/60 dark:border-slate-900 shadow-lg space-y-6">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-900 pb-3 flex items-center gap-2">
            <MapPin size={18} className="text-sky-500" />
            Address & Location Coordinates
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Street Address
              </label>
              <input
                type="text"
                {...register('address')}
                placeholder="123 Luxury Avenue, Indira Nagar"
                className="w-full bg-slate-100/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-900 rounded-xl py-3 px-4 text-sm text-slate-800 dark:text-slate-250 focus:outline-none focus:border-brand-500"
              />
              {errors.address && <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.address.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                City
              </label>
              <input
                type="text"
                {...register('city')}
                placeholder="Bangalore"
                className="w-full bg-slate-100/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-900 rounded-xl py-3 px-4 text-sm text-slate-800 dark:text-slate-250 focus:outline-none focus:border-brand-500"
              />
              {errors.city && <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.city.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                State
              </label>
              <input
                type="text"
                {...register('state')}
                placeholder="Karnataka"
                className="w-full bg-slate-100/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-900 rounded-xl py-3 px-4 text-sm text-slate-800 dark:text-slate-250 focus:outline-none focus:border-brand-500"
              />
              {errors.state && <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.state.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Zip Code
              </label>
              <input
                type="text"
                {...register('zipCode')}
                placeholder="560038"
                className="w-full bg-slate-100/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-900 rounded-xl py-3 px-4 text-sm text-slate-800 dark:text-slate-250 focus:outline-none focus:border-brand-500"
              />
              {errors.zipCode && <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.zipCode.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Contact Number
              </label>
              <input
                type="text"
                {...register('contactNumber')}
                placeholder="+91 98765 43210"
                className="w-full bg-slate-100/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-900 rounded-xl py-3 px-4 text-sm text-slate-800 dark:text-slate-250 focus:outline-none focus:border-brand-500"
              />
              {errors.contactNumber && <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.contactNumber.message}</p>}
            </div>

            <div className="md:col-span-2 flex flex-col md:flex-row items-end gap-4">
              <div className="flex-grow grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Latitude
                  </label>
                  <input
                    type="text"
                    {...register('latitude')}
                    className="w-full bg-slate-100/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-900 rounded-xl py-3 px-4 text-sm text-slate-800 dark:text-slate-250 focus:outline-none"
                  />
                  {errors.latitude && <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.latitude.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Longitude
                  </label>
                  <input
                    type="text"
                    {...register('longitude')}
                    className="w-full bg-slate-100/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-900 rounded-xl py-3 px-4 text-sm text-slate-800 dark:text-slate-250 focus:outline-none"
                  />
                  {errors.longitude && <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.longitude.message}</p>}
                </div>
              </div>
              <button
                type="button"
                onClick={locateCoordinates}
                className="w-full md:w-auto bg-sky-500 hover:bg-sky-600 text-white font-bold py-3.5 px-6 rounded-xl text-xs transition duration-200 flex-shrink-0 flex items-center justify-center gap-1.5"
              >
                <MapPin size={14} /> Auto-Detect Coordinates
              </button>
            </div>

            <div className="md:col-span-2 mt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                Drag or Click on Map to Pin Exact Location
              </label>
              <div className="h-60 w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-900 relative">
                <MapContainer
                  center={[watch('latitude') || 13.0827, watch('longitude') || 80.2707]}
                  zoom={14}
                  scrollWheelZoom={true}
                  className="h-full w-full z-10"
                >
                  <TileLayer
                    attribution='&copy; Google Maps'
                    url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                    className="map-tiles"
                  />
                  <UpdateMapCenter center={[watch('latitude'), watch('longitude')]} />
                  <MapPickerEvents
                    onLocationSelect={(lat, lng) => {
                      setValue('latitude', parseFloat(lat.toFixed(6)));
                      setValue('longitude', parseFloat(lng.toFixed(6)));
                    }}
                  />
                  {watch('latitude') && watch('longitude') && (
                    <Marker
                      position={[watch('latitude'), watch('longitude')]}
                      icon={defaultIcon}
                    />
                  )}
                </MapContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Amenities Selection */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200/60 dark:border-slate-900 shadow-lg space-y-6">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-900 pb-3">
            Amenities
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {AMENITIES_LIST.map((amenity) => {
              const isChecked = selectedAmenities?.includes(amenity);
              return (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className={`py-3 px-4 text-xs font-bold rounded-xl border text-left transition-all duration-300 ${
                    isChecked
                      ? 'border-brand-500 bg-brand-500/10 text-brand-500 dark:text-brand-400'
                      : 'border-slate-200 dark:border-slate-900 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-800'
                  }`}
                >
                  {amenity}
                </button>
              );
            })}
          </div>
        </div>

        {/* File Drag Drop Panel */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200/60 dark:border-slate-900 shadow-lg space-y-6">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-900 pb-3 flex items-center gap-2">
            <Upload size={18} className="text-indigo-500" />
            Upload Pictures
          </h2>

          <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center hover:border-brand-500 transition-colors duration-300 relative cursor-pointer">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-500 flex items-center justify-center">
                <ImageIcon size={24} />
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Click or drag images here
              </p>
              <p className="text-xs text-slate-450 dark:text-slate-500">
                Support JPG, PNG, WEBP files up to 10 total pictures (max 5MB each)
              </p>
            </div>
          </div>

          {/* Image Previews */}
          <AnimatePresence>
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {imagePreviews.map((preview, index) => (
                  <motion.div
                    key={preview}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative aspect-video rounded-xl overflow-hidden group shadow-md border border-slate-200 dark:border-slate-900"
                  >
                    <img src={preview} alt="preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute inset-0 bg-black/40 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex text-white"
                    >
                      <Trash2 size={18} className="text-rose-500" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-3.5 rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="bg-gradient-to-r from-brand-500 to-sky-600 hover:from-brand-600 hover:to-sky-700 text-white font-bold py-3.5 px-8 rounded-xl transition duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-brand-500/20 disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
          >
            {createMutation.isPending ? (
              'Submitting...'
            ) : (
              <>
                Submit Listing
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
