import React, { useState } from 'react';
import {
    FormControl,
    FormLabel,
    Input,
    VStack,
    Text,
    Flex,
    Checkbox,
    Link,
    useColorModeValue,
} from '@chakra-ui/react';

interface LoginFormProps {
    onLogin: (email: string, password: string, rememberMe: boolean) => Promise<void>;
    onError: (message: string) => void;
    onSignUp: () => void;
    onForgotPassword: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onError, onSignUp, onForgotPassword }) => {
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await onLogin(loginEmail, loginPassword, rememberMe);
        } catch (err: any) {
            setError(err.message || 'An error occurred');
            onError(err.message || 'An error occurred');
        }
    };

    return (
        <form onSubmit={handleSubmit} id="login-form">
            <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input
                        id="login-email"
                        type="email"
                        placeholder="Email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
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
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
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
                <Flex align="center" justify="space-between">
                    <Checkbox isChecked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}>
                        Remember me
                    </Checkbox>
                    <Link fontSize="sm" onClick={onForgotPassword}>
                        Forgot password?
                    </Link>
                </Flex>
            </VStack>
        </form>
    );
};

export default LoginForm;
