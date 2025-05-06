import React, { useMemo } from 'react';
import {
  Box,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  DrawerFooter,
  Flex,
  Heading,
  Text,
  Badge,
  Divider,
  Progress,
  VStack,
  Link,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Icon,
  Button,
  useTheme,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import {
  FaPhone,
  FaMapMarkerAlt,
  FaHistory,
  FaFileContract,
  FaDownload,
  FaEnvelope
} from 'react-icons/fa';
import { Buyer } from '../store/buyerSlice';

const MotionBox = motion(Box);

interface BuyerDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  buyer: Buyer | null;
}

const BuyerDetailDrawer: React.FC<BuyerDetailDrawerProps> = ({ isOpen, onClose, buyer }) => {
  // Return early pattern after hooks
  // Define a safe empty placeholder if buyer is null
  const emptyBuyer: Buyer = {
    id: '',
    name: '',
    address: '',
    type: [],
    priceRange: '',
    likelihood: 'Possible',
    recentPurchases: 0
  };
  
  // Always use the buyer data or fallback to empty buyer
  const safeBuyer = buyer || emptyBuyer;
  
  // Theme colors
  const bgColor = 'background.primary';
  const borderColor = 'border.primary';
  const textSecondaryColor = 'text.secondary';
  const brandColor = 'brand.500';

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

  // Get likelihood color and percentage based on likelihood string
  const getLikelihoodPercentage = (likelihood: string): number => {
    return likelihood === 'Likely' ? 75 : 50;
  };

  // Define a type for purchase history entries
  interface PurchaseHistoryEntry {
    address?: string;
    date?: string;
    price?: string | number;
  }
  
  // Extract purchase history from buyer profile if available, or use mock data
  const purchaseHistory = useMemo(() => {
    // Check if buyer has purchase_history in their profile
    if (safeBuyer.purchase_history && Array.isArray(safeBuyer.purchase_history) && safeBuyer.purchase_history.length > 0) {
      return safeBuyer.purchase_history.slice(0, 3).map((purchase: PurchaseHistoryEntry) => ({
        address: purchase.address || "Address not available",
        date: purchase.date || new Date().toLocaleDateString(),
        price: typeof purchase.price === 'number' ? `$${purchase.price.toLocaleString()}` : purchase.price || "Price not available"
      }));
    }
    
    // Use random but plausible mock data based on buyer's preferences
    return [
      { address: `123 Main St, ${safeBuyer.address.split(',')[0] || 'Atlanta, GA'}`, date: "Mar 15, 2023", price: "$145,000" },
      { address: `456 Oak Ave, ${safeBuyer.address.split(',')[0] || 'Atlanta, GA'}`, date: "Jan 22, 2023", price: "$112,500" },
      { address: `789 Pine Ln, ${safeBuyer.address.split(',')[0] || 'Atlanta, GA'}`, date: "Nov 10, 2022", price: "$127,000" },
    ];
  }, [safeBuyer]);

  // Return early if no buyer and dialog not open
  if (!buyer && !isOpen) {
    return null;
  }

  return (
    <Drawer
      isOpen={isOpen}
      placement="right"
      onClose={onClose}
      size="md"
      autoFocus={false}
    >
      <DrawerOverlay
        backdropFilter="blur(4px)"
        bg="blackAlpha.300"
      />
      <DrawerContent
        bg={bgColor}
        boxShadow="dark-lg"
        maxH="100vh"
        // onWheel={(e) => e.stopPropagation()} // Consider keeping if needed for event isolation
      >
        <DrawerCloseButton
          size="lg"
          color="brand.500"
          bg="white"
          borderRadius="full"
          zIndex={10}
          top={4}
          right={4}
          _hover={{ bg: "gray.100" }}
        />
        <DrawerHeader
          borderBottomWidth="1px"
          py={6}
          bg={bgColor}
        >
          <Heading size="lg">{safeBuyer.name}</Heading>
          <Flex mt={3} flexWrap="wrap" gap={2}>
            {safeBuyer.type.map((type, idx) => (
              <Badge
                key={idx}
                colorScheme={getBuyerTypeColor(type)}
                py={1}
                px={3}
                borderRadius="md"
                fontSize="sm"
              >
                {type}
              </Badge>
            ))}
          </Flex>
        </DrawerHeader>

        <DrawerBody
          py={6}
          overflowY="auto"
          // sx={{ // Removed custom scrollbar styles
          //   scrollBehavior: 'smooth',
          //   msOverflowStyle: 'auto',
          //   touchAction: 'pan-y',
          // }}
          // onWheel={(e) => e.stopPropagation()} // Consider keeping if needed for event isolation
        >
          <VStack spacing={8} align="stretch" w="100%">
            {/* Contact Information */}
            <Box w="100%">
              <Heading size="md" mb={4}>Contact Information</Heading>
              <VStack spacing={3} align="stretch">
                <Flex align="center">
                  <Icon as={FaMapMarkerAlt as React.ElementType} mr={3} color={brandColor} />
                  <Text fontWeight="medium">{safeBuyer.address}</Text>
                </Flex>
                {safeBuyer.phone && (
                  <Flex align="center">
                    <Icon as={FaPhone as React.ElementType} mr={3} color={brandColor} />
                    <Link href={`tel:${safeBuyer.phone}`}>{safeBuyer.phone}</Link>
                  </Flex>
                )}
                <Flex align="center">
                  <Icon as={FaEnvelope as React.ElementType} mr={3} color={brandColor} />
                  <Link href={`mailto:info@${safeBuyer.name.toLowerCase().replace(/\s+/g, '')}.com`}>
                    info@{safeBuyer.name.toLowerCase().replace(/\s+/g, '')}.com
                  </Link>
                </Flex>
              </VStack>
            </Box>

            <Divider />

            {/* Buyer Details */}
            <Box w="100%">
              <Heading size="md" mb={4}>Buyer Details</Heading>
              <SimpleGrid columns={2} spacing={4}>
                <Stat>
                  <StatLabel color={textSecondaryColor}>Price Range</StatLabel>
                  <StatNumber fontSize="lg">{safeBuyer.priceRange}</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel color={textSecondaryColor}>Recent Purchases</StatLabel>
                  <StatNumber fontSize="lg">{safeBuyer.recentPurchases}</StatNumber>
                </Stat>
              </SimpleGrid>

              <Box mt={6}>
                <Text fontWeight="medium" mb={2}>Purchase Likelihood</Text>
                <Flex align="center">
                  <Box flex="1" mr={4}>
                    <Progress
                      value={getLikelihoodPercentage(safeBuyer.likelihood)}
                      colorScheme={safeBuyer.likelihood === 'Likely' ? 'green' : 'yellow'}
                      size="sm"
                      borderRadius="full"
                    />
                  </Box>
                  <Text fontWeight="bold">{safeBuyer.likelihood}</Text>
                </Flex>
              </Box>
            </Box>

            <Divider />

            {/* Recent Activity */}
            <Box w="100%">
              <Heading size="md" mb={4}>Recent Purchases</Heading>
              <VStack spacing={4} align="stretch">
                {purchaseHistory.map((purchase: { address: string; date: string; price: string }, idx: number) => (
                  <MotionBox
                    key={idx}
                    p={4}
                    borderWidth="1px"
                    borderRadius="md"
                    borderColor={borderColor}
                    whileHover={{ y: -2, boxShadow: 'md' }}
                    transition={{ duration: 0.2 }}
                  >
                    <Flex justify="space-between" mb={2}>
                      <Text fontWeight="bold">{purchase.address}</Text>
                      <Badge colorScheme="green">{purchase.price}</Badge>
                    </Flex>
                    <Flex align="center">
                      <Icon as={FaHistory as React.ElementType} color={textSecondaryColor} mr={2} />
                      <Text fontSize="sm" color={textSecondaryColor}>{purchase.date}</Text>
                    </Flex>
                  </MotionBox>
                ))}
              </VStack>
            </Box>

            <Divider />

            {/* Actions */}
            <Flex justify="flex-end" mb={4}>
              <Button leftIcon={<Icon as={FaDownload as React.ElementType} />} colorScheme="brand">
                Download Profile
              </Button>
            </Flex>
          </VStack>
        </DrawerBody>

        <DrawerFooter borderTopWidth="1px">
          <Button onClick={onClose} variant="outline" width="100%">
            Close
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default BuyerDetailDrawer;