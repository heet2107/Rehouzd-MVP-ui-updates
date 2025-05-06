import React, { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    Text,
    Button,
    Input,
    FormControl,
    FormLabel,
    FormErrorMessage,
    useToast,
    Checkbox,
} from '@chakra-ui/react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setUserData } from '../../store/userSlice';
import CommonModal from '../../components/CommonModal';

const SpecialistCallModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
                                                                                     isOpen,
                                                                                     onClose,
                                                                                 }) => {
    const user = useAppSelector((state) => state.user);
    const dispatch = useAppDispatch();
    const [enteredPhoneNumber, setEnteredPhoneNumber] = useState(user.mobile || '');
    const [callbackRequested, setCallbackRequested] = useState(false);
    const [errorMessage] = useState('');
    const [saveToProfile, setSaveToProfile] = useState(false);
    const toast = useToast();

    useEffect(() => {
        if (enteredPhoneNumber === user.mobile) {
            setSaveToProfile(false);
        }
    }, [enteredPhoneNumber, user.mobile]);

    const shouldShowSaveOption = () => {
        return user.isLoggedIn && enteredPhoneNumber && enteredPhoneNumber !== user.mobile;
    };

    const updateUserPhoneNumber = async (phoneNumber: string) => {
        try {
            const response = await fetch('/api/auth/profile-update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.user_id,
                    email: user.email,
                    first_name: user.fname,
                    last_name: user.lname,
                    mobile_number: phoneNumber,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to update profile');
            }

            const data = await response.json();
            dispatch(setUserData({
                ...user,
                mobile: data.user.mobile_number,
            }));

            toast({
                title: 'Phone number updated',
                description: 'Your profile has been updated with the new phone number',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            console.error('Error updating phone number:', error);
            toast({
                title: 'Error',
                description: 'Failed to update your profile',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleRequestCallback = async (phone: string) => {
        if (!phone.trim()) {
            toast({
                title: 'Phone number required',
                description: 'Please enter a phone number.',
                status: 'warning',
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        setCallbackRequested(true);
        try {
            const response = await fetch('/api/specialist-callback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user && user.isLoggedIn ? user.user_id : null,
                    phoneNumber: phone,
                    requestedAt: new Date().toISOString(),
                }),
            });

            if (!response.ok) {
                throw new Error('Request failed');
            }

            if (saveToProfile && shouldShowSaveOption()) {
                await updateUserPhoneNumber(phone);
            }

            toast({
                title: 'Request Sent',
                description: 'A specialist will reach out to you shortly.',
                status: 'success',
                duration: 5000,
                isClosable: true,
            });
            onClose();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Unable to process your request. Please try again later.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setCallbackRequested(false);
            setSaveToProfile(false);
        }
    };

    const renderModalContent = () => (
        <VStack spacing={4}>
            <Box textAlign="center">
                <Text fontWeight="bold" fontSize="lg">Call us directly</Text>
                <Text fontSize="2xl" fontWeight="bold" color="brand.500">
                    310-689-8695
                </Text>
            </Box>
            <Text textAlign="center">or</Text>
            <VStack spacing={4} width="100%">
                <FormControl isInvalid={!!errorMessage}>
                    <FormLabel htmlFor="phone-number">Phone Number</FormLabel>
                    <Input
                        id="phone-number"
                        type="tel"
                        placeholder="Enter your phone number"
                        value={enteredPhoneNumber}
                        onChange={(e) => setEnteredPhoneNumber(e.target.value)}
                        borderColor="border.primary"
                        _hover={{ borderColor: 'brand.500' }}
                        _focus={{ borderColor: 'brand.500', boxShadow: `0 0 0 1px brand.500` }}
                    />
                    {errorMessage && <FormErrorMessage>{errorMessage}</FormErrorMessage>}
                </FormControl>

                {shouldShowSaveOption() && (
                    <Checkbox
                        colorScheme="teal"
                        isChecked={saveToProfile}
                        onChange={(e) => setSaveToProfile(e.target.checked)}
                        alignSelf="flex-start"
                    >
                        Save this number to my profile
                    </Checkbox>
                )}

                <Button
                    colorScheme="teal"
                    isLoading={callbackRequested}
                    onClick={() => handleRequestCallback(enteredPhoneNumber)}
                    width="100%"
                >
                    Confirm Callback Request
                </Button>
                <br/>
            </VStack>
        </VStack>
    );

    return (
        <CommonModal isOpen={isOpen} onClose={onClose} title="Speak Directly To A Specialist!">
            {renderModalContent()}
        </CommonModal>
    );
};

export default SpecialistCallModal;