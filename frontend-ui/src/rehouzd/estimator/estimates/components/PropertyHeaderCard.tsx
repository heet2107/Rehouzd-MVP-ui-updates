import React from 'react';
import {
    Box,
    Flex,
    Heading,
    Text,
    Image,
    Icon,
    HStack,
} from '@chakra-ui/react';
import { FaHome, FaDollarSign } from 'react-icons/fa';
import { AddressComponents } from '../../address/components/PlaceAutocompleteInput';

// Helper function to get Google Street View image URL
export function AddressImageUrl(address: AddressComponents | null, apiKey: string) {
    if (!address) return '';
    const encodedAddress = encodeURIComponent(address.formattedAddress);
    const size = '600x300';
    const fov = 90;
    const heading = 235;
    const pitch = 10;
    return `https://maps.googleapis.com/maps/api/streetview?size=${size}&location=${encodedAddress}&fov=${fov}&heading=${heading}&pitch=${pitch}&key=${apiKey}`;
}

interface PropertyHeaderCardProps {
    selectedAddress: AddressComponents | null;
    googleApiKey: string;
    propertyDetails: {
        beds: string | number;
        baths: string | number;
        sqft: string | number;
        year: string | number;
    };
    homesSoldCount: number;
    interestedBuyersCount: number;
}

const PropertyHeaderCard: React.FC<PropertyHeaderCardProps> = ({
    selectedAddress,
    googleApiKey,
    propertyDetails,
    homesSoldCount,
    interestedBuyersCount,
}) => {
    const { beds, baths, sqft, year } = propertyDetails;
    
    return (
        <Flex 
            direction={{ base: "column", md: "row" }} 
            gap={4}
            mb={4}
        >
            {/* Street View Image Box */}
            <Box 
                borderRadius="md" 
                overflow="hidden" 
                boxShadow="md"
                width={{ base: "50%", md: "40%" }}
            >
                <Image
                    src={AddressImageUrl(selectedAddress, googleApiKey)}
                    alt={`Street View of ${selectedAddress?.formattedAddress}`}
                    width="100%"
                    height="100%"
                    objectFit="cover"
                    borderRadius="md"
                />
            </Box>

            {/* Property Details Box */}
            <Box 
                width={{ base: "50%", md: "60%" }}
            >
                <Heading 
                    as="h2" 
                    size="md" 
                    color="brand.500" 
                    mb={3}
                    fontWeight="bold"
                >
                    {selectedAddress?.formattedAddress}
                </Heading>

                <Flex 
                    wrap="wrap" 
                    justifyContent="space-between" 
                    mb={4}
                >
                    <Box 
                        bg="gray.50" 
                        p={3} 
                        borderRadius="lg" 
                        textAlign="center"
                        width={{ base: "45%", sm: "22%", md: "22%" }}
                        mb={{ base: 4, sm: 0 }}
                    >
                        <Text fontSize="2xl" fontWeight="bold" color="brand.500">{beds}</Text>
                        <Text fontSize="sm" color="gray.500">BEDS</Text>
                    </Box>
                    <Box 
                        bg="gray.50" 
                        p={3} 
                        borderRadius="lg" 
                        textAlign="center"
                        width={{ base: "45%", sm: "22%", md: "22%" }}
                        mb={{ base: 4, sm: 0 }}
                    >
                        <Text fontSize="2xl" fontWeight="bold" color="brand.500">{baths}</Text>
                        <Text fontSize="sm" color="gray.500">BATHS</Text>
                    </Box>
                    <Box 
                        bg="gray.50" 
                        p={3} 
                        borderRadius="lg" 
                        textAlign="center"
                        width={{ base: "45%", sm: "22%", md: "22%" }}
                        mb={{ base: 4, sm: 0 }}
                    >
                        <Text fontSize="2xl" fontWeight="bold" color="brand.500">{sqft}</Text>
                        <Text fontSize="sm" color="gray.500">SQFT</Text>
                    </Box>
                    <Box 
                        bg="gray.50" 
                        p={3} 
                        borderRadius="lg" 
                        textAlign="center"
                        width={{ base: "45%", sm: "22%", md: "22%" }}
                    >
                        <Text fontSize="2xl" fontWeight="bold" color="brand.500">{year}</Text>
                        <Text fontSize="sm" color="gray.500">YEAR</Text>
                    </Box>
                </Flex>

                <Flex 
                    direction="column" 
                    bg="gray.50" 
                    p={4} 
                    borderRadius="lg"
                >
                    <Flex justifyContent="space-between" mb={4}>
                        <Flex align="center">
                            <Icon as={FaHome as React.ElementType} color="brand.500" mr={2} />
                            <Text fontWeight="medium">Homes Sold in This Range</Text>
                        </Flex>
                        <Text fontWeight="bold" fontSize="xl" color="brand.500 ">{homesSoldCount}</Text>
                    </Flex>
                    <Flex justifyContent="space-between">
                        <Flex align="center">
                            <Icon as={FaDollarSign as React.ElementType} color="brand.500" mr={2} />
                            <Text fontWeight="medium">Interested Buyers</Text>
                        </Flex>
                        <Text fontWeight="bold" fontSize="xl" color="brand.500">{interestedBuyersCount}</Text>
                    </Flex>
                </Flex>
            </Box>
        </Flex>
    );
};

export default PropertyHeaderCard; 