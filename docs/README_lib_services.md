# Google Places Integration

This directory contains the Google Places API integration for address autocomplete and business information features.

## Setup

### 1. Get Google API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Places API** (for address autocomplete)
   - **Maps JavaScript API** (for maps integration)
4. Create credentials:
   - Go to "Credentials" → "Create Credentials" → "API Key"
   - Restrict the key to your domain for security

### 2. Configure Environment Variables

Add these variables to your `.env.local` file:

```env
# Google Places API Configuration
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
VITE_GOOGLE_PLACES_API_KEY=your-google-places-api-key-here

# Optional: If you only have one Google API key, you can use it for both:
# VITE_GOOGLE_MAPS_API_KEY=your-single-google-api-key-here
```

### 3. API Key Security

For production, make sure to:
- Restrict your API key to your domain
- Set up billing limits
- Monitor usage in Google Cloud Console

## Usage

### Address Autocomplete Component

```tsx
import AddressAutocomplete from '@/components/forms/AddressAutocomplete';

function MyForm() {
  const [address, setAddress] = useState('');

  return (
    <AddressAutocomplete
      label="Business Address"
      placeholder="Start typing your address..."
      value={address}
      onInputChange={setAddress}
      onChange={(parsedAddress) => {
        console.log('Full address:', parsedAddress);
        // Handle the structured address data
      }}
      showBusinessSuggestions={true}
      countryRestriction={['US', 'CA']}
    />
  );
}
```

### Direct Service Usage

```tsx
import { googlePlacesService } from '@/services/googlePlacesService';

// Get address suggestions
const suggestions = await googlePlacesService.getAddressSuggestions('123 Main St');

// Get business suggestions
const businesses = await googlePlacesService.getBusinessSuggestions('Coffee shop');

// Get detailed place information
const placeDetails = await googlePlacesService.getPlaceDetails('place_id_here');

// Parse address components
const parsedAddress = googlePlacesService.parseAddressComponents(placeDetails);
```

## Features

### AddressAutocomplete Component

- **Smart Autocomplete**: Real-time address suggestions as you type
- **Business Search**: Toggle between address and business establishment search
- **Country Filtering**: Restrict results to specific countries
- **Keyboard Navigation**: Arrow keys, Enter, and Escape support
- **Current Location**: Get user's current location (with permission)
- **Structured Data**: Returns parsed address components
- **Error Handling**: Graceful degradation when API is unavailable
- **Loading States**: Visual feedback during API calls

### Google Places Service

- **Address Suggestions**: Get autocomplete suggestions for addresses
- **Business Suggestions**: Search for business establishments
- **Place Details**: Get comprehensive information about a place
- **Address Parsing**: Extract structured components from addresses
- **Geolocation**: Get user's current coordinates
- **Error Handling**: Robust error handling and fallbacks

## Address Data Structure

The service returns structured address data:

```typescript
interface ParsedAddress {
  street_number?: string;        // e.g., "123"
  route?: string;                // e.g., "Main Street"
  locality?: string;             // e.g., "San Francisco"
  administrative_area_level_1?: string;  // e.g., "California"
  administrative_area_level_2?: string;  // e.g., "San Francisco County"
  country?: string;              // e.g., "United States"
  postal_code?: string;          // e.g., "94102"
  formatted_address: string;     // e.g., "123 Main St, San Francisco, CA 94102, USA"
  lat?: number;                  // Latitude
  lng?: number;                  // Longitude
}
```

## Business Information

For business establishments, additional data is available:

```typescript
interface PlaceDetails {
  place_id: string;
  formatted_address: string;
  name?: string;                 // Business name
  business_status?: string;      // "OPERATIONAL", "CLOSED_TEMPORARILY", etc.
  website?: string;              // Business website
  formatted_phone_number?: string;
  rating?: number;               // Google rating (1-5)
  user_ratings_total?: number;   // Number of reviews
  // ... address components and geometry
}
```

## Error Handling

The integration includes comprehensive error handling:

- **API Unavailable**: Graceful fallback to regular text input
- **Network Errors**: Retry logic and user feedback
- **Invalid API Key**: Clear error messages
- **Rate Limiting**: Debounced requests to prevent quota exhaustion
- **Geolocation Errors**: Fallback options when location access is denied

## Performance Optimizations

- **Debounced Requests**: 300ms delay to prevent excessive API calls
- **Caching**: Browser-level caching of API responses
- **Lazy Loading**: Google Maps API loaded only when needed
- **Minimal Bundle Impact**: Dynamic imports reduce initial bundle size

## Troubleshooting

### Common Issues

1. **"Google Places API not configured"**
   - Check that `VITE_GOOGLE_MAPS_API_KEY` is set in your environment
   - Verify the API key is correct and active

2. **"Failed to load Google Places API"**
   - Check that Places API is enabled in Google Cloud Console
   - Verify domain restrictions on your API key

3. **No suggestions appearing**
   - Check browser console for API errors
   - Verify API key has proper permissions
   - Check if you've exceeded API quotas

4. **Geolocation not working**
   - Ensure your site is served over HTTPS
   - Check browser permissions for location access

### Debug Mode

Enable debug logging by setting:

```typescript
// In your component
console.log('Google Places API available:', googlePlacesService.isAvailable());
```

## Cost Considerations

Google Places API pricing (as of 2024):
- **Autocomplete**: $2.83 per 1,000 requests
- **Place Details**: $17 per 1,000 requests
- **Current Location**: Free (uses browser geolocation)

### Cost Optimization Tips

1. **Debounce Requests**: Already implemented (300ms delay)
2. **Limit Results**: Use country restrictions to reduce irrelevant results
3. **Cache Results**: Browser automatically caches responses
4. **Monitor Usage**: Set up billing alerts in Google Cloud Console

## Integration Examples

### Account Settings Page

The Account Settings page demonstrates a complete integration:

```tsx
<AddressAutocomplete
  label="Business Address"
  placeholder="Start typing your business address..."
  value={formData.businessAddress1}
  onInputChange={(value) => setFormData(prev => ({ ...prev, businessAddress1: value }))}
  onChange={(address) => {
    setFormData(prev => ({
      ...prev,
      businessAddress1: address.formatted_address,
      city: address.locality || prev.city,
      postalCode: address.postal_code || prev.postalCode,
      country: address.country || prev.country,
    }));
  }}
  showBusinessSuggestions={true}
  countryRestriction={['US', 'CA', 'GB', 'AU']}
/>
```

This integration automatically:
- Fills in the main address field
- Populates city, postal code, and country fields
- Provides business-specific suggestions
- Restricts results to specified countries

## Future Enhancements

Potential improvements for the Google Places integration:

1. **Reverse Geocoding**: Convert coordinates to addresses
2. **Nearby Search**: Find businesses near a location
3. **Photos Integration**: Display place photos
4. **Reviews Integration**: Show Google reviews
5. **Opening Hours**: Display business hours
6. **Distance Calculation**: Calculate distances between locations
7. **Map Visualization**: Show selected addresses on a map
8. **Batch Processing**: Handle multiple addresses efficiently 