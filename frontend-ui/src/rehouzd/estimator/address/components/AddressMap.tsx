import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { Box, Text, HStack, Badge, Icon } from '@chakra-ui/react';
import { FaHome, FaSearchLocation } from 'react-icons/fa';
import { useAppSelector } from '../../store/hooks';

// Define property data interface
export interface PropertyData {
  id?: string;
  address?: string;
  city?: string;
  state?: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  yearBuilt?: number;
  distance?: number | string;
  status?: string;
  latitude?: number;
  longitude?: number;
}

// Props for the AddressMap component
export interface AddressMapProps {
  latitude: number;
  longitude: number;
  address: string;
  zoom?: number;
  height?: string;
  showProperties?: boolean;
  forceEmptyProperties?: boolean;
  properties?: PropertyData[];
  radiusMiles?: number;
  highlightedPropertyId?: string | number | null;
  selectedPropertyIds?: Array<string | number>;
  onInfoWindowClose?: () => void;
}

// Convert miles to meters for the circle radius
const milesToMeters = (miles: number): number => {
  return miles * 1609.34;
};

// Calculate zoom level based on radius
const calculateZoomLevel = (radius: number): number => {
  if (radius <= 0.5) return 14;
  if (radius <= 1) return 13;
  if (radius <= 2) return 12;
  if (radius <= 5) return 11;
  return 11;
};

