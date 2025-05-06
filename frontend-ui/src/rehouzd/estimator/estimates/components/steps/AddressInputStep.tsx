import React from 'react';
import {
  Box,
  Heading,
  Button,
  VStack,
  Flex,
  Container,
  InputGroup,
  InputLeftElement,
  useTheme,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import PlaceAutocompleteInput, { AddressComponents } from '../../../address/components/PlaceAutocompleteInput';
import { useAppDispatch } from '../../../store/hooks';
import { setProperties } from '../../../store/propertySlice';
import { resetUnderwriteValues, setCurrentAddress } from '../../../store/underwriteSlice';

interface AddressInputStepProps {
  addressInput: string;
  onAddressChange: (val: string) => void;
  onAddressSelect: (addr: AddressComponents) => void;
  onNext: () => void;
}

const AddressInputStep: React.FC<AddressInputStepProps> = ({
  addressInput,
  onAddressChange,
  onAddressSelect,
  onNext,
}) => {
  const dispatch = useAppDispatch();
  const theme = useTheme();

  const handleAddressSelect = (address: AddressComponents) => {
    // Clear existing property data when a new address is selected
    dispatch(setProperties([]));
    
    // Reset underwrite values when a new address is selected
    dispatch(resetUnderwriteValues());
    
    // Store the current address in the Redux store
    dispatch(setCurrentAddress(address.formattedAddress));
    
    onAddressSelect(address);
  };

  return (
    <Box
      w="100%"
      bg="background.primary" 
      backgroundImage="url('data:image/svg+xml;charset=utf-8,%3Csvg width=%221200%22 height=%221800%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22%23000000%22 opacity=%220.05%22%3E%3Ccircle cx=%220%22 cy=%220%22 r=%222%22/%3E%3Ccircle cx=%2240%22 cy=%220%22 r=%222%22/%3E%3Ccircle cx=%2280%22 cy=%220%22 r=%222%22/%3E%3Ccircle cx=%22120%22 cy=%220%22 r=%222%22/%3E%3Ccircle cx=%22160%22 cy=%220%22 r=%222%22/%3E%3Ccircle cx=%22200%22 cy=%220%22 r=%222%22/%3E%3Ccircle cx=%22240%22 cy=%220%22 r=%222%22/%3E%3Ccircle cx=%22280%22 cy=%220%22 r=%222%22/%3E%3Ccircle cx=%22320%22 cy=%220%22 r=%222%22/%3E%3Ccircle cx=%22360%22 cy=%220%22 r=%222%22/%3E%3Ccircle cx=%22400%22 cy=%220%22 r=%222%22/%3E%3Ccircle cx=%22440%22 cy=%220%22 r=%222%22/%3E%3Ccircle cx=%22480%22 cy=%220%22 r=%222%22/%3E%3Ccircle cx=%22520%22 cy=%220%22 r=%222%22/%3E%3Ccircle cx=%22560%22 cy=%220%22 r=%222%22/%3E%3Ccircle cx=%22600%22 cy=%220%22 r=%222%22/%3E%3Ccircle cx=%22640%22 cy=%220%22 r=%222%22/%3E%3Ccircle cx=%22680%22 cy=%220%22 r=%222%22/%3E%3Ccircle cx=%22720%22 cy=%220%22 r=%222%22/%3E%3Ccircle cx=%22760%22 cy=%220%22 r=%222%22/%3E%3Ccircle cx=%22800%22 cy=%220%22 r=%222%22/%3E%3Ccircle cx=%22840%22 cy=%220%22 r=%222%22/%3E%3Ccircle cx=%22880%22 cy=%220%22 r=%222%22/%3E%3Ccircle cx=%22920%22 cy=%220%22 r=%222%22/%3E%3Ccircle cx=%22960%22 cy=%220%22 r=%222%22/%3E%3Ccircle cx=%221000%22 cy=%220%22 r=%222%22/%3E%3Ccircle cx=%221040%22 cy=%220%22 r=%222%22/%3E%3Ccircle cx=%221080%22 cy=%220%22 r=%222%22/%3E%3Ccircle cx=%221120%22 cy=%220%22 r=%222%22/%3E%3Ccircle cx=%221160%22 cy=%220%22 r=%222%22/%3E%3Ccircle cx=%221200%22 cy=%220%22 r=%222%22/%3E%3Ccircle cx=%220%22 cy=%2240%22 r=%222%22/%3E%3Ccircle cx=%2240%22 cy=%2240%22 r=%222%22/%3E%3Ccircle cx=%2280%22 cy=%2240%22 r=%222%22/%3E%3C/g%3E%3C/svg%3E')"
      backgroundRepeat="repeat"
      backgroundSize="40px 40px"
      py={10}
    >
      <Container maxW="container.md">
        <VStack spacing={14} align="center">
          <Box textAlign="center">
            <Heading
              fontSize="30px"
              color="brand.500"         
              fontWeight="bold"
            >
              Instant Offer Estimate &<br />
              Investor Matching Intelligence
            </Heading>
          </Box>

          <Box
            w="100%"
            maxW="600px"
            bg="white"
            border="1px solid #222"
            borderRadius="12px"
            p={1}
          >
            <Flex align="center">
              <Box flex="1" pl={4}>
                <InputGroup>
                  <InputLeftElement
                    pointerEvents="none"
                    children={<SearchIcon boxSize={6} color="gray.400" />}
                    height="full"
                    width="20px"
                  />
                  <PlaceAutocompleteInput
                    value={addressInput}
                    onChange={onAddressChange}
                    onSelectAddress={handleAddressSelect}
                    borderColor="transparent"
                    _hover={{ borderColor: 'transparent' }}
                    _focus={{
                      borderColor: 'transparent',
                      boxShadow: 'none',
                    }}
                  />
                </InputGroup>
              </Box>

              <Button
                colorScheme="brand"
                variant="solid"
                size="lg"
                px={8}
                py={7}
                onClick={onNext}
                isDisabled={!addressInput}
                borderRadius="12px"
                fontWeight="bold"
              >
                Find Your Buyer
              </Button>
            </Flex>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};

export default AddressInputStep;
