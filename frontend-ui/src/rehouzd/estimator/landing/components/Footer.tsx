import React from 'react';
import {
  Box,
  Container,
  Stack,
  Text,
  Link,
  HStack,
  Image,
  Flex,
  Icon,
  Center,
  Grid,
  GridItem,
} from '@chakra-ui/react';

const Footer = () => {  
  return (
    <Box bg="white" color="gray.600" py={8} borderTopWidth="1px" borderColor="gray.200">
      <Container maxW="container.xl">
        {/* Logo */}
        <Center mb={8}>
          <Image 
            src="/rehouzd-logo.png" 
            alt="Rehouzd Logo" 
            height="90px" 
            width="180px"
          />
        </Center>
        
        {/* Contact information */}
        <Center mb={8}>
          <HStack spacing={2} fontSize="md">
            <Text fontFamily="body">Call Us:</Text>
            <Link href="tel:310-689-8695" fontWeight="bold" color="gray.800" fontFamily="body">
              310-689-8695
            </Link>
            <Text mx={2} fontFamily="body">|</Text>
            <Text fontFamily="body">Email Us:</Text>
            <Link href="mailto:Deal@rehouzd.com" fontWeight="bold" color="gray.800" fontFamily="body">
              Deal@rehouzd.com
            </Link>
          </HStack>
        </Center>
        
        {/* License information */}
        <Box 
          bg="#104911" 
          color="white" 
          py={6} 
          px={8} 
          borderRadius="md"
          maxW="container.lg"
          mx="auto"
          position="relative"
        >
          <Grid templateColumns={{ base: "1fr", md: "1fr auto" }} gap={4}>
            <Center>
            <GridItem>
              <Text fontWeight="bold" fontSize="lg" mb={1} fontFamily="heading">SEAN KIRK</Text>
              <Text fontFamily="body" fontSize="sm" mb={1}>REHOUZD REALTY GROUP</Text>
              <Text fontFamily="body" fontSize="sm" mb={1}>TX TREC Information About Brokerage Services,</Text>
              <Text fontFamily="body" fontSize="sm" mb={1}>TREC Consumer Protection Notice</Text>
              <Text fontFamily="body" fontSize="sm" mb={1}>License: 728419</Text>
              <Text fontFamily="body" fontSize="sm">TN Curb Realty - 11205 Lebanon Rd Mt Juliet TN 37122</Text>
            </GridItem>
            <GridItem >
              <Image 
                src="/equal-housing-opportunity.png" 
                alt="Equal Housing Opportunity" 
                height="60px"
              />
            </GridItem>
            </Center>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
