import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    Box,
    Heading,
    Image,
    HStack,
    Text,
    Slider,
    SliderTrack,
    SliderFilledTrack,
    SliderThumb,
    Button,
    Icon,
    Badge,
    SimpleGrid,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Select,
    Switch,
    FormControl,
    FormLabel,
    Flex,
    Center,
    Alert,
    AlertIcon,
    VStack,
    RangeSlider,
    RangeSliderTrack,
    RangeSliderFilledTrack,
    RangeSliderThumb,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    useToast,
    Drawer,
    DrawerBody,
    DrawerCloseButton,
    DrawerContent,
    DrawerHeader,
    DrawerOverlay,
    Spacer,
    Checkbox,
    Progress,
    useDisclosure,
    Spinner,
} from '@chakra-ui/react';
import {
    FaPhoneAlt,
    FaArrowLeft,
    FaFilter,
    FaCamera,
    FaInfoCircle,
    FaHome,
    FaRuler,
    FaBed,
    FaBath,
    FaCalendarAlt,
    FaMapMarkerAlt,
    FaDollarSign,
    FaUser,
    FaHeart,
    FaSave,
    FaStar,
    FaDownload,
    FaCaretDown,
    FaCaretUp,
    FaGripVertical,
} from 'react-icons/fa';
import AddressMap from '../../../address/components/AddressMap';
import { AddressComponents } from '../../../address/components/PlaceAutocompleteInput';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { setAddressData } from "../../../store/addressSlice";
import CommonModal from '../../../components/CommonModal';
import RentUnderwriteSliders from '../RentUnderwriteSliders';
import FlipUnderwriteSliders from '../FlipUnderwriteSliders';
import BuyerDetailDrawer from '../../../components/BuyerDetailDrawer';
import type { Buyer } from '../../../store/buyerSlice';
import { EstimatedOfferRange } from '../EstimatedOfferRange';
import PropertyHeaderCard from '../PropertyHeaderCard';
import { BackendBuyer, transformBuyerData } from '../../../store/buyerSlice';
import config from '../../../../../config';

// Add necessary interfaces for the underwrite slider values
interface RentUnderwriteValues {
  rent: number;
  expense: number;
  capRate: number;
  lowRehab: number;
  highRehab: number;
}

interface FlipUnderwriteValues {
  sellingCosts: number;
  holdingCosts: number;
  margin: number;
  lowRehab: number;
  highRehab: number;
}

interface UnderwriteSliderValues {
  rent: RentUnderwriteValues;
  flip: FlipUnderwriteValues;
}

// Define sort orders
type SortOrder = 
  | 'Price (Low to High)' 
  | 'Price (High to Low)' 
  | 'Distance' 
  | 'Distance Reverse'
  | 'Year Built' 
  | 'Year Built Reverse'
  | 'Square Footage'
  | 'Square Footage Reverse'
  | 'Listing'
  | 'Listing Reverse'
  | 'Address'
  | 'Address Reverse'
  | 'Date'
  | 'Date Reverse'
  | 'Bed'
  | 'Bed Reverse'
  | 'Bath'
  | 'Bath Reverse';

function AddressImageUrl(address: AddressComponents | null, apiKey: string) {
    if (!address) return '';
    const encodedAddress = encodeURIComponent(address.formattedAddress);
    const size = '600x300';
    const fov = 90;
    const heading = 235;
    const pitch = 10;
    return `https://maps.googleapis.com/maps/api/streetview?size=${size}&location=${encodedAddress}&fov=${fov}&heading=${heading}&pitch=${pitch}&key=${apiKey}`;
}

interface EstimatedOfferStepProps {
    selectedAddress: AddressComponents | null;
    googleApiKey: string;
    addressState: {
        lat: number;
        lng: number;
        formattedAddress: string;
        [key: string]: any;
    };
    handleOpenCallbackModal: () => void;
    handleBackToStep2: () => void;
    onNext: () => void;
}

interface RelatedProperty {
    id?: number;
    address: string;
    city?: string;
    state?: string;
    zipCode?: string;
    price?: number;
    squareFootage?: number;
    bedrooms?: number;
    bathrooms?: number;
    yearBuilt?: number;
    distance?: string | number;
    status?: string;
    soldDate?: string;
    latitude?: number;
    longitude?: number;
    similarityScore?: number;
}

// PropertyDetailsModal Component
interface PropertyDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    property: RelatedProperty | null;
    formatPrice: (price?: number) => string;
    formatDistance: (distance?: number | string) => string;
}

const PropertyDetailsModal: React.FC<PropertyDetailsModalProps> = ({
    isOpen,
    onClose,
    property,
    formatPrice,
    formatDistance
}) => {
    // Define theme colors
    const bgColor = 'background.secondary';
    const textColor = 'text.primary';
    
    if (!property) return null;
    
    return (
        <CommonModal
            isOpen={isOpen}
            onClose={onClose}
            title="Property Details"
            size="xl"
        >
            <VStack spacing={4} align="stretch">
                <Heading size="md" mb={1} color={textColor}>
                    {property.address}
                </Heading>
                
                <Flex justify="space-between" align="center" mb={2}>
                    <Text fontSize="xl" fontWeight="bold" color="brand.500">
                        {formatPrice(property.price)}
                    </Text>
                    <Badge colorScheme={property.status === 'Sold' ? 'red' : property.status === 'Pending' ? 'yellow' : 'green'} p={1} px={2}>
                        {property.status || 'Unknown'}
                    </Badge>
                </Flex>
                
                <Box borderWidth="1px" borderRadius="md" p={3} bg={bgColor}>
                    <SimpleGrid columns={2} spacing={3}>
                        <HStack>
                            <Icon as={FaBed as React.ElementType} color="text.secondary" />
                            <Text>{property.bedrooms || 0} Bedrooms</Text>
                        </HStack>
                        <HStack>
                            <Icon as={FaBath as React.ElementType} color="text.secondary" />
                            <Text>{property.bathrooms || 0} Bathrooms</Text>
                        </HStack>
                        <HStack>
                            <Icon as={FaRuler as React.ElementType} color="text.secondary" />
                            <Text>{property.squareFootage || 0} Sq Ft</Text>
                        </HStack>
                        <HStack>
                            <Icon as={FaCalendarAlt as React.ElementType} color="text.secondary" />
                            <Text>Built in {property.yearBuilt || 'N/A'}</Text>
                        </HStack>
                    </SimpleGrid>
                </Box>
                
                <HStack bg="blue.50" p={2} borderRadius="md">
                    <Icon as={FaMapMarkerAlt as React.ElementType} color="blue.500" />
                    <Text>
                        {formatDistance(property.distance)} from your property
                    </Text>
                </HStack>
                
                {property.soldDate && (
                    <Text fontSize="sm" color="text.secondary">
                        {property.status === 'Sold' ? 'Sold on ' : 'Listed on '}
                        {new Date(property.soldDate).toLocaleDateString()}
                    </Text>
                )}
                
                {property.similarityScore !== undefined && (
                    <Box mt={1} p={2} bg={bgColor} borderRadius="md">
                        <Text fontWeight="medium">Similarity Score</Text>
                        <Slider
                            aria-label="similarity-score"
                            value={property.similarityScore * 100 || 0}
                            isReadOnly
                            colorScheme="brand"
                            mt={2}
                        >
                            <SliderTrack>
                                <SliderFilledTrack />
                            </SliderTrack>
                            <SliderThumb boxSize={6} />
                        </Slider>
                        <Text textAlign="right" fontSize="sm">
                            {Math.round((property.similarityScore || 0) * 100)}% match
                        </Text>
                    </Box>
                )}
                
                <Button colorScheme="blue" mt={2} onClick={onClose}>
                    Close
                </Button>
            </VStack>
        </CommonModal>
    );
};

