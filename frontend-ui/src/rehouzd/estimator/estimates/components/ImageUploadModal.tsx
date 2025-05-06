// ImageUploadModal.tsx
import React, { useCallback, useState } from 'react';
import {
    Box,
    Text,
    Button,
    VStack,
    HStack,
    useColorModeValue,
    Icon,
    Progress,
    useToast,
} from '@chakra-ui/react';
import { useDropzone } from 'react-dropzone';
import { FaUpload, FaTrash } from 'react-icons/fa';
import CommonModal from '../../components/CommonModal';
import { useAppSelector } from '../../store/hooks';

interface ImageUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    propertyAddress: string;
}

const ImageUploadModal: React.FC<ImageUploadModalProps> = ({ 
    isOpen, 
    onClose, 
    propertyAddress 
}) => {
    const [files, setFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const toast = useToast();
    const user = useAppSelector(state => state.user);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        // If total files would exceed 5, only take what we can
        const remainingSlots = 5 - files.length;
        const newFiles = acceptedFiles.slice(0, remainingSlots);
        
        if (newFiles.length < acceptedFiles.length) {
            toast({
                title: "Too many files",
                description: "Only 5 images maximum are allowed. Some files were not added.",
                status: "warning",
                duration: 5000,
                isClosable: true,
            });
        }
        
        setFiles(prev => [...prev, ...newFiles]);
    }, [files.length, toast]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.gif']
        },
        maxSize: 5 * 1024 * 1024, // 5MB
    });

    const removeFile = (index: number) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    const simulateProgress = () => {
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            setUploadProgress(progress);
            if (progress >= 90) {
                clearInterval(interval);
            }
        }, 300);
        return interval;
    };

    const handleUpload = async () => {
        if (!files.length) return;
        
        setIsUploading(true);
        
        // Start progress simulation
        const progressInterval = simulateProgress();
        
        try {
            const formData = new FormData();
            
            // Add user ID and property address
            formData.append('userId', user.user_id || '0');
            formData.append('propertyAddress', propertyAddress);
            
            // Add each file
            files.forEach(file => {
                formData.append('images', file);
            });
            
            // Send request to API
            const response = await fetch('/api/property/images/upload', {
                method: 'POST',
                body: formData,
            });
            
            if (!response.ok) {
                throw new Error('Upload failed');
            }
            
            const data = await response.json();
            
            // Ensure progress shows 100%
            clearInterval(progressInterval);
            setUploadProgress(100);
            
            // Show success message
            toast({
                title: "Upload successful",
                description: `${files.length} image${files.length > 1 ? 's' : ''} uploaded successfully.`,
                status: "success",
                duration: 5000,
                isClosable: true,
            });
            
            // Clear files and close modal
            setFiles([]);
            setTimeout(() => onClose(), 1000);
        } catch (error) {
            console.error('Upload error:', error);
            
            // Stop progress simulation
            clearInterval(progressInterval);
            
            // Show error message
            toast({
                title: "Upload failed",
                description: "There was an error uploading your images. Please try again.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setTimeout(() => {
                setIsUploading(false);
                setUploadProgress(0);
            }, 1000);
        }
    };

    const footer = (
        <HStack spacing={4} width="100%" justifyContent="flex-end">
            <Button variant="outline" onClick={onClose} isDisabled={isUploading}>
                Cancel
            </Button>
            <Button
                colorScheme="teal"
                leftIcon={<Icon as={FaUpload as React.ElementType} />}
                onClick={handleUpload}
                isLoading={isUploading}
                loadingText="Uploading..."
                isDisabled={files.length === 0 || isUploading}
            >
                Upload {files.length > 0 ? `(${files.length})` : ''}
            </Button>
        </HStack>
    );

    return (
        <CommonModal
            isOpen={isOpen}
            onClose={onClose}
            title="Upload Property Images"
            footer={footer}
            size="lg"
            closeOnOverlayClick={!isUploading}
            closeOnEsc={!isUploading}
        >
            <VStack spacing={4} width="100%">
                {isUploading && (
                    <Box width="100%">
                        <Text mb={2} textAlign="center">Uploading: {uploadProgress}%</Text>
                        <Progress 
                            value={uploadProgress} 
                            colorScheme="brand" 
                            hasStripe 
                            isAnimated 
                            size="sm" 
                            borderRadius="md"
                        />
                    </Box>
                )}
                
                <Box
                    {...getRootProps()}
                    border="2px dashed"
                    borderColor={"border.primary"}
                    borderRadius="md"
                    p={8}
                    textAlign="center"
                    cursor={isUploading ? "not-allowed" : "pointer"}
                    bg={isDragActive ? 'background.primary' : 'transparent'}
                    width="100%"
                    pointerEvents={isUploading ? "none" : "auto"}
                >
                    <input {...getInputProps()} disabled={isUploading} />
                    {isDragActive ? (
                        <Text>Drop the files here ...</Text>
                    ) : (
                        <VStack spacing={2}>
                            <Text>
                                Drag & drop images here, or click to select
                            </Text>
                            <Text fontSize="sm" color="gray.500">
                                Maximum 5 images, 5MB each (JPG, PNG, GIF)
                            </Text>
                        </VStack>
                    )}
                </Box>
                
                {files.length > 0 && (
                    <VStack align="start" spacing={2} width="100%">
                        <Text fontWeight="bold">Selected images:</Text>
                        {files.map((file, idx) => (
                            <HStack key={idx} width="100%" justify="space-between" p={2} bg={'background.primary'} borderRadius="md">
                                <Text fontSize="sm" isTruncated maxWidth="80%">
                                    {file.name} ({Math.round(file.size / 1024)} KB)
                                </Text>
                                <Button 
                                    size="xs" 
                                    colorScheme="red" 
                                    variant="ghost" 
                                    onClick={() => removeFile(idx)}
                                    isDisabled={isUploading}
                                >
                                    <Icon as={FaTrash as React.ElementType} />
                                </Button>
                            </HStack>
                        ))}
                    </VStack>
                )}
            </VStack>
        </CommonModal>
    );
};

export default ImageUploadModal;