const AddressMap: React.FC<AddressMapProps> = ({
  latitude,
  longitude,
  address,
  height = '100%',
  showProperties = true,
  forceEmptyProperties = false,
  properties = [],
  radiusMiles = 0.5,
  highlightedPropertyId = null,
  selectedPropertyIds = [],
  onInfoWindowClose,
}: AddressMapProps) => {
  // Define constant theme colors
  const bgColor = 'background.primary'; // white from our theme
  const textColor = 'text.secondary'; // gray.600 from our theme
  
  // Map ref to prevent multiple renders
  const mapRef = useRef<google.maps.Map | null>(null);
  const circleRef = useRef<google.maps.Circle | null>(null);
  
  // Property selection state
  const [selectedProperty, setSelectedProperty] = useState<PropertyData | null>(null);
  
  // Load the Google Maps API - moved up since this produces several hooks internally
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: (window as any).env?.REACT_APP_Maps_API_KEY || process.env.REACT_APP_Maps_API_KEY || 'AIzaSyB9tUsFp0xB4S9Cnx-5T1f4OeRHYuT6w1A',
  });
    
  // Get property data from Redux store
  const propertyState = useAppSelector((state: any) => state.property);
  
  // Map center position (memoized)
  const center = React.useMemo(() => ({
    lat: latitude,
    lng: longitude,
  }), [latitude, longitude]);

  // Memoized map options
  const mapOptions = React.useMemo(() => ({
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
    zoom: calculateZoomLevel(radiusMiles),
    center
  }), [radiusMiles, center]);

  // Handle marker click to show property info
  const handleMarkerClick = useCallback((prop: PropertyData) => {
    setSelectedProperty(prop);
  }, []);

  // Close info window and reset highlight
  const handleInfoWindowClose = useCallback(() => {
    setSelectedProperty(null);
    
    // Call the parent component's handler to reset highlight in parent
    if (onInfoWindowClose) {
      onInfoWindowClose();
    }
  }, [onInfoWindowClose]);
  
  // Handle map load
  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    
    // Initial map setup
    map.setCenter(center);
    map.setZoom(calculateZoomLevel(radiusMiles));
    
    // Create initial circle
    if (!circleRef.current) {
      circleRef.current = new google.maps.Circle({
        map: map,
        center: center,
        radius: milesToMeters(radiusMiles),
        fillColor: '#3182CE',
        fillOpacity: 0.1,
        strokeColor: '#3182CE',
        strokeOpacity: 0.8,
        strokeWeight: 2,
      });
    }
  }, [center, radiusMiles]);

  // Update circle
  useEffect(() => {
    if (mapRef.current) {
      // Update map properties
      mapRef.current.setZoom(calculateZoomLevel(radiusMiles));
      mapRef.current.setCenter(center);
      
      // Clean up previous circle if it exists
      if (circleRef.current) {
        circleRef.current.setMap(null);
      }
      
      // Create new circle
      circleRef.current = new google.maps.Circle({
        map: mapRef.current,
        center: center,
        radius: milesToMeters(radiusMiles),
        fillColor: '#3182CE',
        fillOpacity: 0.1,
        strokeColor: '#3182CE',
        strokeOpacity: 0.8,
        strokeWeight: 2,
      });
    }
  }, [radiusMiles, center]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (circleRef.current) {
        circleRef.current.setMap(null);
        circleRef.current = null;
      }
    };
  }, []);
  
  // Process property data - do this after all hooks
  const property = propertyState.properties && propertyState.properties.length > 0 ? propertyState.properties[0] : null;
  
  // Get neighborhood properties if they exist
  let neighborhoodProperties: PropertyData[] = [];
  if (!forceEmptyProperties && showProperties) {
    if (properties && properties.length > 0) {
      neighborhoodProperties = properties;
    } else if (property?.neighborhoodProperties && Array.isArray(property.neighborhoodProperties)) {
      neighborhoodProperties = property.neighborhoodProperties;
    } else if (property && (property as any).properties && Array.isArray((property as any).properties)) {
      neighborhoodProperties = (property as any).properties;
    }
  }

  // Filter properties based on checkbox selections
  const displayProperties = React.useMemo(() => {
    if (selectedPropertyIds.length === 0) {
      return neighborhoodProperties; // Show all properties if none selected
    }
    
    // Show only the selected properties
    return neighborhoodProperties.filter(prop => 
      prop.id && selectedPropertyIds.includes(prop.id)
    );
  }, [neighborhoodProperties, selectedPropertyIds]);

  // Update highlighted property with animation timeout
  useEffect(() => {
    // When highlighted property changes, auto-select the property to show its info window
    if (highlightedPropertyId) {
      const highlightedProp = neighborhoodProperties.find(prop => prop.id === highlightedPropertyId);
      if (highlightedProp) {
        setSelectedProperty(highlightedProp);
        
        // Center the map on this property if it exists
        if (mapRef.current && highlightedProp.latitude && highlightedProp.longitude) {
          mapRef.current.panTo({
            lat: highlightedProp.latitude,
            lng: highlightedProp.longitude
          });
        }
      }
    }
  }, [highlightedPropertyId, neighborhoodProperties]);
  
  // Manage marker animation - we want to stop bouncing after a brief period
  const [animatedMarker, setAnimatedMarker] = useState<string | number | null>(null);
  
  // Start animation when highlighted property changes
  useEffect(() => {
    if (highlightedPropertyId) {
      setAnimatedMarker(highlightedPropertyId);
      
      // Stop animation after 3 seconds to avoid distracting user
      const timer = setTimeout(() => {
        setAnimatedMarker(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    } else {
      setAnimatedMarker(null);
    }
  }, [highlightedPropertyId]);

  // If maps API isn't loaded yet, show loading
  if (!isLoaded) {
    return (
      <Box height={height} width="100%" bg="gray.100" display="flex" alignItems="center" justifyContent="center">
        <Text>Loading Map...</Text>
      </Box>
    );
  }

  return (
    <Box position="relative" height={height} width="100%">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        options={mapOptions}
        onLoad={onMapLoad}
      >
        {/* Main address marker */}
        <Marker
          position={center}
          label={{
            text: 'S',
            color: 'white',
          }}
          icon={{
            path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
            fillColor: '#C83B31',
            fillOpacity: 1,
            strokeWeight: 1,
            strokeColor: '#FFFFFF',
            scale: 2,
            anchor: new google.maps.Point(12, 23),
          }}
          title={address}
        />

        {/* Neighborhood property markers */}
        {showProperties && displayProperties.length > 0 && displayProperties.map((prop, index) => {
          if (!prop.latitude || !prop.longitude) return null;
          
          // Determine if this marker should be highlighted
          const isHighlighted = prop.id && prop.id === highlightedPropertyId;
          
          return (
            <Marker
              key={prop.id || `prop-${index}`}
              position={{
                lat: prop.latitude,
                lng: prop.longitude,
              }}
              onClick={() => handleMarkerClick(prop)}
              icon={{
                path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
                fillColor: isHighlighted ? 'teal' : 'green',
                fillOpacity: 1,
                strokeWeight: 1,
                strokeColor: '#FFFFFF',
                scale: isHighlighted ? 2.0 : 1.5, // Make highlighted marker larger
                anchor: new google.maps.Point(12, 23),
              }}
            />
          );
        })}

        {/* Info window for selected property */}
        {selectedProperty && selectedProperty.latitude && selectedProperty.longitude && (
          <InfoWindow
            position={{
              lat: selectedProperty.latitude,
              lng: selectedProperty.longitude,
            }}
            onCloseClick={handleInfoWindowClose}
          >
            <Box p={2} maxW="200px" bg="white">
              <Text fontWeight="bold" mb={1} color="gray.800">
                {selectedProperty.address || 'Property'}
              </Text>
              {selectedProperty.city && selectedProperty.state && (
                <Text fontSize="sm" mb={1} color="gray.600">{selectedProperty.city}, {selectedProperty.state}</Text>
              )}
              <HStack mb={1}>
                <Text fontSize="sm" color="gray.700">{selectedProperty.bedrooms || 0} bd, {selectedProperty.bathrooms || 0} ba</Text>
                <Text fontSize="sm" color="gray.700">{selectedProperty.squareFootage || 0} sqft</Text>
              </HStack>
              <Text fontWeight="bold" color="teal.500">${selectedProperty.price?.toLocaleString() || '0'}</Text>
            </Box>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Search radius overlay */}
      <Box
        position="absolute"
        bottom="10px"
        left="10px"
        bg={bgColor}
        p={2}
        borderRadius="md"
        boxShadow="sm"
        opacity={0.9}
      >
        <HStack>
          <Icon as={FaSearchLocation as React.ElementType} color="brand.500" />
          <Text fontSize="sm" fontWeight="medium" color={textColor}>
            {radiusMiles.toFixed(1)} Mile{radiusMiles !== 1 ? 's' : ''} Radius
          </Text>
          <Badge colorScheme={
            selectedPropertyIds.length > 0 
              ? "green" 
              : "blue"
          } ml={1}>
            {displayProperties.length} / {neighborhoodProperties.length} Properties
          </Badge>
        </HStack>
      </Box>

      {/* Filter information overlay when filtering is active */}
      {selectedPropertyIds.length > 0 && (
        <Box
          position="absolute"
          top="10px"
          right="10px"
          bg="green.50"
          p={2}
          borderRadius="md"
          boxShadow="sm"
          border="1px solid"
          borderColor="green.200"
        >
          <Text fontSize="sm" fontWeight="medium" color="green.700">
            Showing {selectedPropertyIds.length} selected properties
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default AddressMap;
