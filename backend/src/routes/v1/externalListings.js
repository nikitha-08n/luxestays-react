import express from 'express';
import ApiResponse from '../../utils/ApiResponse.js';

const router = express.Router();

const CITIES = [
  'Agra', 'Ahmedabad', 'Amritsar', 'Aurangabad', 'Prayagraj', 'Ajmer', 'Aizawl',
  'Bengaluru', 'Bhopal', 'Bhubaneswar', 'Bareilly', 'Belgaum', 'Bikaner', 'Bhuvanagiri',
  'Chennai', 'Chandigarh', 'Coimbatore', 'Cuttack', 'Calicut',
  'Delhi', 'Dehradun', 'Durgapur', 'Dindigul', 'Davanagere', 'Dharwad',
  'Erode', 'Kochi',
  'Faridabad', 'Firozabad', 'Faizabad',
  'Guwahati', 'Gwalior', 'Gandhinagar', 'Guntur', 'Gorakhpur', 'Gurugram',
  'Hyderabad', 'Hubli', 'Haridwar', 'Hissar', 'Hospet',
  'Indore', 'Imphal', 'Itanagar',
  'Jaipur', 'Jodhpur', 'Jabalpur', 'Jammu', 'Jamshedpur', 'Jhansi', 'Jamnagar',
  'Kolkata', 'Kanpur', 'Kozhikode', 'Kottayam', 'Kurnool', 'Karimnagar',
  'Lucknow', 'Ludhiana', 'Leh', 'Latur',
  'Mumbai', 'Madurai', 'Mysuru', 'Mangaluru', 'Meerut', 'Moradabad', 'Malegaon',
  'New Delhi', 'Nagpur', 'Nashik', 'Nellore', 'Noida', 'Nagercoil',
  'Ooty', 'Ongole',
  'Pune', 'Patna', 'Puducherry', 'Palakkad', 'Patiala',
  'Kollam',
  'Raipur', 'Ranchi', 'Rajkot', 'Rourkela', 'Rajahmundry',
  'Surat', 'Srinagar', 'Shimla', 'Salem', 'Srikakulam', 'Shillong', 'Siliguri',
  'Thiruvananthapuram', 'Tirunelveli', 'Tirupur', 'Trichy', 'Thane', 'Thoothukudi', 'Thanjavur',
  'Udaipur', 'Ujjain', 'Udupi',
  'Vizag', 'Vijayawada', 'Varanasi', 'Vadodara', 'Vellore',
  'Warangal', 'Wadhwan',
  'Yadgir', 'Yamunanagar',
  'Zunheboto'
];

