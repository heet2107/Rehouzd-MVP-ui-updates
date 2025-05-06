import React from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Input,
  InputGroup,
  InputRightElement,
  InputLeftElement,
  Text,
  VStack,
  Image,
  Stack,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon } from '@chakra-ui/icons';

const Hero = () => {
  const navigate = useNavigate();


  return (
    <Box color="white">
      <Container maxW="container.xl" centerContent>
        <VStack spacing={6} textAlign="center" mb={8}>
          <Heading
            as="h1"
            fontSize={{ base: '3xl', md: '4xl', lg: '5xl' }}
            fontWeight="bold"
            lineHeight={1.2}
            fontFamily="heading"
          >
            Maximize Your Assignment Fees
          </Heading>
          <Text 
            as="h1"
            fontSize={{ base: 'lg', md: '2xl' }}
            fontWeight="bold"
            maxW="container.md"
            fontFamily="heading"
          >
            Find the Perfect Buyer, Instantly
          </Text>
          
          {/* Search box */}
          <Box w={{ base: '90%', md: '70%', lg: '60%' }} mt={6}>
            <InputGroup size="lg" bg="white" borderRadius="full">
              <InputLeftElement pointerEvents="none" h="full" pl={3}>
                <SearchIcon color="gray.400" />
              </InputLeftElement>
              <Input 
                placeholder="Enter home address" 
                bg="white" 
                color="gray.700"
                borderRadius="full"
                _placeholder={{ color: 'gray.400' }}
                height="54px"
                pl={10}
                fontSize="md"
                fontFamily="body"
                border="none"
                _focus={{ boxShadow: "none" }}
              />
              <InputRightElement width="auto" pr={1} h="full">
                <Button 
                  bg="#104911"
                  color="white"
                  borderRadius="full"
                  size="md"
                  height="44px"
                  px={6}
                  mr={1}
                  onClick={() => navigate('/estimate')}
                  fontFamily="body"
                  _hover={{ bg: "#0b3310" }}
                >
                  Find Your Buyer
                </Button>
              </InputRightElement>
            </InputGroup>
          </Box>
        </VStack>
        
        {/* Property card demo */}
        <Box 
          bg="white" 
          borderRadius="lg" 
          boxShadow="lg" 
          overflow="hidden"
          w={{ base: '90%', md: '80%', lg: '70%' }}
          mt={8}
        >
          {/* Progress bar */}
          <Flex w="100%" h="5px">
            <Box bg="#81D752" flex={0.5} />
            <Box bg="#E6E6E6" flex={2} />
            <Box bg="#E6E6E6" flex={0.5} />
            <Box bg="#E6E6E6" flex={0.5} />
            <Box bg="#E6E6E6" flex={0.5} />
          </Flex>
          
          <Box p={5}>
            {/* Property information */}
            <Stack spacing={4}>
              <Box>
                <Flex mb={4} flexWrap="wrap">
                  <Image 
                    src="/placeholder-house.jpg" 
                    alt="Property" 
                    w="150px" 
                    h="100px" 
                    objectFit="cover" 
                    borderRadius="md"
                    fallbackSrc="https://via.placeholder.com/150x100"
                  />
                  <Box ml={4} flex="1">
                    <Text fontWeight="bold" fontSize="md" fontFamily="heading" color="gray.700">3911 Watkins St, Memphis, TN 38127</Text>
                    <Flex mt={2} wrap="wrap" gap={4}>
                      <Flex direction="column" align="center" minW="40px">
                        <Text fontWeight="bold" color="gray.700" fontFamily="body">4</Text>
                        <Text fontSize="xs" color="gray.500" fontFamily="body">BEDS</Text>
                      </Flex>
                      <Flex direction="column" align="center" minW="40px">
                        <Text fontWeight="bold" color="gray.700" fontFamily="body">2.5</Text>
                        <Text fontSize="xs" color="gray.500" fontFamily="body">BATHS</Text>
                      </Flex>
                      <Flex direction="column" align="center" minW="40px">
                        <Text fontWeight="bold" color="gray.700" fontFamily="body">2,240</Text>
                        <Text fontSize="xs" color="gray.500" fontFamily="body">SQFT</Text>
                      </Flex>
                      <Flex direction="column" align="center" minW="40px">
                        <Text fontWeight="bold" color="gray.700" fontFamily="body">1984</Text>
                        <Text fontSize="xs" color="gray.500" fontFamily="body">YEAR</Text>
                      </Flex>
                    </Flex>
                  </Box>
                </Flex>
                
                {/* Interested investors */}
                <Flex mt={2} mb={4} justify="space-between">
                  <Flex align="center">
                    <Box w="3px" h="16px" bg="#104911" borderRadius="full" mr={2}></Box>
                    <Text fontWeight="medium" fontFamily="body" color="gray.700" fontSize="sm">Investors Ready To Buy</Text>
                  </Flex>
                  <Text fontWeight="bold" fontFamily="body" color="gray.700">24</Text>
                </Flex>
                <Flex mb={4} justify="space-between">
                  <Flex align="center">
                    <Box w="3px" h="16px" bg="#81D752" borderRadius="full" mr={2}></Box>
                    <Text fontWeight="medium" fontFamily="body" color="gray.700" fontSize="sm">Scheduled Tours</Text>
                  </Flex>
                  <Text fontWeight="bold" fontFamily="body" color="gray.700">6</Text>
                </Flex>
                
                {/* Actions */}
                <Flex mt={4} gap={2} justify="space-between" flexWrap="wrap">
                  <Button size="sm" variant="outline" borderRadius="md" fontFamily="body" borderColor="gray.300" color="gray.700">Speak with Analyst</Button>
                  <Button size="sm" variant="outline" borderRadius="md" fontFamily="body" borderColor="gray.300" color="gray.700">Interested Buyers Details</Button>
                  <Button size="sm" variant="outline" borderRadius="md" fontFamily="body" borderColor="gray.300" color="gray.700">Save Estimate</Button>
                  <Button size="sm" bg="#104911" color="white" borderRadius="md" fontFamily="body" _hover={{ bg: "#0b3310" }}>Try Another Address</Button>
                </Flex>
              </Box>
              
              {/* Estimated Offer Range */}
              <Box mt={4}>
                <Text fontWeight="medium" mb={2} fontFamily="body" color="gray.700">Estimated Offer Range</Text>
                <Box position="relative" h="12px" bg="#E6E6E6" borderRadius="full">
                  <Box 
                    position="absolute" 
                    left="0" 
                    top="0" 
                    h="100%" 
                    w="70%" 
                    bg="#104911" 
                    borderRadius="full" 
                  />
                </Box>
                <Flex justify="space-between" mt={1}>
                  <Text fontWeight="bold" fontFamily="body" color="gray.700">$84,000</Text>
                  <Text fontWeight="bold" fontFamily="body" color="gray.700">$95,000</Text>
                </Flex>
              </Box>
              
              {/* Underwrite section */}
              <Flex justify="space-between" mt={4} align="center">
                <Text fontWeight="bold" fontFamily="heading" color="gray.700">Underwrite</Text>
                <Flex gap={2}>
                  <Box borderRadius="md" bg="#ffe9ed" px={2} py={0.5}>
                    <Text color="#de4f62" fontWeight="medium" fontFamily="body" fontSize="sm">Rental</Text>
                  </Box>
                  <Box borderRadius="md" bg="#c1dcff" px={2} py={0.5}>
                    <Text color="#44658f" fontWeight="medium" fontFamily="body" fontSize="sm">Flip</Text>
                  </Box>
                </Flex>
              </Flex>
              
              {/* Parameters */}
              <Flex mt={4} justify="space-between" align="center" flexWrap="wrap">
                <Flex direction="column" align="center">
                  <Text fontSize="xs" color="gray.500" fontFamily="body">Rent</Text>
                  <Text fontWeight="bold" fontFamily="body" color="gray.700">$1,000</Text>
                </Flex>
                <Flex direction="column" align="center">
                  <Text fontSize="xs" color="gray.500" fontFamily="body">Expense</Text>
                  <Text fontWeight="bold" fontFamily="body" color="gray.700">35%</Text>
                </Flex>
                <Flex direction="column" align="center">
                  <Text fontSize="xs" color="gray.500" fontFamily="body">Cap Rate</Text>
                  <Text fontWeight="bold" fontFamily="body" color="gray.700">6.5%</Text>
                </Flex>
                <Flex direction="column" align="center">
                  <Text fontSize="xs" color="gray.500" fontFamily="body">Low</Text>
                  <Text fontWeight="bold" fontFamily="body" color="gray.700">30k</Text>
                </Flex>
                <Flex direction="column" align="center">
                  <Text fontSize="xs" color="gray.500" fontFamily="body">High</Text>
                  <Text fontWeight="bold" fontFamily="body" color="gray.700">40k</Text>
                </Flex>
              </Flex>
              
              {/* Repair Value */}
              <Flex justify="space-between" mt={4} align="center">
                <Text fontWeight="bold" fontFamily="heading" color="gray.700">After Repair Value</Text>
                <Text fontWeight="bold" color="#de4f62" fontFamily="body">$120,000</Text>
              </Flex>
            </Stack>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Hero; 
