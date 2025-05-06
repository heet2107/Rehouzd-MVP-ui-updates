import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Flex,
  Spacer,
  Spinner,
  useToast,
  Badge,
  HStack,
  Icon,
  Center,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Container,
  VStack,
  SimpleGrid,
  useDisclosure,
  TableContainer,
} from '@chakra-ui/react';
import { FaSearch, FaEye, FaTrash, FaMapMarkerAlt, FaCalendar, FaHome, FaDollarSign, FaBed, FaBath, FaRulerCombined, FaThLarge, FaList } from 'react-icons/fa';
import { LuRefreshCcw } from "react-icons/lu";
import { useAppSelector } from '../../store/hooks';
import { useNavigate } from 'react-router-dom';
import SavedEstimateModal from './SavedEstimateModal';

interface SavedEstimate {
  id: number;
  user_id: number;
  property_address: string;
  estimate_data: {
    property?: any;
    address?: any;
    addressState?: any;
    offer_range_low?: number;
    offer_range_high?: number;
    rent_underwrite_values?: {
      rent: number;
      expense: number;
      capRate: number;
      lowRehab: number;
      highRehab: number;
    };
    flip_underwrite_values?: {
      sellingCosts: number;
      holdingCosts: number;
      margin: number;
      lowRehab: number;
      highRehab: number;
    };
    notes?: string;
    active_investment_strategy?: string;
    timestamp?: string;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

const SavedEstimatesPage: React.FC = () => {
  const [savedEstimates, setSavedEstimates] = useState<SavedEstimate[]>([]);
  const [filteredEstimates, setFilteredEstimates] = useState<SavedEstimate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEstimateId, setSelectedEstimateId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const [selectedEstimate, setSelectedEstimate] = useState<SavedEstimate | null>(null);
  const [isUpdateLoading, setIsUpdateLoading] = useState(false);
  
  const user = useAppSelector(state => state.user);
  const toast = useToast();
  const navigate = useNavigate();
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const { isOpen: isViewModalOpen, onOpen: onViewModalOpen, onClose: onViewModalClose } = useDisclosure();
  
  const bgColor = 'background.primary';
  const borderColor = 'border.primary';
  const borderFocusColor = 'brand.500';
  const textColor = 'text.primary';
  const textSecondaryColor = 'text.secondary';
  const bgSecondaryColor = 'background.secondary';
  
  // Table styling for list view
  const headerBgColor = '#1A3C20'; // Dark green background for table header
  
  // Fetch saved estimates on component mount
  useEffect(() => {
    if (user.isLoggedIn && user.user_id) {
      fetchSavedEstimates();
    }
  }, [user.isLoggedIn, user.user_id]);
  
  // Filter estimates when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredEstimates(savedEstimates);
      return;
    }
    
    const filtered = savedEstimates.filter(estimate => 
      estimate.property_address.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredEstimates(filtered);
  }, [searchTerm, savedEstimates]);
  
  const fetchSavedEstimates = async () => {
    if (!user.user_id) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/saved-estimates/user/${user.user_id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch saved estimates');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSavedEstimates(data.estimates);
        setFilteredEstimates(data.estimates);
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to fetch saved estimates',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error fetching saved estimates:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch saved estimates. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const handleViewEstimate = (estimate: SavedEstimate) => {
    setSelectedEstimate(estimate);
    onViewModalOpen();
  };
  
  const openDeleteDialog = (estimateId: number) => {
    setSelectedEstimateId(estimateId);
    setIsDeleteDialogOpen(true);
  };
  
  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedEstimateId(null);
  };
  
