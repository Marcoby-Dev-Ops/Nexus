import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent } from '@/shared/components/ui/Card';
import { Label } from '@/shared/components/ui/Label';
import { Badge } from '@/shared/components/ui/Badge';
import { Loader2, MapPin, Building, Navigation } from 'lucide-react';
import { googlePlacesService, type PlaceAutocompleteResult, type ParsedAddress } from '@/domains/integrations';
import { cn } from '@/shared/utils/styles';

interface AddressAutocompleteProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (address: ParsedAddress) => void;
  onInputChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  showBusinessSuggestions?: boolean;
  countryRestriction?: string | string[];
  required?: boolean;
  error?: string;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  label = 'Address',
  placeholder = 'Start typing an address...',
  value = '',
  onChange,
  onInputChange,
  disabled = false,
  className,
  showBusinessSuggestions = false,
  countryRestriction,
  required = false,
  error,
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<PlaceAutocompleteResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isApiAvailable, setIsApiAvailable] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | undefined>();

  useEffect(() => {
    setIsApiAvailable(googlePlacesService.isAvailable());
  }, []);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const fetchSuggestions = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const options = countryRestriction 
        ? { componentRestrictions: { country: countryRestriction } }
        : undefined;

      const results = showBusinessSuggestions
        ? await googlePlacesService.getBusinessSuggestions(query, options)
        : await googlePlacesService.getAddressSuggestions(query, options);

      setSuggestions(results);
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error fetching address suggestions: ', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onInputChange?.(newValue);

    if (!isApiAvailable) return;

    // Debounce the API calls
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 300);
  };

  const handleSuggestionClick = async (suggestion: PlaceAutocompleteResult) => {
    setInputValue(suggestion.description);
    setShowSuggestions(false);
    setIsLoading(true);

    try {
      const placeDetails = await googlePlacesService.getPlaceDetails(suggestion.place_id);
      const parsedAddress = googlePlacesService.parseAddressComponents(placeDetails);
      onChange?.(parsedAddress);
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error fetching place details: ', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1: prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1: -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser');
      return;
    }

    setIsLoading(true);
    try {
      const location = await googlePlacesService.getCurrentLocation();
      // You could implement reverse geocoding here if needed
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('Current location: ', location);
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error getting current location: ', error);
      alert('Unable to get your current location');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 200);
  };

  const getSuggestionIcon = (types: string[]) => {
    if (types.includes('establishment')) {
      return <Building className="w-4 h-4" />;
    }
    return <MapPin className="w-4 h-4" />;
  };

  return (
    <div className={cn('relative', className)}>
      {label && (
        <Label htmlFor="address-input" className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      
      <div className="relative mt-1">
        <Input
          ref={inputRef}
          id="address-input"
          type="text"
          placeholder={isApiAvailable ? placeholder: 'Google Places API not configured'}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled || !isApiAvailable}
          className={cn(
            'pr-20',
            error && 'border-destructive focus: border-destructive'
          )}
        />
        
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isLoading && (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          )}
          
          {isApiAvailable && navigator.geolocation && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCurrentLocation}
              disabled={disabled || isLoading}
              className="h-6 w-6 p-0"
              title="Use current location"
            >
              <Navigation className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive mt-1">{error}</p>
      )}

      {!isApiAvailable && (
        <p className="text-sm text-muted-foreground mt-1">
          Add Google Places API key to enable address autocomplete
        </p>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto">
          <CardContent className="p-0">
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.place_id}
                ref={index === selectedIndex ? suggestionsRef: undefined}
                className={cn(
                  'flex items-start gap-4 p-4 cursor-pointer border-b border-border last:border-b-0 hover:bg-accent',
                  index === selectedIndex && 'bg-accent'
                )}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <div className="text-muted-foreground mt-0.5">
                  {getSuggestionIcon(suggestion.types)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {suggestion.structured_formatting.main_text}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {suggestion.structured_formatting.secondary_text}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {suggestion.types.slice(0, 2).map((type) => (
                      <Badge
                        key={type}
                        variant="secondary"
                        className="text-xs px-1.5 py-0.5"
                      >
                        {type.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AddressAutocomplete; 