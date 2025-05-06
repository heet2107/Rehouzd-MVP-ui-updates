// ConditionStep.tsx
import React from 'react';
import { Box, Heading, VStack, HStack, Button, Icon } from '@chakra-ui/react';
import { FaArrowLeft } from 'react-icons/fa';
import ConditionGalleryCard from '../ConditionGalleryCard';

// Define condition data with image paths
const conditionData = [
    {
        value: 'Fixer',
        label: 'Fixer',
        description: 'Needs significant repairs, updates to major systems and finishes.',
        exteriorImage: '/images/fixer/exterior-fixer.jpg',
        interiorImages: [
            '/images/fixer/fixer-kitchen.jpg',
            '/images/fixer/fixer-living-room.jpg',
            '/images/fixer/fixer-bathroom.jpg'
        ]
    },
    {
        value: 'Outdated',
        label: 'Outdated',
        description: 'Functional but needs cosmetic updates, older finishes and systems.',
        exteriorImage: '/images/outdated/exterior-outdated.jpg',
        interiorImages: [
            '/images/outdated/outdated-kitchen.jpg',
            '/images/outdated/outdated-living-room.jpg',
            '/images/outdated/outdated-bathroom.jpg'
        ]
    },
    {
        value: 'Standard',
        label: 'Standard',
        description: 'Good condition, modern finishes, may need minor updates.',
        exteriorImage: '/images/standard/exterior-standard.jpg',
        interiorImages: [
            '/images/standard/standard-kitchen.jpg',
            '/images/standard/standard-living-room.jpg',
            '/images/standard/standard-bathroom.jpg'
        ]
    },
    {
        value: 'Renovated',
        label: 'Renovated',
        description: 'Recently upgraded with premium finishes and modern systems.',
        exteriorImage: '/images/renovated/exterior-renovated.jpg',
        interiorImages: [
            '/images/renovated/renovated-kitchen.jpg',
            '/images/renovated/renovated-living-room.jpg',
            '/images/renovated/renovated-bathroom.jpg'
        ]
    }
];

interface ConditionStepProps {
    selectedCondition: string;
    onConditionSelect: (condition: string) => void;
    onBack: () => void;
    onNext: () => void;
    isLoading?: boolean;
    loadingText?: string;
}

const ConditionStep: React.FC<ConditionStepProps> = ({ 
    selectedCondition, 
    onConditionSelect,
    onBack,
    onNext,
    isLoading = false,
    loadingText = "Loading..."
}) => {
    // Use theme colors directly
    const textColor = 'text.primary';
    
    return (
        <Box w="100%">
            <Heading 
                size="lg" 
                mb={4} 
                color={textColor}
            >
                Condition of the property
            </Heading>
            
            <VStack spacing={4} align="stretch">
                {conditionData.map((condition) => (
                    <ConditionGalleryCard
                        key={condition.value}
                        condition={condition}
                        isSelected={selectedCondition === condition.value}
                        onClick={() => onConditionSelect(condition.value)}
                    />
                ))}
            </VStack>

            <HStack mt={8} w="100%">
                <Button 
                    leftIcon={<Icon as={FaArrowLeft as React.ElementType} />} 
                    variant="outline" 
                    onClick={onBack} 
                    flex="1"
                >
                    Back
                </Button>
                <Button
                    colorScheme="brand"
                    flex="2"
                    isDisabled={!selectedCondition || isLoading}
                    onClick={onNext}
                    isLoading={isLoading}
                    loadingText={loadingText}
                >
                    Find Your Buyer
                </Button>
            </HStack>
        </Box>
    );
};

export default ConditionStep;