  const handleDeleteEstimate = async () => {
    if (!selectedEstimateId) return;
    
    try {
      const response = await fetch(`/api/saved-estimates/${selectedEstimateId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete estimate');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Remove the deleted estimate from state
        setSavedEstimates(savedEstimates.filter(e => e.id !== selectedEstimateId));
        setFilteredEstimates(filteredEstimates.filter(e => e.id !== selectedEstimateId));
        
        toast({
          title: 'Success',
          description: 'Estimate deleted successfully',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to delete estimate',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error deleting estimate:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete estimate. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      closeDeleteDialog();
    }
  };

  const handleUpdateEstimate = async (updatedData: Partial<SavedEstimate>) => {
    if (!selectedEstimate) return;
    
    setIsUpdateLoading(true);
    
    try {
      const response = await fetch(`/api/saved-estimates/${selectedEstimate.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update estimate');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Update the estimate in the local state
        const updatedEstimates = savedEstimates.map(est => 
          est.id === selectedEstimate.id ? { ...est, ...updatedData, ...data.estimate } : est
        );
        
        setSavedEstimates(updatedEstimates);
        setFilteredEstimates(updatedEstimates);
        
        toast({
          title: 'Success',
          description: 'Estimate updated successfully',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });

        setTimeout(() => {
          onViewModalClose();
        }, 1000);

        

      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to update estimate',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error updating estimate:', error);
      toast({
        title: 'Error',
        description: 'Failed to update estimate. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUpdateLoading(false);
    }
  };
  
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: 'numeric'
    });
  };
  
  // Helper functions for rendering list view data
  const getSavedOfferRange = (estimate: SavedEstimate) => {
    if (estimate.estimate_data.offer_range_low && estimate.estimate_data.offer_range_high) {
      return `${formatPrice(estimate.estimate_data.offer_range_low)} - ${formatPrice(estimate.estimate_data.offer_range_high)}`;
    }
    return 'N/A';
  };
  
  const getRehouzedUnderwrittenRange = (estimate: SavedEstimate) => {
    // Calculate estimated value range based on current saved estimate data
    const baseLow = estimate.estimate_data.offer_range_low || 0;
    const baseHigh = estimate.estimate_data.offer_range_high || 0;
    
    // Example calculation - you'll need to replace with your actual calculation logic
    const rehouzedLow = baseLow * 0.95;
    const rehouzedHigh = baseHigh * 0.95;
    
    return `$${Math.round(rehouzedLow / 1000)}k - $${Math.round(rehouzedHigh / 1000)}k`;
  };
  
  const getRequestedUnderwrite = (estimate: SavedEstimate) => {
    return estimate.estimate_data.active_investment_strategy === 'rent' ? 'YES' : 'NO';
  };
  
  const getNotes = (estimate: SavedEstimate) => {
    return estimate.estimate_data.notes || '';
  };
  
  if (!user.isLoggedIn) {
    return (
      <Box p={8} textAlign="center">
        <Heading size="lg" mb={4}>Saved Estimates</Heading>
        <Text mb={4}>Please log in to view your saved estimates.</Text>
        <Button colorScheme="brand" onClick={() => navigate('/')}>Go to Home</Button>
      </Box>
    );
  }
  
  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <HStack justifyContent="space-between" wrap="wrap">
          <Box>
            <Heading as="h1" size="xl" mb={2}>
              Saved Estimates
            </Heading>
            <Text mb={6} color={textSecondaryColor}>
              View and manage your saved real estate investment analysis
            </Text>
          </Box>
          <HStack spacing={4}>
            <Button 
              leftIcon={<Icon as={FaHome as React.ElementType} />}
              colorScheme="brand" 
              onClick={() => navigate('/estimate')}
            >
              New Estimate
            </Button>
            <HStack 
              spacing={1} 
              bg={bgSecondaryColor} 
              p={1} 
              borderRadius="md" 
              borderWidth="1px" 
              borderColor={borderColor}
            >
              <Button
                size="sm"
                leftIcon={<Icon as={FaThLarge as React.ElementType} />}
                onClick={() => setViewType('grid')}
                colorScheme={viewType === 'grid' ? 'brand' : 'gray'}
                variant={viewType === 'grid' ? 'solid' : 'ghost'}
              >
                Grid
              </Button>
              <Button
                size="sm"
                leftIcon={<Icon as={FaList as React.ElementType} />}
                onClick={() => setViewType('list')}
                colorScheme={viewType === 'list' ? 'brand' : 'gray'}
                variant={viewType === 'list' ? 'solid' : 'ghost'}
              >
                List
              </Button>
            </HStack>
          </HStack>
        </HStack>

