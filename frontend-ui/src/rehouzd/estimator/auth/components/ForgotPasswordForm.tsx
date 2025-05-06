import React, { useState } from 'react';
import {
    FormControl,
    FormLabel,
    Input,
    VStack,
    Text,
    Button,
} from '@chakra-ui/react';

// Helper function instead of importing from an external file
const fetchApi = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, options);
  return response;
};

interface ForgotPasswordFormProps {
    onClose: () => void;
    onBackToLogin: () => void;
    onSubmit?: () => void; // Optional callback for when reset is successful
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onClose, onBackToLogin, onSubmit }) => {
    const [resetStep, setResetStep] = useState<'request' | 'reset'>('request');
    const [resetEmail, setResetEmail] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [resetError, setResetError] = useState('');
    const [resetSuccessMessage, setResetSuccessMessage] = useState('');

    const handleRequestReset = async () => {
        setResetError('');
        setResetSuccessMessage('');
        try {
            const res = await fetchApi('/api/auth/request-password-reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: resetEmail }),
            });
            if (!res.ok) {
                const errorData = await res.json();
                setResetError(errorData.message || 'Request failed');
                return;
            }
            setResetSuccessMessage('Password reset email sent. Check your email for the reset token/link.');
            
            // Notify parent component of success if onSubmit is provided
            if (onSubmit) {
                onSubmit();
            } else {
                setResetStep('reset');
            }
        } catch (error) {
            console.error('Error requesting password reset:', error);
            setResetError('Error requesting password reset');
        }
    };

    const handleResetPasswordSubmit = async () => {
        setResetError('');
        setResetSuccessMessage('');
        try {
            const res = await fetchApi('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: resetEmail, token: resetToken, newPassword }),
            });
            if (!res.ok) {
                const errorData = await res.json();
                setResetError(errorData.message || 'Reset failed');
                return;
            }
            setResetSuccessMessage('Password reset successful. You can now log in with your new password.');
            
            // Optionally clear the reset form fields
            setResetEmail('');
            setResetToken('');
            setNewPassword('');
            
            // Notify parent component of success if onSubmit is provided
            if (onSubmit) {
                onSubmit();
            } else {
                setResetStep('request');
                onClose(); // Close the modal after successful reset
            }
        } catch (error) {
            console.error('Error resetting password:', error);
            setResetError('Error resetting password');
        }
    };

    return (
        <VStack spacing={4} align="stretch">
            {resetStep === 'request' ? (
                <>
                    <FormControl id="reset-email" isRequired>
                        <FormLabel>Email</FormLabel>
                        <Input
                            type="email"
                            placeholder="Your email"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                        />
                    </FormControl>
                    {resetError && <Text color="red.500" fontSize="sm">{resetError}</Text>}
                    {resetSuccessMessage && <Text color="green.500" fontSize="sm">{resetSuccessMessage}</Text>}
                    <Button colorScheme="brand" onClick={handleRequestReset} disabled={!resetEmail}>
                        Request Reset
                    </Button>
                    <Button variant="ghost" onClick={onBackToLogin}>
                        Back to Login
                    </Button>
                </>
            ) : (
                <>
                    <FormControl id="reset-token" isRequired>
                        <FormLabel>Reset Token</FormLabel>
                        <Input
                            type="text"
                            placeholder="Reset Token"
                            value={resetToken}
                            onChange={(e) => setResetToken(e.target.value)}
                        />
                    </FormControl>
                    <FormControl id="new-password" isRequired>
                        <FormLabel>New Password</FormLabel>
                        <Input
                            type="password"
                            placeholder="New Password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                    </FormControl>
                    {resetError && <Text color="red.500" fontSize="sm">{resetError}</Text>}
                    {resetSuccessMessage && <Text color="green.500" fontSize="sm">{resetSuccessMessage}</Text>}
                    <Button colorScheme="brand" onClick={handleResetPasswordSubmit} disabled={!resetEmail || !resetToken || !newPassword}>
                        Reset Password
                    </Button>
                    <Button variant="ghost" onClick={() => setResetStep('request')}>
                        Back to Request
                    </Button>
                </>
            )}
        </VStack>
    );
};

export default ForgotPasswordForm;