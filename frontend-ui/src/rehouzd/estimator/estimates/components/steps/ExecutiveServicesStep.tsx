import React, { useState } from 'react';
import {
    Box,
    Button,
    Heading,
    Text,
    Flex,
    VStack,
    HStack,
    Input,
    Textarea,
    Icon,
    useDisclosure,
    Link,
    Divider,
} from '@chakra-ui/react';
import { FaArrowLeft } from 'react-icons/fa';
import { AiOutlineCloudUpload } from "react-icons/ai";
import { AddressComponents } from '../../../address/components/PlaceAutocompleteInput';
import PropertyHeaderCard from '../PropertyHeaderCard';
import ImageUploadModal from '../ImageUploadModal';
import BuyerMatchingModal from '../BuyerMatchingModal';
import { useAppSelector } from '../../../store/hooks';
import { EstimatedOfferRange } from '../EstimatedOfferRange';
interface ExecutiveServicesStepProps {
    selectedAddress: AddressComponents | null;
    googleApiKey: string;
    addressState: {
        lat: number;
        lng: number;
        formattedAddress: string;
        [key: string]: any;
    };
    handleBackToEstimate: () => void;
    onNext: () => void;
}

const ExecutiveServicesStep: React.FC<ExecutiveServicesStepProps> = ({
    selectedAddress,
    googleApiKey,
    addressState,
    handleBackToEstimate,
    onNext,
}) => {
    // State for the form fields
    const [yourEstimatedPrice, setYourEstimatedPrice] = useState<string>('');
    const [targetOfferPrice, setTargetOfferPrice] = useState<string>('');
    const [uploadedPhotoLinkUW, setUploadedPhotoLinkUW] = useState<string>('');
    const [uploadedPhotoLinkOffer, setUploadedPhotoLinkOffer] = useState<string>('');
    const [notesAboutPropertyUW, setNotesAboutPropertyUW] = useState<string>('');
    const [notesAboutPropertyOffer, setNotesAboutPropertyOffer] = useState<string>('');
    
    // State for the image upload modals
    const { 
        isOpen: isUploadUWModalOpen, 
        onOpen: onOpenUploadUWModal, 
        onClose: onCloseUploadUWModal 
    } = useDisclosure();
    
    const { 
        isOpen: isUploadOfferModalOpen, 
        onOpen: onOpenUploadOfferModal, 
        onClose: onCloseUploadOfferModal 
    } = useDisclosure();
    
    // State for the buyer matching modal
    const {
        isOpen: isBuyerMatchingModalOpen,
        onOpen: onOpenBuyerMatchingModal,
        onClose: onCloseBuyerMatchingModal
    } = useDisclosure();
    
    // Get property data from Redux
    const propertyState = useAppSelector((state: any) => state.property);
    const property = propertyState.properties[0] || null;

    const targetProperty = property?.addressData?.items?.[0] || null;
    
    const propertyDetails = {
        beds: targetProperty?.bedrooms ?? 'Not Found',
        baths: targetProperty?.bathrooms ?? 'Not Found',
        sqft: targetProperty?.square_footage ?? 'Not Found',
        year: targetProperty?.year_built ?? 'Not Found'
    };
    
    // Fixed values as per screenshot
    const homesSoldCount = 24;
    const interestedBuyersCount = 6;
    
    // Theme colors
    const bgPrimary = 'background.primary';
    const textPrimary = 'text.primary';
    const textSecondary = 'text.secondary';
    
    // Handle form submissions
    const handleSubmitUnderwrite = () => {
        console.log('Underwrite submitted:', { 
            yourEstimatedPrice, 
            uploadedPhotoLinkUW, 
            notesAboutPropertyUW 
        });
    };
    
    const handleSubmitGetOffers = () => {
        console.log('Get Offers submitted:', { 
            targetOfferPrice, 
            uploadedPhotoLinkOffer, 
            notesAboutPropertyOffer 
        });
    };
    
    return (
        <Box w="100%">
            {/* Heading */}
            <Box mb={4} pt={0} mt={0}>
                <Heading size="lg" color={textPrimary}>
                    Executive Services
                </Heading>
                <Text color={textSecondary} mt={1}>
                    Request specialized services for your property
                </Text>
            </Box>
            
            {/* Property details card */}
            <PropertyHeaderCard
                selectedAddress={selectedAddress}
                googleApiKey={googleApiKey}
                propertyDetails={propertyDetails}
                homesSoldCount={homesSoldCount}
                interestedBuyersCount={interestedBuyersCount}
            />
            
            {/* Estimated Offer Range */}
            {/* <EstimatedOfferRange /> */}
            
            {/* Service Requests */}
            <Box mb={6}>
                <Heading as="h2" size="lg" mb={4}>
                    Service Requests
                </Heading>
                <Text fontWeight="medium" textAlign="right" mb={4}>
                    Credits Remaining: 5
                </Text>
                
                <Flex 
                    direction={{ base: "column", md: "row" }} 
                    gap={6}
                >
                    {/* Underwrite Service */}
                    <Box 
                        flex="1"
                        bg="gray.50"
                        borderRadius="lg"
                        p={6}
                    >
                        <Text fontSize="2xl" mb={4}>
                            Underwrite
                        </Text>
                        
                        <VStack spacing={4} align="stretch">
                            <Box>
                                <Text fontFamily="body" mb={2}>Your Estimated Price</Text>
                                <Input 
                                    placeholder="Enter Your Price"
                                    value={yourEstimatedPrice}
                                    onChange={(e) => setYourEstimatedPrice(e.target.value)}
                                />
                            </Box>
                            
                            <Box>
                                <Text mb={2}>Upload Photos</Text>
                                <Box 
                                    border="1px dashed"
                                    borderColor="gray.300"
                                    borderRadius="md"
                                    p={4}
                                    textAlign="center"
                                    onClick={onOpenUploadUWModal}
                                    cursor="pointer"
                                >
                                    <Text color="gray.500">
                                        Drag & Drop photos or
                                    </Text><Text color="gray.500" as="u">
                                        click to browse
                                    </Text>
                                    <br/>
                                    <Icon as={AiOutlineCloudUpload as React.ElementType} color="brand.500" boxSize={8}/>
                                </Box>
                                
                                <Input 
                                    mt={2}
                                    placeholder="Link for photos"
                                    value={uploadedPhotoLinkUW}
                                    onChange={(e) => setUploadedPhotoLinkUW(e.target.value)}
                                />
                            </Box>
                            
                            <Box>
                                <Text mb={2}>Notes About Property</Text>
                                <Textarea 
                                    placeholder="Roof replaced 2020, HVAC needs replacement, etc."
                                    value={notesAboutPropertyUW}
                                    onChange={(e) => setNotesAboutPropertyUW(e.target.value)}
                                />
                            </Box>
                            
                            <Button 
                                onClick={handleSubmitUnderwrite}
                                colorScheme="green"
                                bg="green.800"
                                size="lg"
                                width="100%"
                                mt={2}
                                disabled={!yourEstimatedPrice || !notesAboutPropertyUW}
                            >
                                Get Underwrite
                            </Button>
                        </VStack>
                    </Box>
                    
                    {/* Get Offers Service */}
                    <Box 
                        flex="1"
                        bg="gray.50"
                        borderRadius="lg"
                        p={6}
                    >
                        <Text fontSize="2xl" mb={4}>
                            Get Offers
                        </Text>
                        
                        <VStack spacing={4} align="stretch">
                            <Box>
                                <Text mb={2}>Target Offer Price</Text>
                                <Input 
                                    placeholder="Enter Target Price"
                                    value={targetOfferPrice}
                                    onChange={(e) => setTargetOfferPrice(e.target.value)}
                                />
                            </Box>
                            
                            <Box>
                                <Text mb={2}>Upload Photos</Text>
                                <Box 
                                    border="1px dashed"
                                    borderColor="gray.300"
                                    borderRadius="md"
                                    p={4}
                                    textAlign="center"
                                    onClick={onOpenUploadOfferModal}
                                    cursor="pointer"
                                >
                                    <Text color="gray.500">
                                        Drag & Drop photos or
                                    </Text><Text color="gray.500" as="u">
                                        click to browse
                                    </Text>
                                    <br/>
                                    <Icon as={AiOutlineCloudUpload as React.ElementType} color="brand.500" boxSize={8}/>
                                </Box>
                                
                                <Input 
                                    mt={2}
                                    placeholder="Link for photos"
                                    value={uploadedPhotoLinkOffer}
                                    onChange={(e) => setUploadedPhotoLinkOffer(e.target.value)}
                                />
                            </Box>
                            
                            <Box>
                                <Text mb={2}>Notes About Property</Text>
                                <Textarea 
                                    placeholder="Roof replaced 2020, HVAC needs replacement, etc."
                                    value={notesAboutPropertyOffer}
                                    onChange={(e) => setNotesAboutPropertyOffer(e.target.value)}
                                />
                            </Box>
                            
                            <Box py={4} textAlign="center">
                                <Text fontSize="sm" color="gray.600" mb={2}>
                                    Offer sourcing service available upon approval
                                </Text>
                                <Link color="green.800" fontWeight="medium" onClick={onOpenBuyerMatchingModal} cursor="pointer">
                                    Request Access
                                </Link>
                            </Box>
                            
                            <Button 
                                onClick={handleSubmitGetOffers}
                                colorScheme="gray"
                                variant="solid"
                                size="lg"
                                width="100%"
                                mt={2}
                                disabled
                            >
                                Get Offers
                            </Button>
                        </VStack>
                    </Box>
                </Flex>
            </Box>
            
            {/* Action buttons */}
            <Box>
            <HStack w="100%" spacing={4}>
                <Button
                    onClick={handleBackToEstimate}
                    leftIcon={<Icon as={FaArrowLeft as React.ElementType} />}
                    variant="outline"
                    colorScheme="gray"
                    size="lg"
                    flex="1"
                >
                    Back
                </Button>
                
                <Button
                    onClick={onNext}
                    colorScheme="green"
                    bg="green.800"
                    size="lg"
                    flex="2"
                >
                    Get Another Estimate
                </Button>
                </HStack>
                </Box>

            
            {/* Image Upload Modals */}
            <ImageUploadModal
                isOpen={isUploadUWModalOpen}
                onClose={onCloseUploadUWModal}
                propertyAddress={selectedAddress?.formattedAddress || ''}
            />
            
            <ImageUploadModal
                isOpen={isUploadOfferModalOpen}
                onClose={onCloseUploadOfferModal}
                propertyAddress={selectedAddress?.formattedAddress || ''}
            />
            
            {/* Buyer Matching Modal */}
            <BuyerMatchingModal
                isOpen={isBuyerMatchingModalOpen}
                onClose={onCloseBuyerMatchingModal}
                addressData={selectedAddress?.formattedAddress || ''}
            />
        </Box>
    );
};

export default ExecutiveServicesStep; 