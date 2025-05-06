import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    VStack,
    Text,
    Flex,
    Stepper,
    Step,
    StepIndicator,
    StepStatus,
    StepTitle,
    StepDescription,
    StepSeparator,
    StepNumber,
    Divider,
    Spacer,
    Icon,
    Button,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    Spinner,
    Center,
    Progress,
    Heading,
    HStack,
} from '@chakra-ui/react';
import { CheckIcon } from '@chakra-ui/icons';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { APIProvider } from '@vis.gl/react-google-maps';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setAddressData } from '../store/addressSlice';
import { AddressComponents } from '../address/components/PlaceAutocompleteInput';
import { FaArrowLeft, FaCheck } from 'react-icons/fa';
import AddressInputStep from "./components/steps/AddressInputStep";
import ConditionStep from "./components/steps/ConditionStep";
import EstimatedOfferStep from "./components/steps/EstimatedOfferStep";
import ExecutiveServicesStep from "./components/steps/ExecutiveServicesStep";
import { addProperty, setProperties, setError, clearPropertyData } from '../store/propertySlice';
import SpecialistCallModal from './components/SpecialistCallModal';
import config from '../../../config';

const EstimatePage: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();
    
    // Flag to track step transitions
    const [isTransitioning, setIsTransitioning] = useState(false);
    
    // Add minimum loading time state
    const [showMinimumLoading, setShowMinimumLoading] = useState(false);
    const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);
    
    // Initialize step from URL or default to 1
    const initialStep = parseInt(searchParams.get('step') || '1', 10);
    const [step, setStep] = useState(initialStep);
    
    // Function to update both state and URL when changing steps
    const updateStep = (newStep: number) => {
        console.log(`Updating step from ${step} to ${newStep}`);
        setIsTransitioning(true);
        setStep(newStep);
        setSearchParams({ step: newStep.toString() });
        
        // Reset the transition flag after a short delay
        setTimeout(() => {
            setIsTransitioning(false);
            console.log(`Step transition to ${newStep} complete`);
        }, 100);
    };

    // Add debug useEffect to track step changes
    useEffect(() => {
        console.log(`Current step: ${step}`);
    }, [step]);

    // Address input
    const [addressInput, setAddressInput] = useState('');
    const [selectedAddress, setSelectedAddress] = useState<AddressComponents | null>(null);

    // Condition (no longer used for fetching, but you can still store it)
    const [selectedCondition, setSelectedCondition] = useState('');
    // Button spinner state
    const [isButtonLoading, setIsButtonLoading] = useState(false);

    // Property type state
    const [propertyType, setPropertyType] = useState<string>('');
    const [isSingleFamilyHome, setIsSingleFamilyHome] = useState<boolean>(true);

    // Other UI states
    const [isCallbackModalOpen, setIsCallbackModalOpen] = useState(false);

    // Refs for smooth scrolling
    const step1Ref = useRef<HTMLDivElement | null>(null);
    const step2Ref = useRef<HTMLDivElement | null>(null);
    const step3Ref = useRef<HTMLDivElement | null>(null);
    const step4Ref = useRef<HTMLDivElement | null>(null);
    const step5Ref = useRef<HTMLDivElement | null>(null);

    const googleApiKey = (window as any).env?.REACT_APP_Maps_API_KEY || process.env.REACT_APP_Maps_API_KEY || '';
    const addressState = useAppSelector((state) => state.address);
    const propertyState = useAppSelector((state) => state.property);

    // Add loading states
    const [isPropertyDataLoading, setIsPropertyDataLoading] = useState(false);
    const [propertyDataLoaded, setPropertyDataLoaded] = useState(false);

    // Update local state when the address slice updates
    useEffect(() => {
        if (addressState.formattedAddress) {
            setAddressInput(addressState.formattedAddress);
            setSelectedAddress({
                street1: addressState.street1,
                street2: addressState.street2,
                city: addressState.city,
                state: addressState.state,
                zip: addressState.zip,
                formattedAddress: addressState.formattedAddress,
                lat: addressState.lat,
                lng: addressState.lng,
            });
            setSelectedCondition(addressState.condition || '');
        }
    }, [addressState]);

    // Sync URL with current step when component mounts
    useEffect(() => {
        // Skip if we're in a transition to avoid conflicts
        if (isTransitioning) {
            console.log("Skipping URL sync during transition");
            return;
        }
        
        const stepParam = searchParams.get('step');
        if (stepParam) {
            const parsedStep = parseInt(stepParam, 10);
            if (parsedStep !== step && parsedStep >= 1 && parsedStep <= 5) {
                console.log(`URL has step ${parsedStep}, updating from current step ${step}`);
                // Important: Use setIsTransitioning to prevent validation from running immediately
                setIsTransitioning(true);
                setStep(parsedStep);
                // Reset the transition flag after a delay
                setTimeout(() => {
                    setIsTransitioning(false);
                    console.log(`URL-triggered step transition to ${parsedStep} complete`);
                }, 100);
            }
        } else if (step !== 1) {
            // If no step in URL but step state is not 1, update URL without triggering transition
            console.log(`No step in URL, updating URL to step ${step}`);
            setSearchParams({ step: step.toString() }, { replace: true });
        }
    }, [location.search, step, setSearchParams, searchParams]);
    
    // Validate step transitions based on data availability
    useEffect(() => {
        // Skip validation if we're in the middle of a transition
        if (isTransitioning) {
            console.log("Skipping validation during transition");
            return;
        }
        
        // Only allow step 2+ if we have an address
        if (step > 1 && !selectedAddress) {
            console.log("No address available, resetting to step 1");
            // Use setIsTransitioning here as well to prevent feedback loops
            setIsTransitioning(true);
            setStep(1);
            setSearchParams({ step: '1' }, { replace: true });
            setTimeout(() => {
                setIsTransitioning(false);
                console.log("Validation-triggered step transition to 1 complete");
            }, 100);
            return;
        }
        
        // We've removed the property data check to allow navigation to step 3
        // even if property data isn't loaded yet
        
        console.log("Step validation ran, current step:", step);
    }, [step, selectedAddress, isTransitioning, setSearchParams]);

    // Add a progress indicator to show when property data is loading
    useEffect(() => {
        // If we're on step 2 and property data is loading, show a loading state
        if (step === 2 && isPropertyDataLoading) {
            // Don't automatically set button loading when the step loads
            // This was causing the button to show "Processing..." even before clicking
            // setIsButtonLoading(true);
        } else if (step === 2 && propertyDataLoaded) {
            setIsButtonLoading(false);
        }
    }, [step, isPropertyDataLoading, propertyDataLoaded]);

    // Function to fetch property data
    const fetchPropertyData = async () => {
        if (!selectedAddress) {
            console.log("Cannot fetch property data without a selected address");
            return;
        }
        
        console.log("Starting property data fetch for address:", selectedAddress.formattedAddress);
        
        try {
            setIsPropertyDataLoading(true);
            setPropertyDataLoaded(false);
            
            // Clear existing property data first
            dispatch(setProperties([]));
            
            const response = await fetch(`${config.apiUrl}/api/property/property-data`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: selectedAddress }),
            });
            
            if (response.ok) {
                const apiData = await response.json();
                console.log('Received raw property data:', apiData);
                
                // Define property structure interfaces
                interface ApiProperty {
                    id?: number;
                    parcl_property_id?: number;
                    address?: string;
                    city?: string;
                    state_abbreviation?: string;
                    state?: string;
                    zip_code?: string;
                    zipCode?: string;
                    price?: number;
                    list_price?: number;
                    sale_price?: number;
                    square_footage?: number;
                    squareFootage?: number;
                    bedrooms?: number;
                    bathrooms?: number;
                    year_built?: number;
                    yearBuilt?: number;
                    distance?: number;
                    status?: string;
                    soldDate?: string;
                    sale_date?: string;
                    latitude?: number;
                    longitude?: number;
                    similarityScore?: number;
                    property_type?: string;
                    [key: string]: any;
                }
                
                interface PropertyData {
                    address: {
                        street1: string;
                        street2: string;
                        city: string;
                        state: string;
                        zip: string;
                        formattedAddress: string;
                        lat: number;
                        lng: number;
                    };
                    addressData: any;
                    neighborhoodProperties: Array<{
                        id: number | string;
                        address: string;
                        city: string;
                        state: string;
                        zipCode: string;
                        price: number;
                        squareFootage: number;
                        bedrooms: number;
                        bathrooms: number;
                        yearBuilt: number;
                        distance: number;
                        status: string;
                        soldDate: string;
                        latitude: number;
                        longitude: number;
                        similarityScore?: number;
                    }>;
                    radiusUsed: number;
                    monthsUsed: number;
                }
                
                // Create a properly structured data object for our Redux store
                const propertyData: PropertyData = {
                    address: {
                        street1: selectedAddress.street1,
                        street2: selectedAddress.street2,
                        city: selectedAddress.city,
                        state: selectedAddress.state,
                        zip: selectedAddress.zip,
                        formattedAddress: selectedAddress.formattedAddress,
                        lat: selectedAddress.lat,
                        lng: selectedAddress.lng,
                    },
                    addressData: {
                        items: Array.isArray(apiData.targetProperty) 
                            ? apiData.targetProperty 
                            : apiData.targetProperty ? [apiData.targetProperty] : []
                    },
                    neighborhoodProperties: [],
                    radiusUsed: apiData.radiusUsed || 0.5,
                    monthsUsed: apiData.monthsUsed || 3
                };
                
                // Map the properties from the API response to neighborhoodProperties
                if (apiData.properties && Array.isArray(apiData.properties) && apiData.properties.length > 0) {
                    // The API returned properties - map them directly
                    propertyData.neighborhoodProperties = apiData.properties.map((prop: ApiProperty) => {
                        // Ensure each property has required fields with the correct naming
                        return {
                            id: prop.id || prop.parcl_property_id || Math.random(),
                            address: prop.address || 'Unknown Address',
                            city: prop.city || selectedAddress.city,
                            state: prop.state_abbreviation || prop.state || selectedAddress.state,
                            zipCode: prop.zip_code || prop.zipCode || selectedAddress.zip,
                            price: prop.price || prop.list_price || prop.sale_price || 0,
                            squareFootage: prop.square_footage || prop.squareFootage || 0,
                            bedrooms: prop.bedrooms || 0,
                            bathrooms: prop.bathrooms || 0,
                            yearBuilt: prop.year_built || prop.yearBuilt || 0,
                            distance: prop.distance || 0,
                            status: prop.status || 'Unknown',
                            soldDate: prop.soldDate || prop.sale_date || '',
                            latitude: prop.latitude || 0,
                            longitude: prop.longitude || 0,
                            similarityScore: prop.similarityScore || 0
                        };
                    });
                } else if (apiData.comparableProperties && Array.isArray(apiData.comparableProperties) && apiData.comparableProperties.length > 0) {
                    // Log the first comparable property to see its structure
                    console.log('Sample comparable property:', apiData.comparableProperties[0]);
                    
                    // The API returned comparable properties - map them
                    propertyData.neighborhoodProperties = apiData.comparableProperties.map((prop: ApiProperty) => {
                        console.log('Mapping property:', prop);
                        
                        // Check for price data from different sources
                        const price = prop.price || 
                                    (prop.eventDetails && prop.eventDetails.price) || 
                                    prop.list_price || 
                                    prop.sale_price || 
                                    0;
                        
                        // Check for status value
                        let listingStatus = prop.eventDetails.event_name || 'Unknown';

                        
                        console.log('Extracted price:', price, 'status:', listingStatus );
                        
                        // Format and return the property
                        return {
                            id: prop.id || prop.parcl_property_id || Math.random(),
                            address: prop.address || 'Unknown Address',
                            city: prop.city || selectedAddress.city,
                            state: prop.state_abbreviation || prop.state || selectedAddress.state,
                            zipCode: prop.zip_code || prop.zipCode || selectedAddress.zip,
                            price: price,
                            squareFootage: prop.square_footage || prop.squareFootage || 0,
                            bedrooms: prop.bedrooms || 0,
                            bathrooms: prop.bathrooms || 0,
                            yearBuilt: prop.year_built || prop.yearBuilt || 0,
                            distance: prop.distance || 0,
                            status: listingStatus,
                            soldDate: prop.eventDetails.event_date || '',
                            latitude: prop.latitude || 0,
                            longitude: prop.longitude || 0,
                            similarityScore: prop.similarityScore || 0
                        };
                    });
                } else {
                    console.log('No properties found in API response');
                    // Don't generate sample data, just leave as empty array
                    propertyData.neighborhoodProperties = [];
                }
                
                // Store the complete data in Redux
                dispatch(addProperty(propertyData));

                // Check if the property is a single-family home
                const targetProperty = propertyData.addressData?.items?.[0];
                const propType = targetProperty?.property_type || '';
                setPropertyType(propType);
                
                // Consider only single-family, one-family, or similar types as valid
                const isSingleFamily = 
                    propType.toLowerCase().includes('single') || 
                    propType.toLowerCase().includes('one family') ||
                    propType.toLowerCase().includes('residential') ||
                    propType.toLowerCase() === 'sfr';
                
                setIsSingleFamilyHome(isSingleFamily);
                
                console.log('Property data loaded successfully');
                
                // Important: Don't trigger any step changes here!
                // Let the user control navigation
            } else {
                console.error(`Failed to fetch property data: ${response.status} ${response.statusText}`);
                
                // Create a minimal property structure for steps to continue working
                const fallbackProperty = {
                    address: {
                        street1: selectedAddress.street1 || '',
                        street2: selectedAddress.street2 || '',
                        city: selectedAddress.city || '',
                        state: selectedAddress.state || '',
                        zip: selectedAddress.zip || '',
                        formattedAddress: selectedAddress.formattedAddress || '',
                        lat: selectedAddress.lat || 0,
                        lng: selectedAddress.lng || 0,
                    },
                    addressData: { items: [] },
                    neighborhoodProperties: [],
                    radiusUsed: 0.5,
                    monthsUsed: 3,
                    errorStatus: response.status,
                    errorMessage: `API error: ${response.status} ${response.statusText}`
                };
                
                // Store the fallback data in Redux so other components can detect and handle the error
                dispatch(addProperty(fallbackProperty));
                dispatch(setError(`Failed to fetch property data: ${response.status} ${response.statusText}`));
            }
        } catch (error: any) {
            console.error('Error fetching property data:', error);
            
            // Create an error fallback property
            const errorProperty = {
                address: {
                    street1: selectedAddress.street1 || '',
                    street2: selectedAddress.street2 || '',
                    city: selectedAddress.city || '',
                    state: selectedAddress.state || '',
                    zip: selectedAddress.zip || '',
                    formattedAddress: selectedAddress.formattedAddress || '',
                    lat: selectedAddress.lat || 0,
                    lng: selectedAddress.lng || 0,
                },
                addressData: { items: [] },
                neighborhoodProperties: [],
                radiusUsed: 0.5,
                monthsUsed: 3,
                errorStatus: 'exception',
                errorMessage: `Exception: ${error}`
            };
            
            // Store the error property in Redux
            dispatch(addProperty(errorProperty));
            dispatch(setError(`Error fetching property data: ${error}`));
        } finally {
            setIsPropertyDataLoading(false);
            setPropertyDataLoaded(true);
            console.log("Property data loading complete, current step:", step);
        }
    };

    // Reset loading state when property data finishes loading
    useEffect(() => {
        // If property data loaded but minimum loading time isn't complete
        if (!isPropertyDataLoading && loadingStartTime !== null) {
            const elapsedTime = Date.now() - loadingStartTime;
            
            // If we haven't reached the minimum time yet
            if (elapsedTime < 3000 && showMinimumLoading) {
                console.log(`Property data loaded in ${elapsedTime}ms, but keeping loading screen for full 3s`);
                
                // Keep loading screen for the remaining time
                const remainingTime = 3000 - elapsedTime;
                setTimeout(() => {
                    setShowMinimumLoading(false);
                    setLoadingStartTime(null);
                    console.log('Minimum loading time completed after data load');
                }, remainingTime);
            } else if (elapsedTime >= 3000 && showMinimumLoading) {
                // We've exceeded the minimum time, can hide loading
                setShowMinimumLoading(false);
                setLoadingStartTime(null);
            }
        }
    }, [isPropertyDataLoading, loadingStartTime, showMinimumLoading]);
    
    // Reset loading state when step changes (especially back to previous steps)
    useEffect(() => {
        // If we navigate away from step 3, reset loading states
        if (step !== 3) {
            if (showMinimumLoading) {
                setShowMinimumLoading(false);
                setLoadingStartTime(null);
            }
        }
    }, [step, showMinimumLoading]);

    // Step 1 -> Step 2: After selecting the address
    const handleSelectCondition = async () => {
        if (selectedAddress) {
            // Save the selected address and condition to Redux
            dispatch(setAddressData({
                street1: selectedAddress.street1 || '',
                street2: selectedAddress.street2 || '',
                city: selectedAddress.city || '',
                state: selectedAddress.state || '',
                zip: selectedAddress.zip || '',
                formattedAddress: selectedAddress.formattedAddress || '',
                lat: selectedAddress.lat || 0,
                lng: selectedAddress.lng || 0,
            }));

            updateStep(2);

            // Fetch property data when user clicks "Get My Offer"
            await fetchPropertyData();

            setTimeout(() => {
                window.scrollTo(0, 0);
                step2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    };

    // Step 2 -> Step 3: User clicks "Get My Offer"
    const handleGetMyOffer = async () => {
        if (!selectedCondition) {
            console.log('No condition selected, cannot proceed');
            return; // Don't proceed if no condition is selected
        }
        
        console.log('Get My Offer button clicked, condition:', selectedCondition);
        
        // Show loading state
        setIsButtonLoading(true);
        
        // Start minimum loading timer (3 seconds)
        setShowMinimumLoading(true);
        setLoadingStartTime(Date.now());
        
        try {
            // We'll handle saving condition data in EstimatedOfferStep instead
            // This ensures that underwrite values are only loaded when condition is actually used
            
            console.log('About to update step from', step, 'to 3');
            
            // Force the navigation to step 3
            setIsTransitioning(true);
            
            // First update the URL parameter
            setSearchParams({ step: '3' }, { replace: true });
            
            // Then update the step state
            setStep(3);
            
            console.log('Step updated to 3');
            
            // If we have property data, pre-fetch rental values for the underwrite sliders
            if (propertyState.properties.length > 0) {
                const property = propertyState.properties[0];
                const rentalProperties = property.neighborhoodProperties?.filter(p => 
                    p.status === 'LISTED_RENT'// || 
                    //p.status === 'LISTING_REMOVED'
                );
                
                // Get address data for market calculations
                const addressData = property.addressData?.items?.[0] || null;
                
                if (addressData) {
                    console.log('Pre-fetching with address data:', {
                        state: addressData.state_abbreviation || '',
                        county: addressData.county || ''
                    });
                }
                
                console.log(`Pre-fetching rental values using ${rentalProperties?.length || 0} rental properties`);
                
                // This won't block the UI as the EstimatedOfferStep will handle loading state
            }
            
            // Calculate remaining loading time to ensure at least 3 seconds of loading
            const remainingLoadTime = Math.max(0, 3000 - (Date.now() - (loadingStartTime || Date.now())));
            console.log(`Ensuring minimum loading time of 3s, remaining: ${remainingLoadTime}ms`);
            
            // Give some time for the step change to take effect, ensuring at least 3 seconds of loading
            setTimeout(() => {
                console.log('Minimum loading time complete, scrolling to step 3');
                window.scrollTo(0, 0);
                if (step3Ref.current) {
                    step3Ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                // Reset transition flag
                setIsTransitioning(false);
                
                // Keep showing loading for 3 seconds minimum
                const elapsedTime = Date.now() - (loadingStartTime || Date.now());
                if (elapsedTime >= 3000) {
                    setShowMinimumLoading(false);
                } else {
                    const remainingTime = 3000 - elapsedTime;
                    setTimeout(() => {
                        setShowMinimumLoading(false);
                        console.log('Minimum loading time completed');
                    }, remainingTime);
                }
            }, Math.max(100, remainingLoadTime));
        } catch (err) {
            console.error('Error submitting condition:', err);
            setIsTransitioning(false); // Make sure to reset the flag in case of error
            setShowMinimumLoading(false);
        } finally {
            console.log('Finished processing Get My Offer, turning off button loading');
            setIsButtonLoading(false);
        }
    };

    // Handle going back to Step 1 from any step
    const handleGetAnotherEstimate = () => {
        // Clear address, condition, and property data
        setSelectedAddress(null);
        setAddressInput('');
        setSelectedCondition('');
        dispatch(clearPropertyData());
        setPropertyDataLoaded(false);
        
        // Navigate to step 1
        updateStep(1);
        setTimeout(() => {
            window.scrollTo(0, 0);
            step1Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    // Step 3 -> Step 4: Continue to Executive Services
    const handleContinueToNeighborhoodAnalysis = () => {
        updateStep(4);
        setTimeout(() => {
            window.scrollTo(0, 0);
            step4Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    // Step 4 -> Step 5: Continue to Verify
    const handleContinueToVerify = () => {
        updateStep(5);
        setTimeout(() => {
            window.scrollTo(0, 0);
            step5Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    // Handle final submission
    const handleSubmit = () => {
        alert("Thank you for submitting your property! Our team will contact you soon.");
        navigate("/dashboard");
    };

    // Open the callback modal
    const handleOpenCallbackModal = () => {
        setIsCallbackModalOpen(true);
    };

    // Navigation handlers for moving back between steps
    const handleBackToStep1 = () => {
        // Clear condition selection when going back to step 1
        setSelectedCondition('');
        updateStep(1);
        setTimeout(() => {
            window.scrollTo(0, 0);
            step1Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const handleBackToStep2 = () => {
        updateStep(2);
        setTimeout(() => {
            window.scrollTo(0, 0);
            step2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const handleBackToStep3 = () => {
        updateStep(3);
        setTimeout(() => {
            window.scrollTo(0, 0);
            step3Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const handleBackToStep4 = () => {
        updateStep(4);
        setTimeout(() => {
            window.scrollTo(0, 0);
            step4Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    // Create a function to handle address selection that also resets relevant state
    const handleAddressSelect = (address: AddressComponents) => {
        // If this is a new address, clear condition and property data
        if (!selectedAddress || selectedAddress.formattedAddress !== address.formattedAddress) {
            console.log('New address selected, clearing previous data');
            setSelectedCondition('');
            dispatch(clearPropertyData()); // Clear the property data in Redux
            setPropertyDataLoaded(false);
            
            // If user was on a step beyond address selection, go back to step 1
            if (step > 1) {
                setIsTransitioning(true);
                setStep(1);
                setSearchParams({ step: '1' }, { replace: true });
                setTimeout(() => {
                    setIsTransitioning(false);
                }, 100);
            }
        }
        
        // Set the new address
        setSelectedAddress(address);
    };

    // Render each step component
    const renderStep1 = () => (
        <AddressInputStep
            addressInput={addressInput}
            onAddressChange={setAddressInput}
            onAddressSelect={handleAddressSelect}
            onNext={handleSelectCondition}
        />
    );

    const renderStep2 = () => {
        // Only show loading when the button is clicked, not for background property data loading
        const isLoading = isButtonLoading;
        const loadingText = isButtonLoading ? "Processing..." : undefined;
        
        return (
            <ConditionStep
                selectedCondition={selectedCondition}
                onConditionSelect={setSelectedCondition}
                onBack={handleBackToStep1}
                onNext={handleGetMyOffer}
                isLoading={isLoading}
                loadingText={loadingText}
            />
        );
    };

    const renderStep3 = () => {
        // Check if we have property data
        const hasPropertyData = propertyState.properties.length > 0;
        const propertyData = propertyState.properties[0] || null;
        
        // Check for API errors
        const hasApiError = propertyData?.errorStatus !== undefined;
        
        if (!hasPropertyData || hasApiError) {
            const errorTitle = hasApiError 
                ? `API Error: ${propertyData.errorStatus}` 
                : 'No Property Data Available';
                
            const errorMessage = hasApiError
                ? propertyData.errorMessage || 'Failed to fetch property data from API'
                : 'We couldn\'t retrieve data for this property.';
                
            return (
                <Box 
                    p={6} 
                    borderRadius="md" 
                    bg={bgColor}
                    borderWidth="1px" 
                    borderColor={borderColor}
                    boxShadow="md"
                    width="100%"
                >
                    <VStack spacing={6} align="stretch">
                        <Alert
                            status="warning"
                            variant="solid"
                            flexDirection="column"
                            alignItems="center"
                            justifyContent="center"
                            textAlign="center"
                            borderRadius="md"
                            py={6}
                        >
                            <AlertIcon boxSize="40px" mr={0} />
                            <AlertTitle mt={4} mb={2} fontSize="xl">
                                {errorTitle}
                            </AlertTitle>
                            <AlertDescription maxWidth="md">
                                {errorMessage}
                            </AlertDescription>
                        </Alert>
                        
                        <Box>
                            <Text mb={4} fontSize="md" color={textPrimaryColor}>
                                There is an issue with the property data service. Please try again later or select a different property.
                            </Text>
                            <Button
                                leftIcon={<Icon as={FaArrowLeft as React.ElementType} />}
                                colorScheme="brand"
                                onClick={handleBackToStep2}
                                size="lg"
                                width="full"
                            >
                                Go Back
                            </Button>
                        </Box>
                    </VStack>
                </Box>
            );
        }
        
        if (isSingleFamilyHome) {
            return (
                <EstimatedOfferStep
                    selectedAddress={selectedAddress}
                    googleApiKey={googleApiKey}
                    addressState={{
                        ...addressState,
                        condition: selectedCondition
                    }}
                    handleOpenCallbackModal={handleOpenCallbackModal}
                    handleBackToStep2={handleBackToStep2}
                    onNext={handleContinueToNeighborhoodAnalysis}
                />
            );
        } else {
            return (
                <Box 
                    p={6} 
                    borderRadius="md" 
                    bg={bgColor}
                    borderWidth="1px" 
                    borderColor={borderColor}
                    boxShadow="md"
                    width="100%"
                >
                    <VStack spacing={6} align="stretch">
                        <Alert
                            status="warning"
                            variant="solid"
                            flexDirection="column"
                            alignItems="center"
                            justifyContent="center"
                            textAlign="center"
                            borderRadius="md"
                            py={6}
                        >
                            <AlertIcon boxSize="40px" mr={0} />
                            <AlertTitle mt={4} mb={2} fontSize="xl">
                                Property Type Not Supported
                            </AlertTitle>
                            <AlertDescription maxWidth="md">
                                We currently only support single-family homes for our estimates.
                                {propertyType && (
                                    <Text mt={2} fontWeight="bold">
                                        The selected property is a {propertyType.toLowerCase()}.
                                    </Text>
                                )}
                            </AlertDescription>
                        </Alert>
                        
                        <Box>
                            <Text mb={4} fontSize="md" color={textPrimaryColor}>
                                Please go back and select a different address for a single-family home.
                            </Text>
                            <Button
                                leftIcon={<Icon as={FaArrowLeft as React.ElementType} />}
                                colorScheme="brand"
                                onClick={handleBackToStep2}
                                size="lg"
                                width="full"
                            >
                                Go Back
                            </Button>
                        </Box>
                    </VStack>
                </Box>
            );
        }
    };

    const renderStep4 = () => (
        <ExecutiveServicesStep
            selectedAddress={selectedAddress}
            googleApiKey={googleApiKey}
            addressState={{
                ...addressState,
                condition: selectedCondition
            }}
            handleBackToEstimate={handleBackToStep3}
            onNext={handleGetAnotherEstimate}
        />
    );

    // Update the steps array to match the screenshot
    const horizontalSteps = [
        { title: 'Address', description: 'Enter your address' },
        { title: 'Condition', description: 'Describe your home' },
        { title: 'Estimate/UW', description: 'View valuation & details' },
        { title: 'Executive Service', description: 'Finalize your offer' }
    ];

    // Define colors outside of conditional rendering
    const bgColor = 'background.primary';
    const bgSecondaryColor = 'background.secondary';
    const borderColor = 'border.primary';
    const textPrimaryColor = 'text.primary';
    const textSecondaryColor = 'text.secondary';
    const boxShadow = "lg";
    const borderRadius = "lg";

    // Enhanced loading component for Step 3 transition
    const EnhancedPropertyLoading = () => (
        <Box
            p={6}
            borderRadius="md"
            bg={bgColor}
            borderWidth="1px"
            borderColor={borderColor}
            boxShadow="md"
            width="100%"
            textAlign="center"
            minHeight="400px"
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
        >
            <VStack spacing={8}>
                <Heading size="lg" color={textPrimaryColor}>
                    Generating Your Property Estimate
                </Heading>
                
                <Spinner 
                    size="xl" 
                    thickness="4px"
                    speed="0.65s"
                    color="brand.500"
                    mb={4}
                />
                
                <Box width="100%" maxWidth="500px">
                    <Text mb={2} fontWeight="bold" textAlign="left" color={textSecondaryColor}>
                        Analysis Progress
                    </Text>
                    <Progress
                        size="md"
                        isIndeterminate
                        colorScheme="brand"
                        borderRadius="md"
                        height="10px"
                        mb={6}
                    />
                </Box>
                
                <VStack spacing={4} width="100%" maxWidth="500px" align="start">
                    <HStack>
                        <Icon as={FaCheck as React.ElementType} color="green.500" />
                        <Text color={textSecondaryColor}>Analyzing property condition</Text>
                    </HStack>
                    <HStack>
                        <Icon as={FaCheck as React.ElementType} color="green.500" />
                        <Text color={textSecondaryColor}>Finding comparable properties</Text>
                    </HStack>
                    <HStack>
                        <Spinner size="sm" color="brand.500" />
                        <Text color={textSecondaryColor}>Calculating estimated value</Text>
                    </HStack>
                </VStack>
                
                <Text color={textSecondaryColor} fontStyle="italic" mt={4}>
                    This typically takes a few seconds. Please wait...
                </Text>
            </VStack>
        </Box>
    );

    return (
        <>
            <APIProvider apiKey={googleApiKey} libraries={['places']}>
                {/* Horizontal Progress Bar - visible on all screen sizes */}
                <Box 
                    w="100%" 
                    bg={bgColor}
                    borderBottomWidth="1px"
                    borderColor={borderColor}
                    position="sticky"
                    top="75px"
                    zIndex="10"
                    px={4}
                    py={3}
                    shadow="sm"
                >
                    <Box maxW="container.lg" mx="auto">
                        <Stepper index={step - 1} colorScheme="brand" size="md">
                            {horizontalSteps.map((item, index) => {
                                // Determine if this step is accessible based on data availability
                                const stepNumber = index + 1;
                                const isAccessible = 
                                    (stepNumber === 1) ||
                                    (stepNumber === 2 && selectedAddress !== null) ||
                                    (stepNumber === 3 && selectedAddress !== null && 
                                        selectedCondition !== '') ||
                                    (stepNumber === 4 && selectedAddress !== null && 
                                        selectedCondition !== '' && 
                                        step >= 4);
                                
                                // Determine if this step is completed
                                const isCompleted = stepNumber < step;
                                
                                // Disable click handling during transitions
                                const handleStepClick = () => {
                                    if (isAccessible && !isTransitioning) {
                                        updateStep(stepNumber);
                                        // Scroll to the appropriate ref
                                        setTimeout(() => {
                                            switch (stepNumber) {
                                                case 1: step1Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); break;
                                                case 2: step2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); break;
                                                case 3: step3Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); break;
                                                case 4: step4Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); break;
                                            }
                                        }, 100);
                                    }
                                };
                                
                                return (
                                    <Step key={index} cursor={isAccessible && !isTransitioning ? "pointer" : "not-allowed"} onClick={handleStepClick}>
                                        <StepIndicator>
                                            <StepStatus
                                                complete={<CheckIcon />}
                                                incomplete={<StepNumber />}
                                                active={<StepNumber />}
                                            />
                                        </StepIndicator>
                                        <Box flexShrink={0}>
                                            <StepTitle 
                                                fontSize={{ base: "xs", md: "sm" }} 
                                                fontWeight={step === stepNumber + 1 ? "bold" : "medium"}
                                                color={isAccessible ? textPrimaryColor : "gray.400"}
                                            >
                                                {item.title}
                                            </StepTitle>
                                        </Box>
                                        <StepSeparator />
                                    </Step>
                                );
                            })}
                        </Stepper>
                    </Box>
                </Box>

                <Flex minHeight="calc(100vh - 125px)">
                    {/* Main content area - scrollable */}
                    <Box 
                        flex="1" 
                        bgSize="cover"
                        bgPos="center"
                        p={{ base: 4, md: 8 }}
                        pt={{ base: 6, md: 8 }}
                        minH="calc(100vh - 125px)"
                    >
                        {/* Step 1 */}
                        <Box 
                            ref={step1Ref} 
                            w={['100%', null, '700px']} 
                            mx="auto" 
                            p={{ base: 4, md: 6 }}
                            borderRadius={borderRadius}
                            bg={bgColor}
                            boxShadow={boxShadow}
                            mt={0}
                            mb={4}
                            display={step === 1 ? 'block' : 'none'}
                        >
                            {renderStep1()}
                        </Box>
                        
                        {/* Step 2 */}
                        <Box 
                            ref={step2Ref} 
                            w={['100%', null, '900px']} 
                            mx="auto" 
                            p={{ base: 4, md: 6 }}
                            borderRadius={borderRadius}
                            bg={bgColor}
                            boxShadow={boxShadow}
                            mt={0}
                            mb={4}
                            display={step === 2 ? 'block' : 'none'}
                        >
                            {renderStep2()}
                        </Box>
                        
                        {/* Step 3 */}
                        <Box 
                            ref={step3Ref} 
                            w={['100%', null, '900px']} 
                            // w="100%"
                            mx="auto" 
                            p={{ base: 4, md: 6 }}
                            borderRadius={borderRadius}
                            bg={bgColor}
                            boxShadow={boxShadow}
                            mt={0}
                            mb={4}
                            display={step === 3 ? 'block' : 'none'}
                        >
                            {(showMinimumLoading || isPropertyDataLoading) ? (
                                <EnhancedPropertyLoading />
                            ) : (
                                renderStep3()
                            )}
                        </Box>

                        {/* Step 4 */}
                        <Box 
                            ref={step4Ref} 
                            w={['100%', null, '900px']} 
                            mx="auto" 
                            p={{ base: 4, md: 6 }}
                            borderRadius={borderRadius}
                            bg={bgColor}
                            boxShadow={boxShadow}
                            mt={0}
                            mb={4}
                            display={step === 4 ? 'block' : 'none'}
                        >
                            {renderStep4()}
                        </Box>

                    </Box>
                </Flex>
            </APIProvider>
            <SpecialistCallModal 
                isOpen={isCallbackModalOpen} 
                onClose={() => setIsCallbackModalOpen(false)} 
            />
        </>
    );
};

export default EstimatePage;
