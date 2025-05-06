import React, { useState } from 'react';
import {
    FormControl,
    FormLabel,
    Input,
    VStack,
    Text,
    useColorModeValue,
} from '@chakra-ui/react';

interface SignUpFormProps {
    onSignUp: (firstName: string, lastName: string, email: string, password: string, confirm: string) => Promise<void>;
    onError: (message: string) => void;
    onBackToLogin: () => void;
}

const SignUpForm: React.FC<SignUpFormProps> = ({ onSignUp, onError, onBackToLogin }) => {
    const [signupFirstName, setSignupFirstName] = useState('');
    const [signupLastName, setSignupLastName] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [signupConfirm, setSignupConfirm] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await onSignUp(signupFirstName, signupLastName, signupEmail, signupPassword, signupConfirm);
        } catch (err: any) {
            setError(err.message || 'An error occurred during sign-up');
            onError(err.message || 'An error occurred during sign-up');
        }
    };

    return (
        <form onSubmit={handleSubmit} id="signup-form"> {/* Added id */}
            <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                    <FormLabel>First Name</FormLabel>
                    <Input
                        placeholder="First Name"
                        value={signupFirstName}
                        onChange={(e) => setSignupFirstName(e.target.value)}
                        borderColor="border.primary"
                        _hover={{ borderColor: 'brand.500' }}
                        _focus={{ borderColor: 'brand.500', boxShadow: `0 0 0 1px brand.500` }}
                    />
                </FormControl>
                <FormControl isRequired>
                    <FormLabel>Last Name</FormLabel>
                    <Input
                        placeholder="Last Name"
                        value={signupLastName}
                        onChange={(e) => setSignupLastName(e.target.value)}
                        borderColor="border.primary"
                        _hover={{ borderColor: 'brand.500' }}
                        _focus={{ borderColor: 'brand.500', boxShadow: `0 0 0 1px brand.500` }}
                    />
                </FormControl>
                <FormControl isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input
                        type="email"
                        placeholder="Email"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        borderColor="border.primary"
                        _hover={{ borderColor: 'brand.500' }}
                        _focus={{ borderColor: 'brand.500', boxShadow: `0 0 0 1px brand.500` }}
                    />
                </FormControl>
                <FormControl isRequired>
                    <FormLabel>Password</FormLabel>
                    <Input
                        type="password"
                        placeholder="Password"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        borderColor="border.primary"
                        _hover={{ borderColor: 'brand.500' }}
                        _focus={{ borderColor: 'brand.500', boxShadow: `0 0 0 1px brand.500` }}
                    />
                </FormControl>
                <FormControl isRequired>
                    <FormLabel>Confirm Password</FormLabel>
                    <Input
                        type="password"
                        placeholder="Confirm Password"
                        value={signupConfirm}
                        onChange={(e) => setSignupConfirm(e.target.value)}
                        borderColor="border.primary"
                        _hover={{ borderColor: 'brand.500' }}
                        _focus={{ borderColor: 'brand.500', boxShadow: `0 0 0 1px brand.500` }}
                    />
                </FormControl>
                {error && (
                    <Text color="red.500" fontSize="sm">
                        {error}
                    </Text>
                )}
            </VStack>
        </form>
    );
};

export default SignUpForm;