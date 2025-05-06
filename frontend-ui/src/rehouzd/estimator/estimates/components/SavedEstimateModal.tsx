import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Box,
  VStack,
  HStack,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Textarea,
  useToast,
  Flex,
  Heading,
  Badge,
  Divider,
  Image,
  SimpleGrid,
  Icon,
} from '@chakra-ui/react';
import { FaHome, FaBed, FaBath, FaRulerCombined, FaCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa';
import RentUnderwriteSliders from './RentUnderwriteSliders';
import FlipUnderwriteSliders from './FlipUnderwriteSliders';
import { useAppSelector } from '../../store/hooks';
import { EstimatedOfferRange } from './EstimatedOfferRange';

interface SavedEstimateModalProps {
  isOpen: boolean;
  onClose: () => void;
  estimate: any;
  onUpdate: (updatedEstimate: any) => Promise<void>;
}

const SavedEstimateModal: React.FC<SavedEstimateModalProps> = ({
  isOpen,
  onClose,
  estimate,
  onUpdate,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState<string>('rent');
  const [rentUnderwriteValues, setRentUnderwriteValues] = useState({
    rent: 1000,
    expense: 35,
    capRate: 6.5,
    lowRehab: 30,
    highRehab: 40,
  });
  const [flipUnderwriteValues, setFlipUnderwriteValues] = useState({
    sellingCosts: 7,
    holdingCosts: 4,
    margin: 20,
    lowRehab: 30,
    highRehab: 40,
  });
  
  // Add refs to track internal updates vs external updates
  const isInternalRentUpdate = useRef(false);
  const isInternalFlipUpdate = useRef(false);
  
  const toast = useToast();
  const user = useAppSelector(state => state.user);

  // Extract property details from estimate
  const propertyAddress = estimate?.property_address || '';
  const estimateData = estimate?.estimate_data || {};
  const property = estimateData?.property || {};
  const addressData = property?.addressData?.items?.[0] || {};
  const offerRangeLow = estimateData?.offer_range_low || 0;
  const offerRangeHigh = estimateData?.offer_range_high || 0;
  const googleApiKey = (window as any).env?.REACT_APP_Maps_API_KEY || process.env.REACT_APP_Maps_API_KEY || '';

  // Function to generate Street View image URL
  const getStreetViewImageUrl = () => {
    if (!propertyAddress) return '';
    const encodedAddress = encodeURIComponent(propertyAddress);
    const size = '400x200';
    const fov = 90;
    const heading = 235;
    const pitch = 10;
    return `https://maps.googleapis.com/maps/api/streetview?size=${size}&location=${encodedAddress}&fov=${fov}&heading=${heading}&pitch=${pitch}&key=${googleApiKey}`;
  };

  // Function to format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Initializing the modal with data from the estimate
  useEffect(() => {
    if (estimate && estimate.estimate_data) {
      setNotes(estimate.estimate_data.notes || '');
      setActiveTab(estimate.estimate_data.active_investment_strategy || 'rent');
      
      // Only update if not from internal changes
      if (estimate.estimate_data.rent_underwrite_values && !isInternalRentUpdate.current) {
        setRentUnderwriteValues(estimate.estimate_data.rent_underwrite_values);
      }
      
      if (estimate.estimate_data.flip_underwrite_values && !isInternalFlipUpdate.current) {
        setFlipUnderwriteValues(estimate.estimate_data.flip_underwrite_values);
      }
      
      // Reset flags
      isInternalRentUpdate.current = false;
      isInternalFlipUpdate.current = false;
    }
  }, [estimate]);

  // Handle tab change
  const handleTabChange = (index: number) => {
    const newActiveTab = index === 0 ? 'rent' : 'flip';
    setActiveTab(newActiveTab);
  };

  // Handle rent underwrite values change
  const handleRentValuesChange = (values: any) => {
    isInternalRentUpdate.current = true;
    setRentUnderwriteValues(values);
  };

  // Handle flip underwrite values change
  const handleFlipValuesChange = (values: any) => {
    isInternalFlipUpdate.current = true;
    setFlipUnderwriteValues(values);
  };

  // Function to update the estimate
  const updateEstimate = async () => {
    setIsLoading(true);
    
    try {
      if (!estimate) return;
      
      // Reset update flags before making the API call
      isInternalRentUpdate.current = false;
      isInternalFlipUpdate.current = false;
      
      // Get token for auth
      const token = user?.token || null;
      const estimateId = estimate.id;
      
      // Build the update data
      const updateData = {
        notes,
        active_investment_strategy: activeTab,
        rent_underwrite_values: rentUnderwriteValues,
        flip_underwrite_values: flipUnderwriteValues,
      };
      
      // Only update if we have a token
      // if (token) {
      // if (true) {
      //   const apiEndpoint = `/api/saved-estimates/${estimateId}`;
      //   const response = await fetch(apiEndpoint, {
      //     method: 'PUT',
      //     headers: {
      //       'Content-Type': 'application/json',
      //       Authorization: `Bearer ${token}`,
      //     },
      //     body: JSON.stringify({
      //       estimate_data: updateData
      //     }),
      //   });
        
      //   if (response.ok) {
      //     const data = await response.json();
      //     toast({
      //       title: 'Estimate updated',
      //       status: 'success',
      //       duration: 3000,
      //       isClosable: true,
      //     });

      //     setTimeout(() => {
      //       onClose();
      //     }, 2000);
          
          // Call onUpdate with the updated data
          if (onUpdate) {
            onUpdate(updateData);
          }
        // } else {
        //   throw new Error('Failed to update estimate');
        // }
      // }
    } catch (error) {
      console.error('Error updating estimate:', error);
      toast({
        title: 'Error updating estimate',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Property details for display
  const propertyDetails = {
    beds: addressData.bedrooms || 'N/A',
    baths: addressData.bathrooms || 'N/A',
    sqft: addressData.square_footage || 'N/A',
    year: addressData.year_built || 'N/A',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent maxW="900px">
        <ModalHeader>
          <Flex justifyContent="flex-start" alignItems="center">
            <Text>Property Estimate Details</Text>
            <Badge colorScheme="green" fontSize="md" p={1} ml={3}>
              {new Date(estimate?.created_at).toLocaleDateString()}
            </Badge>
          </Flex>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Property Header Card */}
            <Flex direction={{ base: "column", md: "row" }} gap={4}>
              {/* Street View Image */}
              <Box borderRadius="md" overflow="hidden" boxShadow="md" width={{ base: "100%", md: "40%" }}>
                <Image
                  src={getStreetViewImageUrl()}
                  alt={`Street View of ${propertyAddress}`}
                  width="100%"
                  height="200px"
                  objectFit="cover"
                  borderRadius="md"
                />
              </Box>

              {/* Property Details */}
              <Box width={{ base: "100%", md: "60%" }}>
                <Heading as="h3" size="md" color="brand.500" mb={5} fontWeight="bold">
                  <HStack>
                    <Icon as={FaMapMarkerAlt as React.ElementType} />
                    <Text>{propertyAddress}</Text>
                  </HStack>
                </Heading>

                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={3}>
                  <Box bg="gray.50" p={9} borderRadius="lg" textAlign="center">
                    <HStack justifyContent="center">
                      <Icon as={FaBed as React.ElementType} color="brand.500" />
                      <Text fontSize="xl" fontWeight="bold" color="brand.500">{propertyDetails.beds}</Text>
                    </HStack>
                    <Text fontSize="sm" color="gray.500">BEDS</Text>
                  </Box>
                  <Box bg="gray.50" p={8} borderRadius="lg" textAlign="center">
                    <HStack justifyContent="center">
                      <Icon as={FaBath as React.ElementType} color="brand.500" />
                      <Text fontSize="xl" fontWeight="bold" color="brand.500">{propertyDetails.baths}</Text>
                    </HStack>
                    <Text fontSize="sm" color="gray.500">BATHS</Text>
                  </Box>
                  <Box bg="gray.50" p={9} borderRadius="lg" textAlign="center">
                    <HStack justifyContent="center">
                      <Icon as={FaRulerCombined as React.ElementType} color="brand.500" />
                      <Text fontSize="xl" fontWeight="bold" color="brand.500">{propertyDetails.sqft}</Text>
                    </HStack>
                    <Text fontSize="sm" color="gray.500">SQFT</Text>
                  </Box>
                  <Box bg="gray.50" p={9} borderRadius="lg" textAlign="center">
                    <HStack justifyContent="center">
                      <Icon as={FaCalendarAlt as React.ElementType} color="brand.500" />
                      <Text fontSize="xl" fontWeight="bold" color="brand.500">{propertyDetails.year}</Text>
                    </HStack>
                    <Text fontSize="sm" color="gray.500">YEAR</Text>
                  </Box>
                </SimpleGrid>
              </Box>
            </Flex>

            {/* Offer Range Box */}
            <EstimatedOfferRange 
              strategy={activeTab}
            />


            <Divider />

            {/* Investment Strategy Tabs */}
            <Heading color={"text.primary"} as="h3" size="md" mb={-5}>Underwrite</Heading>
            <Tabs 
              variant="enclosed" 
              align='end'
              colorScheme="green" 
              index={activeTab === 'rent' ? 0 : 1}
              onChange={handleTabChange}
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
              <TabPanels>
                <TabPanel>
                  <RentUnderwriteSliders 
                    initialValues={rentUnderwriteValues} 
                    onValuesChanged={handleRentValuesChange} 
                  />
                </TabPanel>
                <TabPanel>
                  <FlipUnderwriteSliders 
                    initialValues={flipUnderwriteValues} 
                    onValuesChanged={handleFlipValuesChange}
                  />
                </TabPanel>
              </TabPanels>
            </Tabs>

            <Divider />

            {/* Notes Area */}
            <Box>
              <Text mb={2} fontWeight="semibold">Notes</Text>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this property estimate..."
                rows={4}
                resize="vertical"
              />
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="outline" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button 
            colorScheme="brand" 
            onClick={updateEstimate}
            isLoading={isLoading}
            
          >
            Update Estimate
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SavedEstimateModal; 