        <Flex mb={6} direction={{ base: 'column', md: 'row' }} align={{ base: 'stretch', md: 'center' }}>
          <InputGroup maxW={{ base: 'full', md: '400px' }} mb={{ base: 4, md: 0 }}>
            <InputLeftElement pointerEvents='none'>
              <Icon as={FaSearch as React.ElementType} color='gray.500' />
            </InputLeftElement>
            <Input 
              placeholder='Search by address...' 
              value={searchTerm}
              onChange={handleSearch}
              borderRadius="md"
              borderColor={borderColor}
              _hover={{ borderColor: borderFocusColor }}
              _focus={{ borderColor: borderFocusColor, boxShadow: `0 0 0 1px ${borderFocusColor}` }}
            />
          </InputGroup>
          <Spacer />
          <HStack>
            <Badge colorScheme="blue" fontSize="md" p={2} borderRadius="md">
              Total: {filteredEstimates.length}
            </Badge>
            <Button 
              leftIcon={<Icon as={LuRefreshCcw as React.ElementType} />}
              colorScheme="brand" 
              size="md"
              onClick={fetchSavedEstimates}
              isLoading={isLoading}
            >
              Refresh
            </Button>
          </HStack>
        </Flex>
        
        {isLoading ? (
          <Center py={10}>
            <Spinner size="xl" color="brand.500" />
          </Center>
        ) : filteredEstimates.length === 0 ? (
          <Box 
            p={8} 
            textAlign="center" 
            borderWidth="1px" 
            borderRadius="lg" 
            borderColor={borderColor}
            bg={bgColor}
          >
            <Text fontSize="lg" mb={4}>
              {searchTerm ? 'No estimates match your search' : 'No saved estimates found'}
            </Text>
            {searchTerm && (
              <Button variant="outline" onClick={() => setSearchTerm('')}>
                Clear Search
              </Button>
            )}
          </Box>
        ) : viewType === 'grid' ? (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {filteredEstimates.map((estimate) => (
              <Box 
                key={estimate.id} 
                p={4} 
                borderWidth="1px" 
                borderRadius="lg" 
                borderColor={borderColor} 
                bg={bgColor} 
                transition="all 0.2s" 
                _hover={{ transform: 'translateY(-4px)', shadow: 'md' }}
                position="relative"
              >
                <VStack align="stretch" spacing={3}>
                  <Heading as="h3" size="md" color={textColor}>
                    <HStack>
                      <Icon as={FaMapMarkerAlt as React.ElementType} color="brand.500" />
                      <Text noOfLines={1}>{estimate.property_address}</Text>
                    </HStack>
                  </Heading>
                  
                  <Flex justifyContent="space-between" alignItems="center">
                    <Badge colorScheme="green" fontSize="md" p={1} borderRadius="md">
                      {estimate.estimate_data.offer_range_low && estimate.estimate_data.offer_range_high ? 
                        `${formatPrice(estimate.estimate_data.offer_range_low)} - ${formatPrice(estimate.estimate_data.offer_range_high)}` :
                        estimate.estimate_data.estimated_value || '$0'
                      }
                    </Badge>
                    <Text fontSize="sm" color={textSecondaryColor}>
                      <HStack>
                        <Icon as={FaCalendar as React.ElementType} />
                        <Text>{formatDateTime(estimate.created_at).split(',')[0]}</Text>
                      </HStack>
                    </Text>
                  </Flex>
                  
                  {estimate.estimate_data.property_details && (
                    <SimpleGrid columns={2} spacing={2} mt={2}>
                      <HStack>
                        <Icon as={FaBed as React.ElementType} color="text.secondary" />
                        <Text fontSize="sm">{estimate.estimate_data.property_details.beds || 0} bd</Text>
                      </HStack>
                      <HStack>
                        <Icon as={FaBath as React.ElementType} color="text.secondary" />
                        <Text fontSize="sm">{estimate.estimate_data.property_details.baths || 0} ba</Text>
                      </HStack>
                      <HStack>
                        <Icon as={FaRulerCombined as React.ElementType} color="text.secondary" />
                        <Text fontSize="sm">{estimate.estimate_data.property_details.sqft || 0} sqft</Text>
                      </HStack>
                      <HStack>
                        <Icon as={FaHome as React.ElementType} color="text.secondary" />
                        <Text fontSize="sm">{estimate.estimate_data.property_details.year_built || 'N/A'}</Text>
                      </HStack>
                    </SimpleGrid>
                  )}
                  
                  <HStack mt={2} spacing={2}>
                    <Button
                      variant="outline"
                      size="sm"
                      colorScheme="green"
                      leftIcon={<Icon as={FaEye as React.ElementType} />}
                      flex="1"
                      onClick={() => handleViewEstimate(estimate)}
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      colorScheme="red"
                      leftIcon={<Icon as={FaTrash as React.ElementType} />}
                      flex="1"
                      onClick={() => openDeleteDialog(estimate.id)}
                    >
                      Delete
                    </Button>
                  </HStack>
                </VStack>
              </Box>
            ))}
          </SimpleGrid>
        ) : (
          <TableContainer 
            borderWidth="1px" 
            borderRadius="lg" 
            borderColor={borderColor} 
            bg={bgColor}
            overflowX="auto"
          >
            <Table variant="simple" size="md" colorScheme="green">
              <Thead bg={headerBgColor}>
                <Tr>
                  <Th color="white" textTransform="none" width="120px">Dated Saved</Th>
                  <Th color="white" textTransform="none">Property Address</Th>
                  <Th color="white" textTransform="none">Saved Offer<br/>Estimate Range</Th>
                  <Th color="white" textTransform="none">Rehouzd Underwritten<br/>Estimate Range</Th>
                  <Th color="white" textTransform="none">Requested<br/>Underwrite</Th>
                  <Th color="white" textTransform="none">Rehouzd Notes</Th>
                  <Th color="white" textTransform="none" width="120px">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredEstimates.map((estimate) => (
                  <Tr key={estimate.id}>
                    <Td>{formatDate(estimate.created_at)}</Td>
                    <Td>{estimate.property_address}</Td>
                    <Td>{getSavedOfferRange(estimate)}</Td>
                    <Td>{getRehouzedUnderwrittenRange(estimate)}</Td>
                    <Td>{getRequestedUnderwrite(estimate)}</Td>
                    <Td width="300px" noOfLines={1}>{getNotes(estimate)}</Td>
                    <Td>
                      <HStack spacing={2}>
                      
                        <Button
                      variant="outline"
                      size="sm"
                      colorScheme="green"
                      leftIcon={<Icon as={FaEye as React.ElementType} />}
                      flex="1"
                      onClick={() => handleViewEstimate(estimate)}
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      colorScheme="red"
                      leftIcon={<Icon as={FaTrash as React.ElementType} />}
                      flex="1"
                      onClick={() => openDeleteDialog(estimate.id)}
                    >
                      Delete
                    </Button>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        )}
      </VStack>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={closeDeleteDialog}
      >
        <AlertDialogOverlay>
          <AlertDialogContent bg={bgSecondaryColor}>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Estimate
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete this estimate? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={closeDeleteDialog}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDeleteEstimate} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* View/Edit Estimate Modal */}
      {selectedEstimate && (
        <SavedEstimateModal
          isOpen={isViewModalOpen}
          onClose={onViewModalClose}
          estimate={selectedEstimate}
          onUpdate={handleUpdateEstimate}
        />
      )}
    </Container>
  );
};

// Helper function to format price
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);
};

export default SavedEstimatesPage; 