const CITY_BASE_COORDS = {
  Agra: [27.1767, 78.0081],
  Ahmedabad: [23.0225, 72.5714],
  Amritsar: [31.6340, 74.8723],
  Aurangabad: [19.8762, 75.3433],
  Prayagraj: [25.4358, 81.8463],
  Ajmer: [26.4499, 74.6399],
  Aizawl: [23.7307, 92.7173],
  Bengaluru: [12.9716, 77.5946],
  Bhopal: [23.2599, 77.4126],
  Bhubaneswar: [20.2961, 85.8245],
  Bareilly: [28.3640, 79.4150],
  Belgaum: [15.8497, 74.4977],
  Bikaner: [28.0166, 73.3119],
  Bhuvanagiri: [17.5113, 78.8870],
  Chennai: [13.0827, 80.2707],
  Chandigarh: [30.7333, 76.7794],
  Coimbatore: [11.0168, 76.9558],
  Cuttack: [20.4625, 85.8830],
  Calicut: [11.2588, 75.7804],
  Delhi: [28.6139, 77.2090],
  Dehradun: [30.3165, 78.0322],
  Durgapur: [23.5204, 87.3119],
  Dindigul: [10.3673, 77.9806],
  Davanagere: [14.4644, 75.9218],
  Dharwad: [15.4589, 75.0078],
  Erode: [11.3410, 77.7172],
  Kochi: [9.9312, 76.2673],
  Faridabad: [28.4089, 77.3178],
  Firozabad: [27.1513, 78.3957],
  Faizabad: [26.7844, 82.1437],
  Guwahati: [26.1158, 91.7086],
  Gwalior: [26.2183, 78.1828],
  Gandhinagar: [23.2156, 72.6369],
  Guntur: [16.3067, 80.4365],
  Gorakhpur: [26.7606, 83.3731],
  Gurugram: [28.4595, 77.0266],
  Hyderabad: [17.3850, 78.4867],
  Hubli: [15.3647, 75.1240],
  Haridwar: [29.9457, 78.1642],
  Hissar: [29.1492, 75.7217],
  Hospet: [15.2689, 76.3909],
  Indore: [22.7196, 75.8577],
  Imphal: [24.8170, 93.9368],
  Itanagar: [27.0844, 93.6053],
  Jaipur: [26.9124, 75.7873],
  Jodhpur: [26.2389, 73.0243],
  Jabalpur: [23.1686, 79.9339],
  Jammu: [32.7266, 74.8570],
  Jamshedpur: [22.8046, 86.2029],
  Jhansi: [25.4484, 78.5685],
  Jamnagar: [22.4707, 70.0577],
  Kolkata: [22.5726, 88.3639],
  Kanpur: [26.4499, 80.3319],
  Kozhikode: [11.2588, 75.7804],
  Kottayam: [9.5916, 76.5220],
  Kurnool: [15.8281, 78.0373],
  Karimnagar: [18.4386, 79.1288],
  Lucknow: [26.8467, 80.9462],
  Ludhiana: [30.9010, 75.8573],
  Leh: [34.1526, 77.5770],
  Latur: [18.4088, 76.5630],
  Mumbai: [19.0760, 72.8777],
  Madurai: [9.9252, 78.1198],
  Mysuru: [12.2958, 76.6394],
  Mangaluru: [12.9141, 74.8560],
  Meerut: [28.9845, 77.7064],
  Moradabad: [28.8386, 78.7733],
  Malegaon: [20.5523, 74.5307],
  'New Delhi': [28.6139, 77.2090],
  Nagpur: [21.1458, 79.0882],
  Nashik: [19.9975, 73.7898],
  Nellore: [14.4426, 79.9865],
  Noida: [28.5355, 77.3910],
  Nagercoil: [8.1830, 77.4119],
  Ooty: [11.4102, 76.6950],
  Ongole: [15.5057, 80.0499],
  Pune: [18.5204, 73.8567],
  Patna: [25.5941, 85.1376],
  Puducherry: [11.9416, 79.8083],
  Palakkad: [10.7867, 76.6548],
  Patiala: [30.3398, 76.3869],
  Kollam: [8.8932, 76.6141],
  Raipur: [21.2514, 81.6296],
  Ranchi: [23.3441, 85.3096],
  Rajkot: [22.3039, 70.8022],
  Rourkela: [22.2604, 84.8536],
  Rajahmundry: [17.0005, 81.8040],
  Surat: [21.1702, 72.8311],
  Srinagar: [34.0837, 74.7973],
  Shimla: [31.1048, 77.1734],
  Salem: [11.6643, 78.1460],
  Srikakulam: [18.2949, 83.8938],
  Shillong: [25.5788, 91.8833],
  Siliguri: [26.7271, 88.3953],
  Thiruvananthapuram: [8.5241, 76.9366],
  Tirunelveli: [8.7139, 77.7567],
  Tirupur: [11.1085, 77.3411],
  Trichy: [10.7905, 78.7047],
  Thane: [19.2183, 72.9781],
  Thoothukudi: [8.7642, 78.1348],
  Thanjavur: [10.7870, 79.1378],
  Udaipur: [24.5854, 73.7125],
  Ujjain: [23.1760, 75.7885],
  Udupi: [13.3409, 74.7421],
  Vizag: [17.6868, 83.2185],
  Vijayawada: [16.5062, 80.6480],
  Varanasi: [25.3176, 82.9739],
  Vadodara: [22.3072, 73.1812],
  Vellore: [12.9165, 79.1325],
  Warangal: [17.9784, 79.5941],
  Wadhwan: [22.7212, 71.6781],
  Yadgir: [16.7646, 77.1377],
  Yamunanagar: [30.1290, 77.2674],
  Zunheboto: [25.9723, 94.5208]
};

