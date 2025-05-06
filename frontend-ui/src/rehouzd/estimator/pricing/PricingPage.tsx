import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Stack,
  Flex,
  Button,
  VStack,
  HStack,
  Badge,
  Icon,
} from '@chakra-ui/react';
import { FiCheck } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

interface PricingPlan {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  buttonText: string;
  isPopular?: boolean;
}

const PricingPage: React.FC = () => {
  const navigate = useNavigate();

  // Pricing plans data
  const plans: PricingPlan[] = [
    {
      id: "free",
      name: "Free",
      price: "$0",
      description: "Perfect for beginners exploring the platform",
      features: [
        "5 properties to be serviced",
        "Instant investor offer estimates",
        "Rental and sold comps",
        "Underwriting tool with editable inputs",
        "Buyer ranking system",
        "Buyer details (name, address, purchase history)"
      ],
      buttonText: "Start Free"
    },
    {
      id: "professional",
      name: "Professional",
      price: "$49.99",
      description: "For active real estate professionals",
      features: [
        "150 estimates per month",
        "Instant investor offer estimates",
        "Comprehensive rental and sold comps",
        "Advanced underwriting tool with editable inputs",
        "Priority buyer ranking system",
        "Detailed buyer information and analytics",
        "20 custom underwrites per month from a Rehouzd analyst"
      ],
      buttonText: "Get Started",
      isPopular: true
    }
  ];

  const handlePlanSelect = (plan: PricingPlan) => {
    // Instead of opening the modal directly, navigate to the current page with a query parameter
    navigate(`?plan=${plan.id}`);
  };

  return (
    <Box py={16} bg="gray.50">
      <Container maxW="container.xl">
        <VStack spacing={8} textAlign="center" mb={12}>
          <Heading
            as="h1"
            fontSize={{ base: '3xl', md: '4xl', lg: '5xl' }}
            fontWeight="bold"
            fontFamily="heading"
            color="gray.800"
          >
            Start Free. Scale When You're Ready
          </Heading>
        </VStack>

        <Box
          borderWidth="2px"
          borderRadius="xl"
          overflow="hidden"
          maxW="container.lg"
          mx="auto"
          bg="white"
        >
          <Flex 
            direction={{ base: 'column', md: 'row' }} 
            justify="center"
            align="stretch"
            p={6}
            gap={8}
          >
            {plans.map((plan) => (
              <Box 
                key={plan.id}
                bg="white"
                p={8}
                borderRadius="lg"
                borderWidth="1px"
                borderColor="gray.200"
                flex="1"
                position="relative"
                maxW={{ base: "full", md: "50%" }}
              >
                {plan.isPopular && (
                  <Badge
                    position="absolute"
                    top="-1px"
                    right="20px"
                    colorScheme="green"
                    fontSize="sm"
                    px={3}
                    py={1}
                    borderRadius="md"
                    fontWeight="medium"
                  >
                    Most Popular
                  </Badge>
                )}
                <VStack align="flex-start" spacing={4}>
                  <Text fontSize="xl" fontWeight="bold" color="gray.800" fontFamily="heading">
                    {plan.name}
                  </Text>
                  <HStack align="baseline">
                    <Text fontSize="4xl" fontWeight="bold" color="gray.800" fontFamily="heading">
                      {plan.price}
                    </Text>
                    <Text color="gray.500" fontFamily="body">/month</Text>
                  </HStack>
                  <Text color="gray.600" fontFamily="body">
                    {plan.description}
                  </Text>

                  <Button
                    mt={4}
                    w="full"
                    py={6}
                    bg={plan.isPopular ? "#104911" : "white"}
                    color={plan.isPopular ? "white" : "gray.800"}
                    borderColor={plan.isPopular ? "#104911" : "gray.300"}
                    borderWidth="1px"
                    _hover={{
                      bg: plan.isPopular ? "#0b3310" : "gray.100",
                    }}
                    onClick={() => handlePlanSelect(plan)}
                    fontFamily="body"
                  >
                    {plan.buttonText}
                  </Button>

                  <VStack spacing={4} align="flex-start" w="full" mt={4}>
                    {plan.features.map((feature, index) => (
                      <HStack key={index} align="flex-start">
                        <Icon as={FiCheck as React.ElementType} mt={1} color="#104911" boxSize={4} />
                        <Text color="gray.700" fontFamily="body" fontSize="sm">
                          {feature}
                        </Text>
                      </HStack>
                    ))}
                  </VStack>
                </VStack>
              </Box>
            ))}
          </Flex>
        </Box>
      </Container>
    </Box>
  );
};

export default PricingPage; 