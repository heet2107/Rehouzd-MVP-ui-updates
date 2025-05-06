import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Text,
  Flex,
  Box,
  Icon,
  useToast,
  InputGroup,
  InputLeftAddon,
} from '@chakra-ui/react';
import { FaCheck } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';

interface BuyerMatchingModalProps {
  isOpen: boolean;
  onClose: () => void;
  addressData?: string;
}

const BuyerMatchingModal: React.FC<BuyerMatchingModalProps> = ({
  isOpen,
  onClose,
  addressData
}) => {
  const navigate = useNavigate();
  const toast = useToast();
  
  // Get user data from Redux
  const { user_id, fname, lname, mobile } = useAppSelector(state => state.user);
  
  // Form state
  const [firstName, setFirstName] = useState(fname || '');
  const [lastName, setLastName] = useState(lname || '');
  const [phoneNumber, setPhoneNumber] = useState(mobile || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Validate form
  const isFormValid = firstName.trim() !== '' && lastName.trim() !== '' && phoneNumber.trim() !== '';
  
  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFirstName(fname || '');
      setLastName(lname || '');
      setPhoneNumber(mobile || '');
      setIsSuccess(false);
    }
  }, [isOpen, fname, lname, mobile]);
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!isFormValid) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/buyer-matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user_id ? parseInt(user_id) : undefined,
          first_name: firstName,
          last_name: lastName,
          phone_number: phoneNumber,
          property_address: addressData
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit buyer matching request');
      }
      
      setIsSuccess(true);
      
      // Redirect after success display
      setTimeout(() => {
        onClose();
        navigate('/estimate');
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting buyer matching request:', error);
      toast({
        title: 'Error',
        description: 'Unable to submit your request. Please try again later.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay />
      <ModalContent borderRadius="md">
        {!isSuccess ? (
          <>
            <ModalHeader borderBottom="1px solid" borderColor="gray.200">
              <Text color="text.primary" fontSize="xl" fontWeight="bold">
                Exclusive Buyer-Matching Service
              </Text>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody py={6}>
              <Text mb={6}>We'll source the offers for you</Text>
              
              <Stack spacing={4}>
                <Flex gap={4}>
                  <FormControl isRequired>
                    <Input
                      placeholder="First Name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </FormControl>
                  
                  <FormControl isRequired>
                    <Input
                      placeholder="Last Name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </FormControl>
                </Flex>
                
                <FormControl isRequired>
                  <InputGroup>
                    <Input
                      placeholder="Phone Number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </InputGroup>
                </FormControl>
              </Stack>
            </ModalBody>
            
            <ModalFooter flexDirection="column" gap={2}>
              <Button
                width="100%"
                colorScheme="green"
                bg="green.800"
                size="lg"
                onClick={handleSubmit}
                isLoading={isSubmitting}
                isDisabled={!isFormValid}
              >
                Submit For Approval
              </Button>
              
              <Text fontSize="sm" mt={2}>
                We'll reach out to you for application review
              </Text>
            </ModalFooter>
          </>
        ) : (
          <ModalBody py={8}>
            <Flex direction="column" align="center" justify="center">
              <Box
                borderRadius="full"
                bg="green.500"
                w="80px"
                h="80px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                mb={4}
              >
                <Icon as={FaCheck as React.ElementType} color="white" boxSize={10} />
              </Box>
              
              <Text fontSize="xl" fontWeight="bold" mb={2}>
                Request Submitted!
              </Text>
              
              <Text textAlign="center" mb={4}>
                Thank you for your interest. We'll review your application and
                contact you soon.
              </Text>
            </Flex>
          </ModalBody>
        )}
      </ModalContent>
    </Modal>
  );
};

export default BuyerMatchingModal; 