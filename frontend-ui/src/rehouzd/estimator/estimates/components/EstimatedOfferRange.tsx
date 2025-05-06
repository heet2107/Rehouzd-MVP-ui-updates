import React, { useMemo, useState, useEffect } from 'react';
import {
    Box,
    Flex,
    Heading,
    Text,
    Image,
    Icon,
    HStack,
} from '@chakra-ui/react';
import { useAppSelector } from '../../store/hooks';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';

interface EstimatedOfferRangeProps {
    strategy: string;
}

interface AnimatedCounterProps {
    value: number;
    prefix?: string;
}

// Counter component for animating number changes
const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ value, prefix = '' }) => {
    const count = useMotionValue(0);
    const rounded = useTransform(count, (latest: number) => Math.round(latest));
    const [displayValue, setDisplayValue] = useState(0);
    
    useEffect(() => {
        const animation = animate(count, value, { duration: 0.8 });
        
        // Update the display value when the animation progresses
        const unsubscribe = rounded.onChange(v => {
            setDisplayValue(v);
        });
        
        return () => {
            animation.stop();
            unsubscribe();
        };
    }, [count, rounded, value]);
    
    // Format the number as currency
    const formattedValue = new Intl.NumberFormat('en-US', {
        style: 'decimal',
        maximumFractionDigits: 0
    }).format(displayValue);
    
    return (
        <motion.span>
            {prefix}{formattedValue}
        </motion.span>
    );
};

export const EstimatedOfferRange: React.FC<EstimatedOfferRangeProps> = ({ 
    strategy,
}) => {
    const borderPrimary = "border.primary";
    const textPrimary = "text.primary";
    
    // Get values from Redux store
    const rentValues = useAppSelector(state => state.underwrite.rent);
    const flipValues = useAppSelector(state => state.underwrite.flip);
    
    // Get address state to access property condition
    const addressState = useAppSelector(state => state.address);
    const propertyCondition = addressState.condition?.toLowerCase() || '';
    
    // Determine if property is a fixer based on condition
    const isFixerProperty = propertyCondition.toLowerCase() === 'outdated' || propertyCondition.toLowerCase() === 'fixer';
    
    // State to track previous values for animations
    const [prevLow, setPrevLow] = useState(0);
    const [prevHigh, setPrevHigh] = useState(0);
    
    // Get the appropriate values based on strategy
    const values = strategy === 'rent' ? rentValues : flipValues;
    const { afterRepairValue, lowRehab, highRehab } = values;
    
    // Calculate offer range
    const offerRange = useMemo(() => {
        let lowOffer = 0;
        let highOffer = 0;

        if (strategy === 'rent') {
            if (isFixerProperty) {
                const fixerOutdatedEstimatedOffer = (0.75 * afterRepairValue) - ((flipValues.holdingCosts / 100) * afterRepairValue);
                lowOffer = fixerOutdatedEstimatedOffer - highRehab;
                highOffer = fixerOutdatedEstimatedOffer - lowRehab;
            } else {
                // For standard/renovated properties, use the original formula
                lowOffer = afterRepairValue - highRehab;
                highOffer = afterRepairValue - lowRehab;
            }
        } else {
            // For flip strategy, use the estimatedOffer calculation
            lowOffer = flipValues.estimatedOffer - highRehab;
            highOffer = flipValues.estimatedOffer - lowRehab;
        }
        
        // Ensure we don't return negative values
        return {
            low: Math.max(0, lowOffer),
            high: Math.max(0, highOffer),
        };
    }, [afterRepairValue, lowRehab, highRehab, strategy, flipValues, isFixerProperty, propertyCondition]);
    
    // Update previous values for animation
    useEffect(() => {
        setPrevLow(offerRange.low);
        setPrevHigh(offerRange.high);
    }, [offerRange.low, offerRange.high]);
    
    // Format currency
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(value);
    };
    
    return (
        <Box
            p={6}
            borderRadius="lg"
            mb={6}
            bg="gray.50"
            borderWidth="1px"
            borderColor={borderPrimary}
        >
            <Heading as="h3" size="md" mb={4} color="gray.700">
                Estimated Offer Range
            </Heading>
            <Flex justify="space-between" align="center" mb={2}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={offerRange.low}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Text fontWeight="bold" fontSize="xl" color={textPrimary}>
                            <AnimatedCounter value={offerRange.low} prefix="$" />
                        </Text>
                    </motion.div>
                </AnimatePresence>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={offerRange.high}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Text fontWeight="bold" fontSize="xl" color={textPrimary}>
                            <AnimatedCounter value={offerRange.high} prefix="$" />
                        </Text>
                    </motion.div>
                </AnimatePresence>
            </Flex>
            <Box position="relative" h="12px" mb={4}>
                <Box 
                    position="absolute" 
                    left="0" 
                    right="0" 
                    h="12px" 
                    bg="gray.200" 
                    borderRadius="full"
                />
                    <Box 
                        position="absolute" 
                        left="0" 
                        width="50%" 
                        h="12px" 
                        bg="linear-gradient(90deg, #0a3c34 0%, #b6e78d 100%)"
                        borderRadius="full"
                    />
            </Box>
        </Box>
    );
};

export default EstimatedOfferRange;