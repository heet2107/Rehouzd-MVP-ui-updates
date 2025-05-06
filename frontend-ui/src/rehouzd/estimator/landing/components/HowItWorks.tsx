import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Stack,
  Flex,
  Button,
  Icon,
  Center,
  IconButton,
} from '@chakra-ui/react';
import { FaPlay } from 'react-icons/fa';

const HowItWorks = () => {

  return (
    <Box color="white">
      <Container maxW="container.xl" centerContent>
        <Stack spacing={10} align="center">
          {/* Heading Section */}
          <Stack spacing={4} textAlign="center" maxW="container.md">
            <Heading
              as="h2"
              fontSize={{ base: '2xl', md: '3xl', lg: '4xl' }}
              fontWeight="bold"
              fontFamily="heading"
            >
              How It Works
            </Heading>
            <Text 
              fontFamily="body"
              maxW="container.sm"
              mx="auto"
              fontWeight="bold"
              fontSize="md"
            >
              Our platform reveals investor purchase price ranges, accelerates underwriting,
              and connects you with the most qualified buyers for your deal
            </Text>
          </Stack>
          
          {/* Video Demo */}
          <Box 
            position="relative" 
            w="full" 
            maxW="container.lg"
            height={{ base: '200px', md: '350px', lg: '400px' }}
            borderRadius="lg"
            overflow="hidden"
            boxShadow="lg"
            bg="white"
          >
            {/* Play button overlay */}
            <Center 
              position="absolute"
              top="0"
              left="0"
              right="0"
              bottom="0"
              zIndex="1"
            >
              <IconButton
                aria-label="Play video"
                icon={<Icon as={FaPlay as React.ElementType} color="white" boxSize={6} />}
                size="lg"
                borderRadius="full"
                width="72px"
                height="72px"
                bg="rgba(0,0,0,0.5)"
                _hover={{ bg: "rgba(0,0,0,0.7)" }}
              />
            </Center>
            
            {/* Video info overlay - top left */}
            <Box 
              position="absolute"
              top="20px"
              left="20px"
              bg="rgba(0,0,0,0.6)"
              px={3}
              py={1}
              borderRadius="md"
              zIndex="1"
            >
              <Flex align="center">
                <Icon as={FaPlay as React.ElementType} color="white" mr={2} />
                <Text color="white" fontSize="sm" fontWeight="medium" fontFamily="body">Rehouzd - Instant Investor Pricing & Offer Speed</Text>
              </Flex>
            </Box>
            
            {/* Video info overlay - bottom left */}
            <Box 
              position="absolute"
              bottom="20px"
              left="20px"
              bg="rgba(0,0,0,0.6)"
              px={3}
              py={1}
              borderRadius="md"
              zIndex="1"
            >
              <Text color="white" fontSize="sm" fontWeight="medium" fontFamily="body">2 min</Text>
            </Box>
            
            {/* Placeholder for video demo */}
            <Box 
              position="absolute"
              top="0"
              left="0"
              right="0"
              bottom="0"
              bg="#0a3c34"
              opacity="0.85"
            />
          </Box>
        </Stack>
      </Container>
    </Box>
  );
};

export default HowItWorks; 
