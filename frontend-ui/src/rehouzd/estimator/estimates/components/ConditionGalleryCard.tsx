import React, { useState } from 'react';
import { Box, Text, Flex, VStack, StackDivider } from '@chakra-ui/react';
import ImageGallery, { GalleryImage } from '../../components/ImageGallery';

// Define condition levels with their respective images
interface ConditionLevel {
    value: string;
    label: string;
    description: string;
    exteriorImage: string;
    interiorImages: string[];
}

interface ConditionGalleryCardProps {
    condition: ConditionLevel;
    isSelected: boolean;
    onClick: () => void;
}

const ConditionGalleryCard: React.FC<ConditionGalleryCardProps> = ({
    condition,
    isSelected,
    onClick
}) => {
    const [showGallery, setShowGallery] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    // Use theme colors directly
    const cardBg = 'background.primary';
    const textColor = 'text.primary';
    const descriptionColor = 'text.secondary';
    const hoverBg = 'background.secondary';
    const selectedBorderColor = 'brand.500';
    const dividerColor = 'border.primary';

    // Convert string image paths to GalleryImage objects
    const galleryImages: GalleryImage[] = [
        {
            src: condition.exteriorImage,
            alt: `${condition.label} Exterior`,
            isExterior: true
        },
        ...condition.interiorImages.map((img, idx) => ({
            src: img,
            alt: `${condition.label} Interior ${idx + 1}`,
            isExterior: false
        }))
    ];

    const handleImageClick = (index: number) => {
        setSelectedImageIndex(index);
        setShowGallery(true);
    };

    const handleCloseGallery = () => {
        setShowGallery(false);
    };

    return (
        <>
            {/* Main container changed to Flex */}
            <Flex
                minWidth="280px"
                borderWidth={isSelected ? "2px" : "1px"}
                borderColor={isSelected ? selectedBorderColor : "transparent"}
                borderRadius="lg"
                overflow="hidden"
                bg={cardBg}
                cursor="pointer"
                transition="box-shadow 0.2s"
                _hover={{
                    boxShadow: 'lg',
                    bg: hoverBg,
                }}
                onClick={onClick}
                // Align items vertically in the flex container
                align="stretch"
            >
                {/* Image Section Container */}
                <Box flexShrink={0} width="120px"> {/* Fixed width for image section */}
                    {/* Main exterior image */}
                    <Box
                        height="80px" // Adjusted height slightly
                        backgroundImage={`url(${condition.exteriorImage})`}
                        backgroundSize="cover"
                        backgroundPosition="center"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleImageClick(0);
                        }}
                        cursor="zoom-in"
                        borderTopLeftRadius="lg" // Keep corners rounded
                    />

                    {/* Thumbnail grid for interior images */}
                    <Flex justify="space-between" p={1}>
                        {condition.interiorImages.slice(0, 3).map((img, idx) => ( // Limit to 3 thumbs maybe
                            <Box
                                key={idx}
                                width="35px" // Adjusted size
                                height="25px" // Adjusted size
                                backgroundImage={`url(${img})`}
                                backgroundSize="cover"
                                backgroundPosition="center"
                                borderRadius="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleImageClick(idx + 1);
                                }}
                                cursor="zoom-in"
                                transition="all 0.2s"
                                _hover={{ opacity: 0.8 }}
                            />
                        ))}
                    </Flex>
                </Box>

                {/* Divider between images and text */}
                {/* Optional: Add a visual divider */}
                {/* <StackDivider borderColor={dividerColor} orientation="vertical" /> */}

                {/* Text Section */}
                <VStack
                    p={3} // Adjust padding
                    align="start"
                    spacing={1}
                    flex={1} // Allow text section to take remaining space
                    overflow="hidden" // Prevent text overflow issues
                >
                    <Text fontWeight="bold" fontSize="sm" color={textColor} noOfLines={1}> {/* Limit title lines */}
                        {condition.label}
                    </Text>
                    <Text fontSize="xs" color={descriptionColor} noOfLines={3}> {/* Allow more lines for description */}
                        {condition.description}
                    </Text>
                </VStack>
            </Flex>

            {/* Full screen image gallery modal (remains the same) */}
            {showGallery && (
                <ImageGallery
                    images={galleryImages}
                    initialIndex={selectedImageIndex}
                    onClose={handleCloseGallery}
                    isOpen={showGallery}
                    condition={condition.value}
                />
            )}
        </>
    );
};

export default ConditionGalleryCard;