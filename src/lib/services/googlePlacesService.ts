import { env } from '@/lib/core/environment';

export interface PlaceAutocompleteResult {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  types: string[];
}

export interface PlaceDetails {
  place_id: string;
  formatted_address: string;
  name?: string;
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  business_status?: string;
  website?: string;
  formatted_phone_number?: string;
  international_phone_number?: string;
  rating?: number;
  user_ratings_total?: number;
}

export interface ParsedAddress {
  street_number?: string;
  route?: string;
  locality?: string;
  administrative_area_level_1?: string;
  administrative_area_level_2?: string;
  country?: string;
  postal_code?: string;
  formatted_address: string;
  lat?: number;
  lng?: number;
}

class GooglePlacesService {
  private apiKey: string;
  private isLoaded = false;
  private loadPromise: Promise<void> | null = null;

  constructor() {
    this.apiKey = env.google.placesApiKey || env.google.mapsApiKey;
  }

  /**
   * Load Google Places API script
   */
  private async loadGooglePlacesAPI(): Promise<void> {
    if (this.isLoaded) return;
    
    if (this.loadPromise) {
      return this.loadPromise;
    }

    if (!this.apiKey) {
      throw new Error('Google Places API key not configured. Please set VITE_GOOGLE_MAPS_API_KEY in your environment variables.');
    }

    this.loadPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Google Places API can only be loaded in browser environment'));
        return;
      }

      // Check if already loaded
      if (window.google?.maps?.places) {
        this.isLoaded = true;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&libraries=places&callback=initGooglePlaces`;
      script.async = true;
      script.defer = true;

      // Create global callback
      (window as any).initGooglePlaces = () => {
        this.isLoaded = true;
        resolve();
      };

      script.onerror = () => {
        reject(new Error('Failed to load Google Places API'));
      };

      document.head.appendChild(script);
    });

    return this.loadPromise;
  }

  /**
   * Get autocomplete suggestions for an address
   */
  async getAddressSuggestions(input: string, options?: {
    types?: string[];
    componentRestrictions?: { country: string | string[] };
  }): Promise<PlaceAutocompleteResult[]> {
    await this.loadGooglePlacesAPI();

    return new Promise((resolve, reject) => {
      const service = new window.google.maps.places.AutocompleteService();
      
      const request = {
        input,
        types: options?.types || ['address'],
        componentRestrictions: options?.componentRestrictions,
      };

      service.getPlacePredictions(request, (results: any, status: any) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          resolve(results.map((result: any) => ({
            place_id: result.place_id,
            description: result.description,
            structured_formatting: {
              main_text: result.structured_formatting.main_text,
              secondary_text: result.structured_formatting.secondary_text,
            },
            types: result.types,
          })));
        } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          resolve([]);
        } else {
          reject(new Error(`Google Places API error: ${status}`));
        }
      });
    });
  }

  /**
   * Get business suggestions
   */
  async getBusinessSuggestions(input: string, options?: {
    componentRestrictions?: { country: string | string[] };
  }): Promise<PlaceAutocompleteResult[]> {
    return this.getAddressSuggestions(input, {
      types: ['establishment'],
      ...options,
    });
  }

  /**
   * Get detailed information about a place
   */
  async getPlaceDetails(placeId: string): Promise<PlaceDetails> {
    await this.loadGooglePlacesAPI();

    return new Promise((resolve, reject) => {
      // Create a temporary map element (required for PlacesService)
      const map = new window.google.maps.Map(document.createElement('div'));
      const service = new window.google.maps.places.PlacesService(map);

      const request = {
        placeId,
        fields: [
          'place_id',
          'formatted_address',
          'name',
          'address_components',
          'geometry',
          'business_status',
          'website',
          'formatted_phone_number',
          'international_phone_number',
          'rating',
          'user_ratings_total',
        ],
      };

      service.getDetails(request, (place: any, status: any) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          resolve({
            place_id: place.place_id!,
            formatted_address: place.formatted_address!,
            name: place.name,
            address_components: place.address_components!.map((component: any) => ({
              long_name: component.long_name,
              short_name: component.short_name,
              types: component.types,
            })),
            geometry: {
              location: {
                lat: place.geometry!.location!.lat(),
                lng: place.geometry!.location!.lng(),
              },
            },
            business_status: place.business_status,
            website: place.website,
            formatted_phone_number: place.formatted_phone_number,
            international_phone_number: place.international_phone_number,
            rating: place.rating,
            user_ratings_total: place.user_ratings_total,
          });
        } else {
          reject(new Error(`Google Places API error: ${status}`));
        }
      });
    });
  }

  /**
   * Parse address components into structured format
   */
  parseAddressComponents(placeDetails: PlaceDetails): ParsedAddress {
    const components: ParsedAddress = {
      formatted_address: placeDetails.formatted_address,
      lat: placeDetails.geometry.location.lat,
      lng: placeDetails.geometry.location.lng,
    };

    placeDetails.address_components.forEach(component => {
      const types = component.types;

      if (types.includes('street_number')) {
        components.street_number = component.long_name;
      } else if (types.includes('route')) {
        components.route = component.long_name;
      } else if (types.includes('locality')) {
        components.locality = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        components.administrative_area_level_1 = component.long_name;
      } else if (types.includes('administrative_area_level_2')) {
        components.administrative_area_level_2 = component.long_name;
      } else if (types.includes('country')) {
        components.country = component.long_name;
      } else if (types.includes('postal_code')) {
        components.postal_code = component.long_name;
      }
    });

    return components;
  }

  /**
   * Get current user location (requires user permission)
   */
  async getCurrentLocation(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          reject(new Error(`Geolocation error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  }

  /**
   * Check if Google Places API is available
   */
  isAvailable(): boolean {
    return !!this.apiKey;
  }
}

// Global type declarations for Google Maps
declare global {
  interface Window {
    google: {
      maps: {
        places: {
          AutocompleteService: any;
          PlacesService: any;
          PlacesServiceStatus: {
            OK: string;
            ZERO_RESULTS: string;
          };
        };
        Map: any;
      };
    };
  }
}

// Type definitions for Google Places API callbacks
type PlacePredictionsCallback = (results: any[] | null, status: any) => void;
type PlaceDetailsCallback = (place: any | null, status: any) => void;

export const googlePlacesService = new GooglePlacesService(); 