const EstimatedOfferStep: React.FC<EstimatedOfferStepProps> = ({
    selectedAddress,
    googleApiKey,
    addressState,
    handleOpenCallbackModal,
    handleBackToStep2,
    onNext,
}) => {
    const dispatch = useAppDispatch();
    // Define theme colors
    const bgPrimary = 'background.primary';
    const bgSecondary = 'background.secondary';
    const borderPrimary = 'border.primary';
    const textPrimary = 'text.primary';
    const textSecondary = 'text.secondary';
    const brandColor = 'brand.500';
    const brandBorderColor = 'brand.100';

    // State for filtering and sorting
    const [sortOrder, setSortOrder] = useState<SortOrder>('Distance');
    const [isSortingActive, setIsSortingActive] = useState(false);
    // Initialize showRentalProperties based on if there are any rental properties
    const [showRentalProperties, setShowRentalProperties] = useState(false);
    const [showSoldOnly, setShowSoldOnly] = useState(true);
    const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);
    
    // Filter states
    const [priceRange, setPriceRange] = useState([0, 1000000]);
    const [yearBuiltRange, setYearBuiltRange] = useState([1900, 2024]);
    const [sqftRange, setSqftRange] = useState([0, 5000]);
    const [distanceRange, setDistanceRange] = useState([0, 5]);
    
    // Property details modal state
    const [selectedProperty, setSelectedProperty] = useState<RelatedProperty | null>(null);
    const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);

    // Track active investment tab
    const [activeInvestmentTab, setActiveInvestmentTab] = useState(0);
    
    // Add state for slider values
    const [rentUnderwriteValues, setRentUnderwriteValues] = useState({
        rent: 1000,
        expense: 35,
        capRate: 6.5,
        lowRehab: 30,
        highRehab: 40
    });
    
    const [flipUnderwriteValues, setFlipUnderwriteValues] = useState({
        sellingCosts: 7,
        holdingCosts: 4,
        margin: 20,
        lowRehab: 30,
        highRehab: 40
    });
    
    const propertyState = useAppSelector((state) => state.property);
    const property = propertyState.properties[0] || null;

    // Get current rehab values based on active tab
    const currentRehabValues = useMemo(() => {
        return activeInvestmentTab === 0 
            ? { lowRehab: rentUnderwriteValues.lowRehab, highRehab: rentUnderwriteValues.highRehab }
            : { lowRehab: flipUnderwriteValues.lowRehab, highRehab: flipUnderwriteValues.highRehab };
    }, [activeInvestmentTab, rentUnderwriteValues.lowRehab, rentUnderwriteValues.highRehab, 
        flipUnderwriteValues.lowRehab, flipUnderwriteValues.highRehab]);
        
    // Loading states for sliders
    const [isLoadingSliderValues, setIsLoadingSliderValues] = useState(false);
    
    // Add state for selected properties
    const [selectedPropertyIds, setSelectedPropertyIds] = useState<Array<string | number>>([]);
    const [highlightedPropertyId, setHighlightedPropertyId] = useState<string | number | null>(null);
    
    // State for draggable properties
    const [draggableProperties, setDraggableProperties] = useState<RelatedProperty[]>([]);
    const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
    
    // Track custom order of properties by their IDs
    const [customPropertyOrder, setCustomPropertyOrder] = useState<(string | number)[]>([]);
    
    // Ref for the property table
    const propertyTableRef = useRef<HTMLTableElement>(null);

    // Get data from Redux store
    // const propertyState = useAppSelector((state) => state.property);
    // const property = propertyState.properties[0] || null;
    const propertyDetails = property?.addressData?.items?.[0] || null;
    const propertyDetailsForHeader = {
        beds: propertyDetails?.bedrooms ?? 'Not Found',
        baths: propertyDetails?.bathrooms ?? 'Not Found',
        sqft: propertyDetails?.square_footage ?? 'Not Found',
        year: propertyDetails?.year_built ?? 'Not Found'
    };

    // Get neighborhood properties from Redux store
    const neighborhoodProperties = property?.neighborhoodProperties || [];

    // Calculate the number of rental properties
    const rentalPropertiesCount = useMemo(() => {
        return neighborhoodProperties.filter(p => 
            p.status === 'LISTED_RENT' || 
            p.status === 'LISTING_REMOVED'
        ).length;
    }, [neighborhoodProperties]);

    // Calculate the number of sold properties
    const soldPropertiesCount = useMemo(() => {
        return neighborhoodProperties.filter(p => 
            p.status === 'SOLD' || 
            p.status === 'Sold'
        ).length;
    }, [neighborhoodProperties]);
    
    // Load underwrite values when address and condition are available
    useEffect(() => {
        const loadUnderwriteValues = async () => {
            setIsLoadingSliderValues(true);
            try {
                // Use the address as the property identifier
                const address = selectedAddress?.formattedAddress || '';
                // Only proceed if address exists
                if (address) {
                    // Save condition from address state to Redux store if it exists
                    if (addressState.condition) {
                        console.log('Setting condition in address store:', addressState.condition);
                        dispatch(setAddressData({
                            ...addressState,
                            condition: addressState.condition
                        }));
                    } else {
                        console.log('No condition found in address state, skipping underwrite value load');
                        setIsLoadingSliderValues(false);
                        return;
                    }
                    
                    // Use all neighborhood properties instead of filtering to just rentals
                    console.log(`Using all ${neighborhoodProperties.length} neighborhood properties for calculations`);
                    
                    // Get address data from the property state for market calculations
                    const addressData = propertyState.properties[0]?.addressData?.items?.[0] || null;
                    
                    if (addressData) {
                        console.log('Found address data for market calculations:', {
                            state: addressData.state_abbreviation || '',
                            county: addressData.county || '',
                            square_footage: addressData.square_footage
                        });
                    }
                    
                    // Safely extract square_footage from addressData
                    const squareFootage = addressData?.square_footage || 0;
                    console.log('Square footage from property data:', squareFootage);
                    
                    // Add condition from frontend to the addressData
                    const enhancedAddressData = addressData ? {
                        ...addressData,
                        condition: addressState.condition // Add the condition from user selection
                    } : {
                        condition: addressState.condition,
                        // If addressData is null, at least provide the condition
                        // but we might still lack square_footage which is needed for rehab costs
                        square_footage: squareFootage // Use the extracted square footage or 0
                    };
                    
                    // Add debug logging to verify the condition is being passed
                    console.log('Enhanced address data with condition:', enhancedAddressData);
                    console.log('Condition present:', !!enhancedAddressData.condition);
                    console.log('Square footage present:', !!enhancedAddressData.square_footage);
                    
                    // Use address as a unique identifier for the property and pass ALL neighborhood properties
                    const values = await getPropertyUnderwriteValues(address, neighborhoodProperties, enhancedAddressData);
                    setRentUnderwriteValues(values.rent);
                    setFlipUnderwriteValues(values.flip);
                } else {
                    // Don't load values if no address is set
                    console.log('Skipping underwrite values load: No address available');
                }
            } catch (error) {
                console.error('Failed to load underwrite values:', error);
                // If there's an error, try to get default values as fallback
                try {
                    const values = await getDefaultUnderwriteValues();
                    setRentUnderwriteValues(values.rent);
                    setFlipUnderwriteValues(values.flip);
                } catch (fallbackError) {
                    console.error('Failed to load default underwrite values:', fallbackError);
                    // If we can't even get default values, use the initial state values
                }
            } finally {
                setIsLoadingSliderValues(false);
            }
        };

        // Load underwrite values if address exists
        if (selectedAddress?.formattedAddress) {
            loadUnderwriteValues();
        }
    }, [selectedAddress?.formattedAddress, addressState.condition, neighborhoodProperties, 
        propertyState.properties, dispatch]);
    
    // Update showRentalProperties when rentalPropertiesCount changes
    useEffect(() => {
        if (rentalPropertiesCount === 0) {
            setShowRentalProperties(false);
        }
    }, [rentalPropertiesCount]);
    
    // Use useMemo to compute filtered properties to avoid circular dependencies
    const filteredProperties = useMemo(() => {
        // When both toggles are on, show all properties
        if (showRentalProperties && showSoldOnly) {
            return [...neighborhoodProperties].sort((a, b) => {
                switch(sortOrder) {
                    case 'Price (Low to High)':
                        return (a.price || 0) - (b.price || 0);
                    case 'Price (High to Low)':
                        return (b.price || 0) - (a.price || 0);
                    case 'Distance':
                        return (typeof a.distance === 'number' ? a.distance : 0) - 
                               (typeof b.distance === 'number' ? b.distance : 0);
                    case 'Distance Reverse':
                        return (typeof b.distance === 'number' ? b.distance : 0) - 
                               (typeof a.distance === 'number' ? a.distance : 0);
                    case 'Year Built':
                        return (b.yearBuilt || 0) - (a.yearBuilt || 0);
                    case 'Year Built Reverse':
                        return (a.yearBuilt || 0) - (b.yearBuilt || 0);
                    case 'Square Footage':
                        return (b.squareFootage || 0) - (a.squareFootage || 0);
                    case 'Square Footage Reverse':
                        return (a.squareFootage || 0) - (b.squareFootage || 0);
                    case 'Listing':
                        return (a.status || '').localeCompare(b.status || '');
                    case 'Listing Reverse':
                        return (b.status || '').localeCompare(a.status || '');
                    case 'Address':
                        return (a.address || '').localeCompare(b.address || '');
                    case 'Address Reverse':
                        return (b.address || '').localeCompare(a.address || '');
                    case 'Date':
                        return (a.soldDate || '').localeCompare(b.soldDate || '');
                    case 'Date Reverse':
                        return (b.soldDate || '').localeCompare(a.soldDate || '');
                    case 'Bed':
                        return (a.bedrooms || 0) - (b.bedrooms || 0);
                    case 'Bed Reverse':
                        return (b.bedrooms || 0) - (a.bedrooms || 0);
                    case 'Bath':
                        return (a.bathrooms || 0) - (b.bathrooms || 0);
                    case 'Bath Reverse':
                        return (b.bathrooms || 0) - (a.bathrooms || 0);
                    default:
                        return 0;
                }
            });
        }
        
        // First filter by rental status if needed
        let propertiesFilteredByType = showRentalProperties 
            ? neighborhoodProperties.filter(p => 
                p.status === 'LISTED_RENT' || 
                p.status === 'LISTING_REMOVED')
            : [];
        
        // Add sold properties if the toggle is on
        if (showSoldOnly) {
            const soldProperties = neighborhoodProperties.filter(p => 
                p.status === 'SOLD' || 
                p.status === 'Sold'
            );
            propertiesFilteredByType = [...propertiesFilteredByType, ...soldProperties];
        }
        
        // If neither toggle is on, show nothing
        if (!showRentalProperties && !showSoldOnly) {
            return [];
        }
        
        // Then sort the filtered properties
        return propertiesFilteredByType.sort((a, b) => {
            switch(sortOrder) {
                case 'Price (Low to High)':
                    return (a.price || 0) - (b.price || 0);
                case 'Price (High to Low)':
                    return (b.price || 0) - (a.price || 0);
                case 'Distance':
                    return (typeof a.distance === 'number' ? a.distance : 0) - 
                           (typeof b.distance === 'number' ? b.distance : 0);
                case 'Distance Reverse':
                    return (typeof b.distance === 'number' ? b.distance : 0) - 
                           (typeof a.distance === 'number' ? a.distance : 0);
                case 'Year Built':
                    return (b.yearBuilt || 0) - (a.yearBuilt || 0);
                case 'Year Built Reverse':
                    return (a.yearBuilt || 0) - (b.yearBuilt || 0);
                case 'Square Footage':
                    return (b.squareFootage || 0) - (a.squareFootage || 0);
                case 'Square Footage Reverse':
                    return (a.squareFootage || 0) - (b.squareFootage || 0);
                case 'Listing':
                    return (a.status || '').localeCompare(b.status || '');
                case 'Listing Reverse':
                    return (b.status || '').localeCompare(a.status || '');
                case 'Address':
                    return (a.address || '').localeCompare(b.address || '');
                case 'Address Reverse':
                    return (b.address || '').localeCompare(a.address || '');
                case 'Date':
                    return (a.soldDate || '').localeCompare(b.soldDate || '');
                case 'Date Reverse':
                    return (b.soldDate || '').localeCompare(a.soldDate || '');
                case 'Bed':
                    return (a.bedrooms || 0) - (b.bedrooms || 0);
                case 'Bed Reverse':
                    return (b.bedrooms || 0) - (a.bedrooms || 0);
                case 'Bath':
                    return (a.bathrooms || 0) - (b.bathrooms || 0);
                case 'Bath Reverse':
                    return (b.bathrooms || 0) - (a.bathrooms || 0);
                default:
                    return 0;
            }
        });
    }, [neighborhoodProperties, sortOrder, showRentalProperties, showSoldOnly]);
    
    // Function to handle property row click (highlight on map)
    const handlePropertyRowClick = useCallback((property: RelatedProperty) => {
        setHighlightedPropertyId(property.id || null);
        // Logic to highlight on map would go here
        // For now just logging
        console.log(`Property row clicked: ${property.address}`);
    }, []);
    
    // Function to reset highlighted property
    const handleResetHighlight = useCallback(() => {
        setHighlightedPropertyId(null);
    }, []);
    
    // Function to handle property checkbox selection
    const handlePropertySelect = useCallback((property: RelatedProperty, isChecked: boolean) => {
        const propId = property.id || '';
        if (isChecked) {
            setSelectedPropertyIds(prev => {
                // Only add if not already present
                if (!prev.includes(propId)) {
                    return [...prev, propId];
                }
                return prev;
            });
        } else {
            setSelectedPropertyIds(prev => prev.filter(id => id !== propId));
        }
    }, []);
    
    // Function to handle select all checkbox
    const handleSelectAllProperties = useCallback((isChecked: boolean) => {
        if (isChecked) {
            // Create an array of IDs from the current filteredProperties
            const allIds: (string | number)[] = [];
            filteredProperties.forEach(prop => {
                if (prop.id) {
                    allIds.push(prop.id);
                }
            });
            setSelectedPropertyIds(allIds);
        } else {
            setSelectedPropertyIds([]);
        }
        console.log(`Select all properties: ${isChecked}`);
    }, [filteredProperties]);
    
    // Function to handle slider changes for rent underwrite
    const handleRentSliderChange = (key: string, value: number) => {
        console.log(`Rent slider ${key} changed to ${value}`);
    };
    
    // Function to handle slider changes for flip underwrite
    const handleFlipSliderChange = (key: string, value: number) => {
        console.log(`Flip slider ${key} changed to ${value}`);
    };
    
    // Create direct API functions for underwrite slider values
    const getDefaultUnderwriteValues = useCallback(async (): Promise<UnderwriteSliderValues> => {
        try {
            // Add a timestamp to avoid caching issues
            const cacheBuster = `_=${new Date().getTime()}`;
            const response = await fetch(`${config.apiUrl}/api/underwrite-sliders?${cacheBuster}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch default underwrite values');
            }
            
            const data = await response.json();
            console.log('Received default values:', data);
            return data.data;
        } catch (error: unknown) {
            console.error('Error fetching default underwrite values:', error);
            // Return fallback values if API call fails
            return {
                rent: {
                    rent: 1000,
                    expense: 35,
                    capRate: 6.5,
                    lowRehab: 30,
                    highRehab: 40
                },
                flip: {
                    sellingCosts: 7,
                    holdingCosts: 4,
                    margin: 20,
                    lowRehab: 30,
                    highRehab: 40
                }
            };
        }
    }, []);

    const getPropertyUnderwriteValues = useCallback(async (propertyId: string, neighborhoodProperties: any[] = [], addressData: any | null = null): Promise<UnderwriteSliderValues> => {
        try {
            // Use encoded propertyId for the URL and add cache-busting
            const encodedPropertyId = encodeURIComponent(propertyId);
            const cacheBuster = `_=${new Date().getTime()}`;

            console.log('addressData...is...', addressData);
            
            // Use POST with /calculate endpoint if we have neighborhood properties
            if (neighborhoodProperties && neighborhoodProperties.length > 0) {
                const response = await fetch(`${config.apiUrl}/api/underwrite-sliders/${encodedPropertyId}/calculate?${cacheBuster}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ neighborhoodProperties, addressData })
                });
                
                if (!response.ok) {
                    throw new Error('Failed to fetch property underwrite values');
                }
                
                const data = await response.json();
                console.log(`Received values for property ${propertyId}:`, data);
                return data.data;
            } else {
                // Otherwise, use the standard GET endpoint
                const response = await fetch(`${config.apiUrl}/api/underwrite-sliders/${encodedPropertyId}?${cacheBuster}`);
                
                if (!response.ok) {
                    throw new Error('Failed to fetch property underwrite values');
                }
                
                const data = await response.json();
                console.log(`Received values for property ${propertyId}:`, data);
                return data.data;
            }
        } catch (error: unknown) {
            console.error(`Error fetching underwrite values for property ${propertyId}:`, error);
            // If API call fails, get default values instead
            return getDefaultUnderwriteValues();
        }
    }, [getDefaultUnderwriteValues]);
    
    const savePropertyUnderwriteValues = async (propertyId: string, values: UnderwriteSliderValues): Promise<string> => {
        try {
            const cacheBuster = `_=${new Date().getTime()}`;
            const response = await fetch(`${config.apiUrl}/api/underwrite-sliders?${cacheBuster}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ propertyId, values }),
            });
            
            if (!response.ok) {
                throw new Error('Failed to save underwrite values');
            }
            
            const data = await response.json();
            console.log('Values saved successfully:', data.message);
            return data.message || 'Underwrite values saved successfully';
        } catch (error: unknown) {
            console.error(`Error saving underwrite values for property ${propertyId}:`, error);
            throw error;
        }
    };
    
    // Function to handle all rent underwrite values changing
    // Memoize callbacks to prevent re-creation on each render
    const handleRentValuesChanged = useCallback((values: typeof rentUnderwriteValues) => {
        setRentUnderwriteValues(values);
        
        // Use the address as the property identifier
        const address = selectedAddress?.formattedAddress;
        if (address) {
            // Use a timeout to avoid too many API calls during slider movement
            const timer = setTimeout(() => {
                savePropertyUnderwriteValues(
                    address,
                    {
                        rent: values,
                        flip: flipUnderwriteValues
                    }
                ).catch((error: unknown) => console.error('Failed to save rent values:', error));
            }, 500);
            
            return () => clearTimeout(timer);
        }
    }, [selectedAddress?.formattedAddress, flipUnderwriteValues]);
    
    // Function to handle all flip underwrite values changing
    const handleFlipValuesChanged = useCallback((values: typeof flipUnderwriteValues) => {
        setFlipUnderwriteValues(values);
        
        // Use the address as the property identifier
        const address = selectedAddress?.formattedAddress;
        if (address) {
            // Use a timeout to avoid too many API calls during slider movement
            const timer = setTimeout(() => {
                savePropertyUnderwriteValues(
                    address,
                    {
                        rent: rentUnderwriteValues,
                        flip: values
                    }
                ).catch((error: unknown) => console.error('Failed to save flip values:', error));
            }, 500);
            
            return () => clearTimeout(timer);
        }
    }, [selectedAddress?.formattedAddress, rentUnderwriteValues]);
    
    // State for handling save estimate
    const [isSaving, setIsSaving] = useState(false);
    const toast = useToast();
    const user = useAppSelector((state) => state.user);

    // Buyers Drawer State
    const { isOpen: isBuyersDrawerOpen, onOpen: onOpenBuyersDrawer, onClose: onCloseBuyersDrawer } = useDisclosure();
    const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);
    const [selectedBuyers, setSelectedBuyers] = useState<string[]>([]);
    
    // Add state for buyers
    const [buyers, setBuyers] = useState<Buyer[]>([]);
    const [buyersLoading, setBuyersLoading] = useState(false);
    const [buyersError, setBuyersError] = useState<string | null>(null);
    
    // Get the radius from the API data
    const radiusMiles = property?.radiusUsed || 0.5;

    // Function to format price
    const formatPrice = (price: number | undefined) => {
        if (!price) return 'N/A';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(price);
    };

    // Function to format distance
    const formatDistance = (distance: number | string | undefined) => {
        if (distance === undefined || distance === null) return 'N/A';
        const numDistance = typeof distance === 'string' ? parseFloat(distance) : distance;
        return `${numDistance.toFixed(1)} mi`;
    };

    // Buyers Functions
    const handleBuyerClick = (buyer: Buyer) => {
        // Store the buyer in state and open the drawer
        setSelectedBuyer(buyer);
    };

    const toggleBuyerSelection = (buyerId: string) => {
        setSelectedBuyers(prev => 
            prev.includes(buyerId) 
                ? prev.filter(id => id !== buyerId) 
                : [...prev, buyerId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedBuyers.length === buyers.length) {
            setSelectedBuyers([]);
        } else {
            setSelectedBuyers(buyers.map((buyer, idx) => buyer.id || idx.toString()));
        }
    };

    // Get badge color for buyer type
    const getBuyerTypeColor = (type: string): string => {
        switch (type) {
            case 'Flipper':
                return 'green';
            case 'Landlord':
                return 'purple';
            case 'Developer':
                return 'blue';
            case 'Wholesaler':
                return 'gray';
            default:
                return 'gray';
        }
    };

    const handleSaveEstimate = async () => {
        // Only logged-in users can save estimates
        if (!user.isLoggedIn) {
            toast({
                title: "Login Required",
                description: "Please log in to save estimates.",
                status: "warning",
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        setIsSaving(true);

        try {
            // Get the current property data and address
            const property = propertyState.properties[0] || {};
            const address = selectedAddress?.formattedAddress || '';

            if (!address) {
                throw new Error('Property address not found');
            }

            // Define estimated offer range values - using static values for now
            // In a real implementation, these would be calculated based on property data
            const offerRangeLow = 54000;
            const offerRangeHigh = 64000;

            // Prepare estimate data with all fields inside the estimate_data object
            const estimateData = {
                user_id: user.user_id,
                property_address: address,
                estimate_data: {
                    property: property,
                    address: selectedAddress,
                    addressState: addressState,
                    timestamp: new Date().toISOString(),
                    offer_range_low: offerRangeLow,
                    offer_range_high: offerRangeHigh,
                    rent_underwrite_values: rentUnderwriteValues,
                    flip_underwrite_values: flipUnderwriteValues,
                    active_investment_strategy: activeInvestmentTab === 0 ? 'rent' : 'flip',
                    notes: ''
                }
            };

            // Send the request to save the estimate
            const response = await fetch(`${config.apiUrl}/api/saved-estimates`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(estimateData),
            });

            if (!response.ok) {
                throw new Error('Failed to save estimate');
            }

            toast({
                title: "Estimate Saved",
                description: "Your estimate has been saved successfully.",
                status: "success",
                duration: 5000,
                isClosable: true,
            });
        } catch (error) {
            console.error('Error saving estimate:', error);
            
            toast({
                title: "Error",
                description: "Failed to save estimate. Please try again.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Initialize custom order if needed
    useEffect(() => {
        // Only initialize custom order if it's empty and we're not actively sorting
        if (customPropertyOrder.length === 0 && neighborhoodProperties.length > 0 && !isSortingActive) {
            const initialOrder = neighborhoodProperties.map(p => p.id || '').filter(id => id !== '');
            setCustomPropertyOrder(initialOrder);
        }
    }, [neighborhoodProperties, customPropertyOrder.length, isSortingActive]);

    // Apply custom ordering to filtered properties
    const applyCustomOrder = useCallback((properties: RelatedProperty[]) => {
        if (customPropertyOrder.length === 0) {
            return properties;
        }

        // Create a map of property IDs to properties for fast lookup
        const propertyMap = new Map<string | number, RelatedProperty>(
            properties.map(p => [p.id || '', p])
        );
        
        // First, get properties in custom order that exist in filtered properties
        const orderedProperties = customPropertyOrder
            .map(id => propertyMap.get(id))
            .filter(p => p !== undefined) as RelatedProperty[];
        
        // Add any new properties that don't have an order yet
        const orderedIds = new Set(customPropertyOrder);
        const newProperties = properties.filter(p => p.id && !orderedIds.has(p.id));
        
        return [...orderedProperties, ...newProperties];
    }, [customPropertyOrder]);

    // Update draggable properties when filtered properties change
    useEffect(() => {
        const orderedProperties = applyCustomOrder(filteredProperties);
        setDraggableProperties(orderedProperties);
    }, [filteredProperties, applyCustomOrder, sortOrder]);
    
    // Handle drag start
    const handleDragStart = (index: number) => (e: React.DragEvent<HTMLDivElement>) => {
        setDraggedItemIndex(index);
        // Set the drag image to be the row
        const row = propertyTableRef.current?.querySelectorAll('tbody tr')[index];
        if (row) {
            // Make semi-transparent during drag
            const rowClone = row.cloneNode(true) as HTMLElement;
            rowClone.style.opacity = '0.5';
            document.body.appendChild(rowClone);
            e.dataTransfer.setDragImage(rowClone, 0, 0);
            setTimeout(() => {
                document.body.removeChild(rowClone);
            }, 0);
        }
        e.dataTransfer.setData('text/plain', index.toString());
    };
    
    // Handle drag over
    const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>) => {
        e.preventDefault(); // Allow drop
        e.currentTarget.style.borderBottom = '2px solid green';
    };
    
    // Handle drag leave
    const handleDragLeave = (e: React.DragEvent<HTMLTableRowElement>) => {
        e.currentTarget.style.borderBottom = '';
    };
    
    // Handle drop
    const handleDrop = (targetIndex: number) => (e: React.DragEvent<HTMLTableRowElement>) => {
        e.preventDefault();
        e.currentTarget.style.borderBottom = '';
        
        if (draggedItemIndex === null || draggedItemIndex === targetIndex) {
            return;
        }
        
        // Create a new array with the items reordered
        const newProperties = [...draggableProperties];
        const [movedItem] = newProperties.splice(draggedItemIndex, 1);
        newProperties.splice(targetIndex, 0, movedItem);
        
        // Update the draggable properties
        setDraggableProperties(newProperties);
        
        // Update the custom order to persist across filter changes
        const newOrder = newProperties
            .map(p => p.id || '')
            .filter(id => id !== '');
        setCustomPropertyOrder(newOrder);
        
        // Turn off active sorting when manual reordering is used
        setIsSortingActive(false);
        
        setDraggedItemIndex(null);
    };

    // Create a reusable function to fetch buyers data
    const fetchBuyersData = useCallback(async () => {
        setBuyersLoading(true);
        setBuyersError(null);
        try {
            // const cacheBuster = `_=${new Date().getTime()}`;
            const response = await fetch(`${config.apiUrl}/api/buyer-matching/all-active`);
            if (!response.ok) {
                throw new Error(`Failed to fetch buyers: ${response.status}`);
            }
            
            const responseData = await response.json();
            
            if (!responseData.success) {
                throw new Error(responseData.message || 'Failed to fetch buyers');
            }
            
            // Get the current property data for matching
            const property = propertyState.properties[0] || null;
            const propertyDetails = property?.addressData?.items?.[0] || null;
            
            // Extract property attributes needed for matching
            const propertyBedrooms = propertyDetails?.bedrooms || 0;
            const propertyBathrooms = propertyDetails?.bathrooms || 0;
            const propertySqFt = propertyDetails?.square_footage || 0;
            const propertyYear = propertyDetails?.year_built || 0;
            
            console.log('[fetchBuyersData] Property attributes for matching:', {
                bedrooms: propertyBedrooms,
                bathrooms: propertyBathrooms,
                squareFootage: propertySqFt,
                yearBuilt: propertyYear
            });
            
            // Transform and filter backend data
            const buyerData = responseData.data as BackendBuyer[];
            console.log('[fetchBuyersData] Successfully received backend buyers data:', buyerData);
            
            // Filter buyers based on property attributes
            const filteredBuyers = buyerData.filter(buyer => {
                const profile = buyer.investor_profile || {};
                
                // Check minimum bedrooms
                const minBedrooms = profile.min_prop_attr_br_cnt || 0;
                if (minBedrooms > propertyBedrooms) {
                    console.log(`Filtered out buyer ${buyer.investor_company_nm_txt} - requires ${minBedrooms} bedrooms, property has ${propertyBedrooms}`);
                    return false;
                }
                
                // Check minimum bathrooms
                const minBathrooms = profile.min_prop_attr_bth_cnt || 0;
                if (minBathrooms > propertyBathrooms) {
                    console.log(`Filtered out buyer ${buyer.investor_company_nm_txt} - requires ${minBathrooms} bathrooms, property has ${propertyBathrooms}`);
                    return false;
                }
                
                // Check minimum square footage
                const minSqFt = profile.min_sqft || 0;
                if (minSqFt > propertySqFt) {
                    console.log(`Filtered out buyer ${buyer.investor_company_nm_txt} - requires ${minSqFt} sqft, property has ${propertySqFt}`);
                    return false;
                }
                
                // Check minimum year built
                const minYear = profile.min_year || 0;
                if (minYear > propertyYear) {
                    console.log(`Filtered out buyer ${buyer.investor_company_nm_txt} - requires properties built after ${minYear}, property built in ${propertyYear}`);
                    return false;
                }
                
                // Check zip code list if specified
                if (profile.list_zips && profile.list_zips.length > 0) {
                    const propertyZip = propertyDetails?.zip_code;
                    if (propertyZip && !profile.list_zips.includes(propertyZip)) {
                        console.log(`Filtered out buyer ${buyer.investor_company_nm_txt} - only buys in zip codes ${profile.list_zips.join(', ')}, property is in ${propertyZip}`);
                        return false;
                    }
                }
                
                // Check price range
                const minPrice = profile.min_props_amnt || 0;
                const maxPrice = profile.mx_props_amnt || Number.MAX_SAFE_INTEGER;
                
                // Skip price check if no price information is available
                // The property price isn't directly available in AddressData
                // We could estimate from other sources if needed
                if (minPrice > 0 || maxPrice < Number.MAX_SAFE_INTEGER) {
                    console.log(`Skipping price range check for buyer ${buyer.investor_company_nm_txt} - no property price available`);
                }
                
                // Buyer matches all criteria
                return true;
            });
            
            console.log(`[fetchBuyersData] Filtered from ${buyerData.length} to ${filteredBuyers.length} matching buyers`);
            
            // Transform matching buyers to frontend format
            const transformedBuyers = filteredBuyers.map(backendBuyer => 
                transformBuyerData(backendBuyer)
            );
            
            console.log('[fetchBuyersData] Final matching buyers:', transformedBuyers);
            setBuyers(transformedBuyers);
        } catch (error) {
            console.error('[fetchBuyersData] Error fetching buyers:', error);
            setBuyersError('Failed to load buyers. Please try again.');
        } finally {
            setBuyersLoading(false);
        }
    }, [propertyState.properties]);
    
    // Enhanced onOpenBuyersDrawer that fetches data when drawer opens
    const onOpenBuyersDrawerWithFetch = useCallback(() => {
        fetchBuyersData();
        onOpenBuyersDrawer();
    }, [fetchBuyersData, onOpenBuyersDrawer]);
    
    // Load buyers when component mounts (optional - can remove this if only want to load on drawer open)
    useEffect(() => {
        fetchBuyersData();
    }, [fetchBuyersData]);

    return (
        <Box w="100%">
            {/* Heading Box */}
            <Box mb={4} p={4} pt={0} mt={0}>
                <Heading size="lg" color={textPrimary}>
                    Estimated Offer
                </Heading>
                <Text color={textSecondary} mt={1}>
                    Valuation and market comparison for your property
                </Text>
            </Box>

             {/* Property details card */}
             <PropertyHeaderCard
                        selectedAddress={selectedAddress}
                        googleApiKey={googleApiKey}
                        propertyDetails={propertyDetailsForHeader}
                        homesSoldCount={24}
                        interestedBuyersCount={6}
                    />
            
            {/* Estimated Offer Range */}
            <EstimatedOfferRange 
                strategy={activeInvestmentTab === 0 ? 'rent' : 'flip'}
            />

            <Box 
                mt={3} 
                mb={6}
            >
                
                {/* Action Buttons */}
                <Flex 
                    justifyContent="space-between" 
                    wrap="wrap" 
                    gap={2}
                    mb={5}
                >
                    <Button 
                        variant="outline" 
                        borderWidth="1px"
                    borderRadius="md"
                        colorScheme="green"
                        size="md"
                        flex={{ base: "1 0 48%", md: "1" }}
                        py={4}
                        onClick={() => handleOpenCallbackModal()}
                    >
                        Speak with Analyst
                    </Button>
                    <Button 
                        variant="outline" 
                        borderWidth="1px"
                    borderRadius="md"
                        colorScheme="gray"
                        size="md"
                        flex={{ base: "1 0 48%", md: "1" }}
                        py={4}
                        onClick={onOpenBuyersDrawerWithFetch}
                    >
                        Interested Buyers
                    </Button>
                    <Button 
                        variant="outline" 
                    borderWidth="1px"
                        borderRadius="md"
                        colorScheme="gray"
                        size="md"
                        flex={{ base: "1 0 48%", md: "1" }}
                        py={4}
                        onClick={() => handleSaveEstimate()}
                        isLoading={isSaving}
                    >
                        Save Estimate
                    </Button>
                    <Button 
                        bg="green.800"
                        color="white"
                        borderRadius="md"
                        size="md"
                        flex={{ base: "1 0 48%", md: "1" }}
                        py={4}
                        _hover={{ bg: "green.700" }}
                        onClick={onNext}
                    >
                        Executive Services
                    </Button>
                </Flex>
                </Box>

                <Box  mt={3} 
                mb={6}>
                <Heading color={textPrimary} as="h3" size="md">Underwrite</Heading>
                <Tabs 
                    variant="enclosed" 
                    align='end'
                    colorScheme="green" 
                    index={activeInvestmentTab}
                    onChange={(index) => setActiveInvestmentTab(index)}
                >
                    <TabList>
                        <Tab 
                            borderTopRadius="md"
                            borderBottom={0}
                            fontWeight="semibold"
                        >
                            Rental
                        </Tab>
                        <Tab 
                            borderTopRadius="md"
                            borderBottom={0}
                            fontWeight="semibold"
                        >
                            Flip
                        </Tab>
                    </TabList>
                    <TabPanels p={0} m={0}>
                        <TabPanel p={0} m={0}>
                            {isLoadingSliderValues ? (
                                <Center py={10}>
                                    <Spinner size="xl" color="green.500" />
                                </Center>
                            ) : (
                                <RentUnderwriteSliders 
                                    initialValues={rentUnderwriteValues}
                                    onSliderChange={handleRentSliderChange}
                                    onValuesChanged={handleRentValuesChanged}
                                />
                            )}
                        </TabPanel>
                        <TabPanel p={0} m={0}>
                            {isLoadingSliderValues ? (
                                <Center py={10}>
                                    <Spinner size="xl" color="green.500" />
                                </Center>
                            ) : (
                                <FlipUnderwriteSliders 
                                    initialValues={flipUnderwriteValues}
                                    onSliderChange={handleFlipSliderChange}
                                    onValuesChanged={handleFlipValuesChanged}
                                />
                            )}
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </Box> 

            {/* Neighborhood analysis section */}
            <VStack spacing={4} align="stretch" mb={6}>
                <Heading color={textPrimary} as="h3" size="md">
                    Neighborhood Comps
                </Heading>
            </VStack>

            {/* Comparable Properties Box */}
            <Box
                p={5}
                borderRadius="md"
                mb={6}
                bg={bgPrimary}
                borderWidth="1px"
                borderColor={borderPrimary}
                boxShadow="md"
            >
                {/* Property Map */}
                <Box
                    h="300px"
                    mb={6}
                    borderRadius="md"
                    overflow="hidden"
                    borderWidth="1px"
                    borderColor={borderPrimary}
                    position="relative"
                >
                    {/* Rental properties toggle button */}
                    <Flex 
                        position="absolute" 
                        top={2} 
                        right={2} 
                        zIndex={10}
                        bg="white" 
                        p={2} 
                        borderRadius="md" 
                        boxShadow="md"
                        alignItems="center"
                        direction="column"
                        gap={2}
                    >
                        <FormControl display="flex" alignItems="center" justifyContent="space-between" w="100%" size="sm">
                            <FormLabel htmlFor="show-rentals" mb="0" fontSize="sm" fontWeight="medium">
                                Show Rentals
                            </FormLabel>
                            <Flex alignItems="center">
                                <Badge 
                                    ml={1} 
                                    mr={2} 
                                    colorScheme="blue" 
                                    borderRadius="full"
                                >
                                    {rentalPropertiesCount}
                                </Badge>
                                <Switch 
                                    id="show-rentals" 
                                    colorScheme="brand" 
                                    size="sm"
                                    isChecked={showRentalProperties}
                                    onChange={(e) => {setShowRentalProperties(e.target.checked);}}
                                    isDisabled={rentalPropertiesCount === 0}
                                />
                            </Flex>
                        </FormControl>
                        
                        {/* Sold properties only toggle */}
                        <FormControl display="flex" alignItems="center" justifyContent="space-between" w="100%" size="sm">
                            <FormLabel htmlFor="show-sold-only" mb="0" fontSize="sm" fontWeight="medium">
                                Sold Only
                            </FormLabel>
                            <Flex alignItems="center">
                                <Badge 
                                    ml={1} 
                                    mr={2} 
                                    colorScheme="red" 
                                    borderRadius="full"
                                >
                                    {soldPropertiesCount}
                                </Badge>
                                <Switch 
                                    id="show-sold-only" 
                                    colorScheme="brand" 
                                    size="sm"
                                    isChecked={showSoldOnly}
                                    onChange={(e) => {setShowSoldOnly(e.target.checked);}}
                                />
                            </Flex>
                        </FormControl>
                    </Flex>
                    
                    <AddressMap
                        key="property-map"
                        latitude={addressState.lat}
                        longitude={addressState.lng}
                        address={addressState.formattedAddress}
                        forceEmptyProperties={neighborhoodProperties.length === 0}
                        properties={filteredProperties}
                        radiusMiles={radiusMiles}
                        showProperties={true}
                        height="300px"
                        highlightedPropertyId={highlightedPropertyId}
                        selectedPropertyIds={selectedPropertyIds}
                        onInfoWindowClose={handleResetHighlight}
                    />
                </Box>

                {/* Properties Table */}
                <Box overflowX="auto">
                    <Table size="sm" variant="simple" ref={propertyTableRef}>
                        <Thead bg={bgSecondary}>
                            <Tr>
                                <Th width="40px">
                                    <Checkbox 
                                        colorScheme="green" 
                                        onChange={(e) => {
                                            handleSelectAllProperties(e.target.checked);
                                        }}
                                        isChecked={selectedPropertyIds.length > 0 && 
                                            selectedPropertyIds.length === filteredProperties.length && 
                                            filteredProperties.length > 0}
                                        isIndeterminate={selectedPropertyIds.length > 0 && 
                                            selectedPropertyIds.length < filteredProperties.length}
                                    />
                                </Th>
                                <Th width="40px"></Th>
                                <Th 
                                    _hover={{ cursor: 'pointer' }}
                                    onClick={() => {
                                        setIsSortingActive(true);
                                        setSortOrder(
                                            sortOrder === 'Listing' 
                                            ? 'Listing Reverse' 
                                            : 'Listing'
                                        );
                                        // Reset custom order when sorting
                                        setCustomPropertyOrder([]);
                                    }}
                                >
                                    Listing {sortOrder.includes('Listing') && (
                                        <Icon 
                                            as={
                                                sortOrder === 'Listing' 
                                                ? FaCaretDown as React.ElementType 
                                                : FaCaretUp as React.ElementType
                                            } 
                                            ml={1}
                                        />
                                    )}
                                </Th>
                                <Th 
                                    _hover={{ cursor: 'pointer' }}
                                    onClick={() => {
                                        setIsSortingActive(true);
                                        setSortOrder(
                                            sortOrder === 'Address' 
                                            ? 'Address Reverse' 
                                            : 'Address'
                                        );
                                        // Reset custom order when sorting
                                        setCustomPropertyOrder([]);
                                    }}
                                >
                                    Address {sortOrder.includes('Address') && (
                                        <Icon 
                                            as={
                                                sortOrder === 'Address' 
                                                ? FaCaretDown as React.ElementType
                                                : FaCaretUp as React.ElementType
                                            } 
                                            ml={1}
                                        />
                                    )}
                                </Th>
                                <Th 
                                    _hover={{ cursor: 'pointer' }}
                                    onClick={() => {
                                        setIsSortingActive(true);
                                        setSortOrder(
                                            sortOrder === 'Date' 
                                            ? 'Date Reverse' 
                                            : 'Date'
                                        );
                                        // Reset custom order when sorting
                                        setCustomPropertyOrder([]);
                                    }}
                                >
                                    Date {sortOrder.includes('Date') && (
                                        <Icon 
                                            as={
                                                sortOrder === 'Date' 
                                                ? FaCaretDown as React.ElementType
                                                : FaCaretUp as React.ElementType
                                            } 
                                            ml={1}
                                        />
                                    )}
                                </Th>
                                <Th 
                                    _hover={{ cursor: 'pointer' }}
                                    onClick={() => {
                                        setIsSortingActive(true);
                                        setSortOrder(
                                            sortOrder === 'Price (Low to High)' 
                                            ? 'Price (High to Low)' 
                                            : 'Price (Low to High)'
                                        );
                                        // Reset custom order when sorting
                                        setCustomPropertyOrder([]);
                                    }}
                                >
                                    Price {sortOrder.includes('Price') && (
                                        <Icon 
                                            as={
                                                sortOrder === 'Price (Low to High)' 
                                                ? FaCaretDown as React.ElementType
                                                : FaCaretUp as React.ElementType
                                            } 
                                            ml={1}
                                        />
                                    )}
                                </Th>
                                <Th 
                                    _hover={{ cursor: 'pointer' }}
                                    onClick={() => {
                                        setIsSortingActive(true);
                                        setSortOrder(
                                            sortOrder === 'Distance' 
                                            ? 'Distance Reverse' 
                                            : 'Distance'
                                        );
                                        // Reset custom order when sorting
                                        setCustomPropertyOrder([]);
                                    }}
                                >
                                    Distance {sortOrder.includes('Distance') && (
                                        <Icon 
                                            as={
                                                sortOrder === 'Distance' 
                                                ? FaCaretDown as React.ElementType
                                                : FaCaretUp as React.ElementType
                                            } 
                                            ml={1}
                                        />
                                    )}
                                </Th>
                                <Th 
                                    _hover={{ cursor: 'pointer' }}
                                    onClick={() => {
                                        setIsSortingActive(true);
                                        setSortOrder(
                                            sortOrder === 'Bed' 
                                            ? 'Bed Reverse' 
                                            : 'Bed'
                                        );
                                        // Reset custom order when sorting
                                        setCustomPropertyOrder([]);
                                    }}
                                >
                                    Bed {sortOrder.includes('Bed') && (
                                        <Icon 
                                            as={
                                                sortOrder === 'Bed' 
                                                ? FaCaretDown as React.ElementType
                                                : FaCaretUp as React.ElementType
                                            } 
                                            ml={1}
                                        />
                                    )}
                                </Th>
                                <Th 
                                    _hover={{ cursor: 'pointer' }}
                                    onClick={() => {
                                        setIsSortingActive(true);
                                        setSortOrder(
                                            sortOrder === 'Bath' 
                                            ? 'Bath Reverse' 
                                            : 'Bath'
                                        );
                                        // Reset custom order when sorting
                                        setCustomPropertyOrder([]);
                                    }}
                                >
                                    Bath {sortOrder.includes('Bath') && (
                                        <Icon 
                                            as={
                                                sortOrder === 'Bath' 
                                                ? FaCaretDown as React.ElementType
                                                : FaCaretUp as React.ElementType
                                            } 
                                            ml={1}
                                        />
                                    )}
                                </Th>
                                <Th 
                                    _hover={{ cursor: 'pointer' }}
                                    onClick={() => {
                                        setIsSortingActive(true);
                                        setSortOrder(
                                            sortOrder === 'Square Footage' 
                                            ? 'Square Footage Reverse' 
                                            : 'Square Footage'
                                        );
                                        // Reset custom order when sorting
                                        setCustomPropertyOrder([]);
                                    }}
                                >
                                    Sqft {sortOrder.includes('Square Footage') && (
                                        <Icon 
                                            as={
                                                sortOrder === 'Square Footage' 
                                                ? FaCaretDown as React.ElementType
                                                : FaCaretUp as React.ElementType
                                            } 
                                            ml={1}
                                        />
                                    )}
                                </Th>
                                <Th 
                                    _hover={{ cursor: 'pointer' }}
                                    onClick={() => {
                                        setIsSortingActive(true);
                                        setSortOrder(
                                            sortOrder === 'Year Built' 
                                            ? 'Year Built Reverse' 
                                            : 'Year Built'
                                        );
                                        // Reset custom order when sorting
                                        setCustomPropertyOrder([]);
                                    }}
                                >
                                    Year {sortOrder.includes('Year Built') && (
                                        <Icon 
                                            as={
                                                sortOrder === 'Year Built' 
                                                ? FaCaretDown as React.ElementType
                                                : FaCaretUp as React.ElementType
                                            } 
                                            ml={1}
                                        />
                                    )}
                                </Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {neighborhoodProperties.length === 0 ? (
                                <Tr>
                                    <Td colSpan={11} textAlign="center" py={4}>
                                        <Flex direction="column" align="center" py={4}>
                                            <Icon as={FaInfoCircle as React.ElementType} color="blue.400" boxSize={6} mb={2} />
                                            <Text>No properties found in this neighborhood</Text>
                                        </Flex>
                                    </Td>
                                </Tr>
                            ) : (
                                
                                // Map through properties with proper sorting
                                draggableProperties.map((property, index) => (
                                    <Tr 
                                        key={property.id || index} 
                                        _hover={{ bg: "rgba(0, 128, 0, 0.1)", cursor: 'pointer' }}
                                        onClick={() => handlePropertyRowClick(property)}
                                        bg={
                                            (highlightedPropertyId === property.id) 
                                                ? "rgba(229, 62, 62, 0.1)"  // Highlighted in red
                                                : (property.id && selectedPropertyIds.includes(property.id))
                                                    ? "rgba(49, 151, 149, 0.1)"  // Selected in teal
                                                    : undefined
                                        }
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop(index)}
                                        data-index={index}
                                    >
                                        <Td onClick={(e) => e.stopPropagation()}>
                                            <Checkbox 
                                                colorScheme="green" 
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    handlePropertySelect(property, e.target.checked);
                                                }}
                                                isChecked={property.id ? selectedPropertyIds.indexOf(property.id) >= 0 : false}
                                            />
                                        </Td>
                                        <Td>
                                            <Box
                                                as="div"
                                                cursor="grab" 
                                                className="drag-handle"
                                                onClick={(e) => e.stopPropagation()}
                                                _hover={{ color: "gray.600" }}
                                                draggable
                                                onDragStart={handleDragStart(index)}
                                            >
                                                <Icon 
                                                    as={FaGripVertical as React.ElementType} 
                                                    color="gray.400"
                                                />
                                            </Box>
                                        </Td>
                                        <Td>
                                            <Badge 
                                                colorScheme={
                                                    property.status === 'SOLD' || property.status === 'Sold' 
                                                        ? 'red' 
                                                        : property.status === 'LISTED_RENT' || property.status === 'LISTING_REMOVED' 
                                                            ? 'blue' 
                                                            : 'green'
                                                }
                                                fontSize="xs"
                                                textTransform="uppercase"
                                            >
                                                {property.status === 'LISTED_RENT' ? 'RENTAL' : (property.status || 'UNKNOWN')}
                                            </Badge>
                                        </Td>
                                        <Td>{property.address}</Td>
                                        <Td>{property.soldDate || ''}</Td>
                                        <Td>{formatPrice(property.price)}</Td>
                                        <Td>{formatDistance(property.distance)}</Td>
                                        <Td>{property.bedrooms || 3}</Td>
                                        <Td>{property.bathrooms || 1}</Td>
                                        <Td>{property.squareFootage || 1024}</Td>
                                        <Td>{property.yearBuilt || 1964}</Td>
                                    </Tr>
                                ))
                            )}
                        </Tbody>
                    </Table>
                </Box>
            </Box>

            {/* Back/Verify Buttons Box */}
            <Box>
                <HStack w="100%" spacing={4}>
                    <Button
                        leftIcon={<Icon as={FaArrowLeft as React.ElementType} />}
                        variant="outline"
                        onClick={handleBackToStep2}
                        flex="1"
                    >
                        Back
                    </Button>
                    <Button
                        colorScheme="brand"
                        flex="2"
                        onClick={onNext}
                    >
                        Continue to Executive Services
                    </Button>
                </HStack>
            </Box>

            {/* Interested Buyers Drawer */}
            <Drawer
                isOpen={isBuyersDrawerOpen}
                placement="right"
                onClose={onCloseBuyersDrawer}
                size="md"
            >
                <DrawerOverlay 
                    backdropFilter="blur(4px)" 
                    bg="blackAlpha.300" 
                    onClick={(e) => {
                        // Prevent propagation to avoid closing nested drawers
                        e.stopPropagation();
                    }}
                />
                <DrawerContent bg={bgPrimary} boxShadow="dark-lg">
                    <DrawerCloseButton size="lg" />
                    <DrawerHeader borderBottomWidth="1px" py={4}>
                    <Flex justifyContent="flex-start" alignItems="center">
                            <Text>Active Buyers</Text>
                            <Spacer />
                            <Badge colorScheme="blue" fontSize="md" borderRadius="md" mr={30}>
                                {buyersLoading ? <Spinner size="xs" /> : buyers.length} Buyers
                            </Badge>
                        </Flex>
                    </DrawerHeader>

                    <DrawerBody py={6}>
                        {buyersLoading ? (
                            <Flex justify="center" align="center" py={10}>
                                <Spinner size="xl" color="brand.500" />
                            </Flex>
                        ) : buyersError ? (
                            <Box p={4} bg="red.50" color="red.600" borderRadius="md">
                                <Heading size="sm">Error loading buyers</Heading>
                                <Text mt={2}>{buyersError}</Text>
                                <Button 
                                    mt={4} 
                                    colorScheme="red" 
                                    size="sm"
                                    onClick={fetchBuyersData}
                                >
                                    Retry
                                </Button>
                            </Box>
                        ) : buyers.length === 0 ? (
                            <Box p={4} textAlign="center">
                                <Heading size="sm" color="gray.500">No active buyers found</Heading>
                                <Text mt={2} fontSize="sm" color="gray.500">
                                    There are no active buyers matching this property's criteria in the database.
                                </Text>
                            </Box>
                        ) : (
                            <VStack spacing={4} align="stretch">
                                {buyers.map((buyer, idx) => (
                                    <Box 
                                        key={buyer.id || idx} 
                                        borderWidth="1px" 
                                        borderColor="gray.200" 
                                        borderRadius="md" 
                                        p={4}
                                        position="relative"
                                        cursor="pointer"
                                        _hover={{ boxShadow: "md", borderColor: "brand.500" }}
                                        transition="all 0.2s"
                                        onClick={() => {
                                            handleBuyerClick(buyer);
                                        }}
                                    >
                                        <Flex align="center" mb={2}>
                                            <Box 
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Prevent the parent onClick from firing
                                                    toggleBuyerSelection(buyer.id || idx.toString());
                                                }}
                                            >
                                                <Checkbox 
                                                    colorScheme="brand" 
                                                    size="lg" 
                                                    isChecked={selectedBuyers.includes(buyer.id || idx.toString())} 
                                                    onChange={(e) => {
                                                        e.stopPropagation(); // Prevent parent onClick from firing
                                                        toggleBuyerSelection(buyer.id || idx.toString());
                                                    }}
                                                />
                                            </Box>
                                            <Heading size="md" ml={3}>{buyer.name}</Heading>
                                        </Flex>
                                        
                                        <Text color="gray.600" mb={2} ml={10}>
                                            <Icon as={FaMapMarkerAlt as React.ElementType} mr={1} />
                                            {buyer.address}
                                        </Text>
                                        
                                        <Flex ml={10} wrap="wrap" gap={2} mb={3}>
                                            {buyer.type.map((type, typeIdx) => (
                                                <Badge 
                                                    key={typeIdx} 
                                                    colorScheme={getBuyerTypeColor(type)} 
                                                    fontSize="sm" 
                                                    py={1} 
                                                    px={2}
                                                    borderRadius="md"
                                                >
                                                    {type}
                                                </Badge>
                                            ))}
                                            <Badge
                                                fontSize="sm"
                                                py={1}
                                                px={2}
                                                borderRadius="md"
                                                variant="outline"
                                            >
                                                {buyer.priceRange}
                                            </Badge>
                                        </Flex>
                                        
                                        <Box ml={10} mb={1}>
                                            <Text fontSize="sm" fontWeight="medium" mb={1}>
                                                Likelihood
                                            </Text>
                                            <Flex align="center">
                                                <Box w="70%" mr={4}>
                                                    <Progress 
                                                        value={buyer.likelihood === 'Likely' ? 75 : 50} 
                                                        colorScheme={buyer.likelihood === 'Likely' ? 'green' : 'yellow'}
                                                        size="sm"
                                                        borderRadius="full"
                                                    />
                                                </Box>
                                                <Text fontSize="sm" fontWeight="bold">
                                                    {buyer.likelihood}
                                                </Text>
                                            </Flex>
                                        </Box>
                                        
                                        <Badge 
                                            position="absolute" 
                                            bottom={3} 
                                            right={3} 
                                            colorScheme="green" 
                                            borderRadius="full"
                                            fontSize="xs"
                                            px={2}
                                        >
                                            {buyer.recentPurchases} Recent Purchases
                                        </Badge>
                                    </Box>
                                ))}
                                
                                <Flex justify="space-between" mt={4}>
                                    <Checkbox 
                                        colorScheme="brand"
                                        isChecked={selectedBuyers.length === buyers.length && buyers.length > 0}
                                        onChange={toggleSelectAll}
                                    >
                                        Select All
                                    </Checkbox>
                                    <Button 
                                        rightIcon={<Icon as={FaDownload as React.ElementType} />} 
                                        colorScheme="gray"
                                        size="sm"
                                    >
                                        Download List
                                    </Button>
                                </Flex>
                            </VStack>
                        )}
                    </DrawerBody>
                </DrawerContent>
            </Drawer>

            {/* BuyerDetailDrawer for displaying details of a selected buyer */}
            {selectedBuyer && (
                <BuyerDetailDrawer 
                    isOpen={selectedBuyer !== null}
                    onClose={() => setSelectedBuyer(null)} 
                    buyer={selectedBuyer} 
                />
            )}
        </Box>
    );
};

export default EstimatedOfferStep;