const AREAS = {
  Chennai: ['Ambattur', 'Velachery', 'Adyar', 'T. Nagar', 'Mylapore', 'Anna Nagar', 'Guindy', 'Chettipedu'],
  Bengaluru: ['Jayanagar', 'Indiranagar', 'Koramangala', 'HSR Layout', 'Whitefield', 'Marathahalli', 'Electronic City'],
  Delhi: ['Connaught Place', 'South Extension', 'Karol Bagh', 'Dwarka', 'Vasant Kunj', 'Saket', 'Rajouri Garden'],
  Hyderabad: ['Gachibowli', 'Madhapur', 'Jubilee Hills', 'Banjara Hills', 'Kondapur', 'Begumpet', 'Secunderabad'],
  Mumbai: ['Andheri West', 'Bandra West', 'Juhu', 'Colaba', 'Powai', 'Worli', 'Malad East'],
  Kolkata: ['Salt Lake', 'New Town', 'Park Street', 'Ballygunge', 'Tollygunge', 'Dum Dum'],
  Pune: ['Koregaon Park', 'Kothrud', 'Viman Nagar', 'Hinjewadi', 'Baner', 'Hadapsar'],
  Coimbatore: ['Gandhipuram', 'Peelamedu', 'R.S. Puram', 'Saibaba Colony', 'Singanallur'],
  Madurai: ['K.K. Nagar', 'Anna Nagar', 'Simmakkal', 'Tallakulam', 'Sellur'],
  Mysuru: ['Gokulam', 'Jayalakshmipuram', 'Hebbal', 'Vijayanagar', 'Siddhartha Layout'],
  Tirunelveli: ['Palayamkottai', 'Melapalayam', 'Tirunelveli Town', 'Vannarpettai'],
  Salem: ['Fairlands', 'Alagapuram', 'Meyyanur', 'Hastampatti', 'Suramangalam'],
  Trichy: ['Thillai Nagar', 'Cantonment', 'KK Nagar', 'Srirangam', 'Lalgudi']
};

const IMAGES = {
  APARTMENT: [
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80'
  ],
  HOUSE: [
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&w=600&q=80'
  ],
  PG: [
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80'
  ]
};

const ADJECTIVES = ['Premium', 'Luxury', 'Cozy', 'Elegant', 'Modern', 'Spacious', 'Comfortable', 'Stunning', 'Budget-friendly'];
const AMENITIES_POOL = [
  '24/7 Security', 'High-Speed Wi-Fi', 'Pet Friendly', 'Gym / Fitness Center',
  'Air Conditioning', 'Power Backup', 'Swimming Pool', 'Garden / Lawn',
  'Private Balcony', 'Elevator', 'Clubhouse'
];

// Generate 300 listings across all 115 cities with geographical coordinates
const generateListings = () => {
  const listings = [];
  for (let i = 1; i <= 300; i++) {
    const city = CITIES[i % CITIES.length];
    const cityAreas = AREAS[city] || [`${city} Central Area`, `${city} Suburbs`, `${city} Bypass Road`, `${city} Gandhi Nagar`];
    const area = cityAreas[i % cityAreas.length];
    const propertyTypes = ['APARTMENT', 'HOUSE', 'PG'];
    const propertyType = propertyTypes[i % propertyTypes.length];
    const adjective = ADJECTIVES[i % ADJECTIVES.length];
    
    let bedrooms = (i % 4) + 1;
    let bathrooms = (i % 3) + 1;
    let price = 5000 + (i * 380);
    
    if (propertyType === 'PG') {
      bedrooms = 1;
      bathrooms = 1;
      price = 4500 + (i * 45);
    }

    const title = `${adjective} ${propertyType === 'PG' ? 'PG Room' : propertyType.charAt(0) + propertyType.slice(1).toLowerCase()} in ${area}`;
    const address = `Flat ${10 + (i % 90)}, ${i % 2 === 0 ? 'Ganesh Colony' : 'Venkateswara Nagar'}, ${area}`;
    
    // Distinct mobile numbers
    const contactNumber = `+91 ${9000000000 + (i * 444444) % 99999999}`;
    const description = `This is a beautiful ${bedrooms} BHK ${propertyType.toLowerCase()} located in ${area}, ${city}. Includes top-tier facilities, nearby transport links, and full security.`;
    
    // Image selection
    const imgs = IMAGES[propertyType];
    const imageUrl = imgs[i % imgs.length];

    // Amenities list
    const amenities = AMENITIES_POOL.filter((_, idx) => (i + idx) % 3 === 0);

    // Compute realistic, scattered coordinates for map rendering
    const baseCoords = CITY_BASE_COORDS[city] || [13.0827, 80.2707];
    const latitude = Number((baseCoords[0] + (i * 0.0017 - 0.0035) % 0.015).toFixed(6));
    const longitude = Number((baseCoords[1] + (i * 0.0017 - 0.0035) % 0.015).toFixed(6));

    listings.push({
      id: `ext_${String(i).padStart(3, '0')}`,
      title,
      address,
      city,
      price,
      bedrooms,
      bathrooms,
      propertyType,
      contactNumber,
      latitude,
      longitude,
      source: "External Real-Estate API Feed",
      description,
      imageUrl,
      amenities
    });
  }
  return listings;
};

const EXTERNAL_LISTINGS = generateListings();

router.get('/', (req, res) => {
  res.status(200).json(ApiResponse.success(EXTERNAL_LISTINGS, 'External listings fetched successfully'));
});

export default router;
