import axios from 'axios';

const mockExternalListings = [
  {
    "id": "ext_001",
    "title": "Green Meadows 2BHK Apartment",
    "address": "Saveetha Nagar, Chettipedu, Chennai",
    "city": "Chennai",
    "price": 12000,
    "bedrooms": 2,
    "bathrooms": 2,
    "propertyType": "APARTMENT",
    "contactNumber": "+91 94441 54914",
    "source": "External MLS API Feed",
    "imageUrl": "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80"
  },
  {
    "id": "ext_002",
    "title": "Marina Beach Vista House",
    "address": "No 12, Marina Beach Road, Santhome, Chennai",
    "city": "Chennai",
    "price": 28000,
    "bedrooms": 3,
    "bathrooms": 3,
    "propertyType": "HOUSE",
    "contactNumber": "+91 98400 12345",
    "source": "External MLS API Feed",
    "imageUrl": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80"
  },
  {
    "id": "ext_003",
    "title": "Jayanagar Premium PG for Gents & Ladies",
    "address": "4th Block, 10th Main, Jayanagar, Bangalore",
    "city": "Bangalore",
    "price": 8500,
    "bedrooms": 1,
    "bathrooms": 1,
    "propertyType": "PG",
    "contactNumber": "+91 80265 99999",
    "source": "External MLS API Feed",
    "imageUrl": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80"
  },
  {
    "id": "ext_004",
    "title": "Indiranagar Executive Studio",
    "address": "100 Feet Road, Indiranagar, Bangalore",
    "city": "Bangalore",
    "price": 18000,
    "bedrooms": 1,
    "bathrooms": 1,
    "propertyType": "APARTMENT",
    "contactNumber": "+91 99000 88888",
    "source": "External MLS API Feed",
    "imageUrl": "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80"
  }
];

console.log('Sending request to npoint.io...');
axios.post('https://api.npoint.io/cbd1d9e2b8344e1329bf', mockExternalListings)
  .then(res => {
    console.log('Successfully created! Endpoint is:');
    console.log('https://api.npoint.io/cbd1d9e2b8344e1329bf');
  })
  .catch(err => {
    // If specific bin post fails, let's create a new dynamic bin
    axios.post('https://api.npoint.io', mockExternalListings)
      .then(res2 => {
        console.log('Successfully created dynamic bin! ID:', res2.data.binId);
        console.log(`Endpoint: https://api.npoint.io/${res2.data.binId}`);
      })
      .catch(err2 => {
        console.error('Failed to create bin:', err2.message);
      });
  });
