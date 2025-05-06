import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Box, Text, Slider, SliderTrack, SliderFilledTrack, SliderThumb, Flex, SimpleGrid, VStack, NumberInput, NumberInputField, HStack } from '@chakra-ui/react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { updateFlipValues, setActiveStrategy } from '../../store/underwriteSlice';

interface FlipUnderwriteSlidersProps {
  initialValues?: {
    sellingCosts?: number;
    holdingCosts?: number;
    margin?: number;
    lowRehab?: number;
    highRehab?: number;
    afterRepairValue?: number;
  };
  onSliderChange?: (key: string, value: number) => void;
  onValuesChanged?: (values: {
    sellingCosts: number;
    holdingCosts: number;
    margin: number;
    lowRehab: number;
    highRehab: number;
    afterRepairValue: number;
    estimatedOffer: number;
  }) => void;
}

const FlipUnderwriteSliders: React.FC<FlipUnderwriteSlidersProps> = ({ 
  initialValues = {}, 
  onSliderChange = () => {},
  onValuesChanged = () => {} 
}) => {
  // Get persisted values from Redux store
  const dispatch = useAppDispatch();
  const persistedValues = useAppSelector(state => state.underwrite.flip);
  
  // Use persisted values or provided initial values
  const [sellingCosts, setSellingCosts] = useState(
    initialValues.sellingCosts ?? persistedValues.sellingCosts ?? 7
  );
  const [holdingCosts, setHoldingCosts] = useState(
    initialValues.holdingCosts ?? persistedValues.holdingCosts ?? 4
  );
  const [margin, setMargin] = useState(
    initialValues.margin ?? persistedValues.margin ?? 20
  );
  const [lowRehab, setLowRehab] = useState(
    initialValues.lowRehab ?? persistedValues.lowRehab ?? 30
  );
  const [highRehab, setHighRehab] = useState(
    initialValues.highRehab ?? persistedValues.highRehab ?? 40
  );
  // Use the afterRepairValue from initialValues (from backend) or from Redux
  const [afterRepairValue, setAfterRepairValue] = useState(
    initialValues.afterRepairValue ?? persistedValues.afterRepairValue ?? 250000
  );

  // Add temporary input states to handle partial typing
  const [sellingCostsInput, setSellingCostsInput] = useState(sellingCosts.toString());
  const [holdingCostsInput, setHoldingCostsInput] = useState(holdingCosts.toString());
  const [marginInput, setMarginInput] = useState(margin.toString());
  const [lowRehabInput, setLowRehabInput] = useState(lowRehab.toString());
  const [highRehabInput, setHighRehabInput] = useState(highRehab.toString());

  // Update input states when main values change
  useEffect(() => {
    setSellingCostsInput(sellingCosts.toString());
    setHoldingCostsInput(holdingCosts.toString());
    setMarginInput(margin.toString());
    setLowRehabInput(lowRehab.toString());
    setHighRehabInput(highRehab.toString());
  }, [sellingCosts, holdingCosts, margin, lowRehab, highRehab]);

  // Dynamic min/max ranges based on initial values
  const [sellingCostsRange, setSellingCostsRange] = useState({ 
    min: Math.max(0, sellingCosts - 2), 
    max: sellingCosts + 2 
  });
  
  const [holdingCostsRange, setHoldingCostsRange] = useState({ 
    min: Math.max(0, holdingCosts - 2), 
    max: holdingCosts + 2 
  });
  
  const [marginRange, setMarginRange] = useState({ 
    min: Math.max(0, margin - 5), 
    max: margin + 5 
  });
  
  const [lowRehabRange, setLowRehabRange] = useState({ min: Math.max(0, lowRehab - 10000), max: lowRehab + 10000 });
  const [highRehabRange, setHighRehabRange] = useState({ min: Math.max(0, highRehab - 10000), max: highRehab + 10000 });

  // Use a ref to track if we're in the middle of an update
  const isUpdatingRef = useRef(false);
  
  // Use a ref to store previous values for comparison
  const prevValuesRef = useRef({
    sellingCosts,
    holdingCosts,
    margin,
    lowRehab,
    highRehab,
    afterRepairValue,
    estimatedOffer: 0
  });

  // Add debounce timeout refs for number inputs
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Set the active strategy when this component mounts
  useEffect(() => {
    dispatch(setActiveStrategy('flip'));
  }, [dispatch]);

  // Update state when initialValues change
  useEffect(() => {
    // Skip if we're updating internally
    if (isUpdatingRef.current) return;
    
    // Only update if initialValues are explicitly provided
    if (initialValues.sellingCosts !== undefined) {
      setSellingCosts(initialValues.sellingCosts);
      setSellingCostsRange({ 
        min: Math.max(0, initialValues.sellingCosts - 2), 
        max: initialValues.sellingCosts + 2 
      });
    }
    if (initialValues.holdingCosts !== undefined) {
      setHoldingCosts(initialValues.holdingCosts);
      setHoldingCostsRange({ 
        min: Math.max(0, initialValues.holdingCosts - 2), 
        max: initialValues.holdingCosts + 2 
      });
    }
    if (initialValues.margin !== undefined) {
      setMargin(initialValues.margin);
      setMarginRange({ 
        min: Math.max(0, initialValues.margin - 5), 
        max: initialValues.margin + 5 
      });
    }
    if (initialValues.lowRehab !== undefined) 
      {
        setLowRehab(initialValues.lowRehab);
        setLowRehabRange({ min: Math.max(0, initialValues.lowRehab - 10000), max: initialValues.lowRehab + 10000 });
      }
    if (initialValues.highRehab !== undefined) 
      {
        setHighRehab(initialValues.highRehab);
        setHighRehabRange({ min: Math.max(0, initialValues.highRehab - 10000), max: initialValues.highRehab + 10000 });
      }
    if (initialValues.afterRepairValue !== undefined) {
      setAfterRepairValue(initialValues.afterRepairValue);
    }
  }, [initialValues]);

  // Calculate estimated offer based on current values
  const calculateEstimatedOffer = useCallback(() => {
    
    // Convert percentages to actual amounts
    const sellingCostsAmount = (afterRepairValue * sellingCosts) / 100;
    const holdingCostsAmount = (afterRepairValue * holdingCosts) / 100;
    const marginAmount = (afterRepairValue * margin) / 100;
    
    // Use low rehab for the better/higher offer
    const totalCosts = afterRepairValue - sellingCostsAmount - holdingCostsAmount - marginAmount;
    
   return totalCosts;
  }, [afterRepairValue, sellingCosts, holdingCosts, margin, lowRehab]);

  // Add useMemo to calculate estimated offer whenever relevant values change
  const estimatedOffer = useMemo(() => {
    return calculateEstimatedOffer();
  }, [calculateEstimatedOffer]);

  // Memoize the function that updates Redux and calls onValuesChanged
  const updateValues = useCallback(() => {
    const currentValues = {
      sellingCosts,
      holdingCosts,
      margin,
      lowRehab,
      highRehab,
      afterRepairValue,
      estimatedOffer
    };
    
    // Only update if values have actually changed
    const prevValues = prevValuesRef.current;
    
    if (
      prevValues.sellingCosts !== currentValues.sellingCosts ||
      prevValues.holdingCosts !== currentValues.holdingCosts ||
      prevValues.margin !== currentValues.margin ||
      prevValues.lowRehab !== currentValues.lowRehab ||
      prevValues.highRehab !== currentValues.highRehab ||
      prevValues.afterRepairValue !== currentValues.afterRepairValue ||
      prevValues.estimatedOffer !== currentValues.estimatedOffer
    ) {
      // Update the previous values ref
      prevValuesRef.current = { ...currentValues };
      
      // Update Redux store
      dispatch(updateFlipValues(currentValues));
      
      // Set flag to prevent reacting to the initialValues change
      isUpdatingRef.current = true;
      onValuesChanged(currentValues);
      
      // Reset flag after a timeout
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    }
  }, [sellingCosts, holdingCosts, margin, lowRehab, highRehab, afterRepairValue, estimatedOffer, dispatch, onValuesChanged]);

  // Call updateValues when values change, but use a debounce approach
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateValues();
    }, 100); // Small delay to batch rapid changes
    
    return () => clearTimeout(timeoutId);
  }, [updateValues]);

  // Handle slider change and call parent callback
  const handleSliderChange = (key: string, value: number) => {
    switch(key) {
      case 'sellingCosts':
        setSellingCosts(value);
        break;
      case 'holdingCosts':
        setHoldingCosts(value);
        break;
      case 'margin':
        setMargin(value);
        break;
      case 'lowRehab':
        setLowRehab(value);
        break;
      case 'highRehab':
        setHighRehab(value);
        break;
    }
    onSliderChange(key, value);
  };

  // Handle input change without immediately updating state
  const handleInputChange = (key: string, value: string) => {
    switch(key) {
      case 'sellingCosts':
        setSellingCostsInput(value);
        break;
      case 'holdingCosts':
        setHoldingCostsInput(value);
        break;
      case 'margin':
        setMarginInput(value);
        break;
      case 'lowRehab':
        setLowRehabInput(value);
        break;
      case 'highRehab':
        setHighRehabInput(value);
        break;
    }
  };

  // Handle direct number input change on blur or enter
  const handleNumberChange = (key: string, valueAsString: string, valueAsNumber: number) => {
    // Clear any existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Set a timeout to update the value after user stops typing
    debounceTimeoutRef.current = setTimeout(() => {
      let value = valueAsNumber;
      
      // Handle min/max constraints
      switch(key) {
        case 'sellingCosts':
          value = Math.max(sellingCostsRange.min, Math.min(sellingCostsRange.max, value));
          setSellingCosts(value);
          break;
        case 'holdingCosts':
          value = Math.max(holdingCostsRange.min, Math.min(holdingCostsRange.max, value));
          setHoldingCosts(value);
          break;
        case 'margin':
          value = Math.max(marginRange.min, Math.min(marginRange.max, value));
          setMargin(value);
          break;
        case 'lowRehab':
          value = Math.max(lowRehabRange.min, Math.min(lowRehabRange.max, value));
          setLowRehab(value);
          break;
        case 'highRehab':
          value = Math.max(highRehabRange.min, Math.min(highRehabRange.max, value));
          setHighRehab(value);
          break;
      }
      
      // Call the same callback as the slider
      onSliderChange(key, value);
      
      // Clear the timeout ref
      debounceTimeoutRef.current = null;
    }, 800); // 800ms delay before applying the change
  };

  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <Box py={6} px={8} bg="gray.50" borderRadius="lg">
      {/* Horizontal layout for sliders */}
      <SimpleGrid columns={{base: 2, md: 5}} spacing={4} mb={8}>
        {/* Selling Costs Slider */}
        <Box bg="white" p={4} borderRadius="md" shadow="sm">
          <VStack align="center" spacing={2}>
            <Text fontWeight="semibold" fontSize="md" color="gray.700" mt={3}>Selling Costs</Text>
            <HStack width="100%" justify="center" mb={5}>
              <NumberInput 
                value={sellingCostsInput}
                min={sellingCostsRange.min}
                max={sellingCostsRange.max}
                step={0.1}
                precision={1}
                onChange={(valueString) => {
                  handleInputChange('sellingCosts', valueString);
                  handleNumberChange('sellingCosts', valueString, parseFloat(valueString) || 0);
                }}
                size="sm"
                maxW="120px"
                borderRadius="md"
                keepWithinRange={false}
              >
                <NumberInputField fontWeight="bold" fontSize={"lg"} />
              </NumberInput>
              <Text>%</Text>
            </HStack>
            <Slider 
              min={sellingCostsRange.min} 
              max={sellingCostsRange.max} 
              step={0.1} 
              value={sellingCosts} 
              onChange={(val) => handleSliderChange('sellingCosts', val)}
              aria-label="Selling Costs"
              colorScheme="green"
            >
              <SliderTrack h="3px">
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb boxSize={4} />
            </Slider>
          </VStack>
        </Box>

        {/* Holding Costs Slider */}
        <Box bg="white" p={4} borderRadius="md" shadow="sm">
          <VStack align="center" spacing={2}>
            <Text fontWeight="semibold" fontSize="sm" color="gray.700" mt={3}>Holding Costs</Text>
            <HStack width="100%" justify="center" mb={5}>
              <NumberInput 
                value={holdingCostsInput}
                min={holdingCostsRange.min}
                max={holdingCostsRange.max}
                step={0.1}
                precision={1}
                onChange={(valueString) => {
                  handleInputChange('holdingCosts', valueString);
                  handleNumberChange('holdingCosts', valueString, parseFloat(valueString) || 0);
                }}
                size="sm"
                maxW="120px"
                borderRadius="md"
                keepWithinRange={false}
              >
                <NumberInputField fontWeight="bold" fontSize={"lg"} />
              </NumberInput>
              <Text>%</Text>
            </HStack>
            <Slider 
              min={holdingCostsRange.min} 
              max={holdingCostsRange.max} 
              step={0.1} 
              value={holdingCosts} 
              onChange={(val) => handleSliderChange('holdingCosts', val)}
              aria-label="Holding Costs"
              colorScheme="green"
            >
              <SliderTrack h="3px">
                <SliderFilledTrack />
              </SliderTrack>
                <SliderThumb boxSize={4} />
            </Slider>
          </VStack>
        </Box>

        {/* Margin Slider */}
        <Box bg="white" p={4} borderRadius="md" shadow="sm">
          <VStack align="center" spacing={2}>
            <Text fontWeight="semibold" fontSize="md" color="gray.700" mt={3}>Margin</Text>
            <HStack width="100%" justify="center" mb={5}>
              <NumberInput 
                value={marginInput}
                min={marginRange.min}
                max={marginRange.max}
                step={0.1}
                precision={1}
                onChange={(valueString) => {
                  handleInputChange('margin', valueString);
                  handleNumberChange('margin', valueString, parseFloat(valueString) || 0);
                }}
                size="sm"
                maxW="120px"
                borderRadius="md"
                keepWithinRange={false}
              >
                <NumberInputField fontWeight="bold" fontSize={"lg"} />
              </NumberInput>
              <Text>%</Text>
            </HStack>
            <Slider 
              min={marginRange.min} 
              max={marginRange.max} 
              step={0.1} 
              value={margin} 
              onChange={(val) => handleSliderChange('margin', val)}
              aria-label="Margin"
              colorScheme="green"
            >
              <SliderTrack h="3px">
                <SliderFilledTrack />
              </SliderTrack>
                <SliderThumb boxSize={4} />
            </Slider>
          </VStack>
        </Box>

        {/* Low Rehab Slider */}
        <Box bg="white" p={4} borderRadius="md" shadow="sm">
          <VStack align="center" spacing={2}>
            <Text fontWeight="semibold" fontSize="md" color="gray.700" mt={3}>Low Rehab</Text>
            {/* <Text as="sub" fontSize="md" color="gray.500" mb={2}></Text> */}
            <HStack width="100%" justify="center" mb={5}>
            <Text fontWeight="bold">$</Text>
              <NumberInput 
                value={lowRehabInput}
                min={lowRehabRange.min}
                max={lowRehabRange.max}
                step={5}
                onChange={(valueString) => {
                  handleInputChange('lowRehab', valueString);
                  handleNumberChange('lowRehab', valueString, parseFloat(valueString) || 0);
                }}
                size="sm"
                maxW="120px"
                borderRadius="md"
                keepWithinRange={false}
              >
                <NumberInputField fontWeight="bold" fontSize={"lg"} />
              </NumberInput>
            </HStack>
            <Slider 
              min={lowRehabRange.min} 
              max={lowRehabRange.max} 
              step={5} 
              value={lowRehab} 
              onChange={(val) => handleSliderChange('lowRehab', val)}
              aria-label="Low Rehab"
              colorScheme="green"
            >
              <SliderTrack h="3px">
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb boxSize={4} />
            </Slider>
          </VStack>
        </Box>

        {/* High Rehab Slider */}
        <Box bg="white" p={4} borderRadius="md" shadow="sm">
          <VStack align="center" spacing={2}>
            <Text fontWeight="semibold" fontSize="md" color="gray.700" mt={3}>High Rehab</Text>
            {/* <Text as="sub" fontSize="md" color="gray.500" mb={2}>Rehab</Text> */}
            <HStack width="100%" justify="center" mb={5}>
            <Text fontWeight="bold">$</Text>
              <NumberInput 
                value={highRehabInput}
                min={highRehabRange.min}
                max={highRehabRange.max}
                step={10}
                onChange={(valueString) => {
                  handleInputChange('highRehab', valueString);
                  handleNumberChange('highRehab', valueString, parseFloat(valueString) || 0);
                }}
                size="sm"
                maxW="120px"
                borderRadius="md"
                keepWithinRange={false}
              >
                <NumberInputField fontWeight="bold" fontSize={"lg"} />
              </NumberInput>
            </HStack>
            <Slider 
              min={highRehabRange.min} 
              max={highRehabRange.max} 
              step={10} 
              value={highRehab} 
              onChange={(val) => handleSliderChange('highRehab', val)}
              aria-label="High Rehab"
              colorScheme="green"
            >
              <SliderTrack h="3px">
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb boxSize={4} />
            </Slider>
          </VStack>
        </Box>
      </SimpleGrid>

      {/* After Repair Value and Estimated Offer */}
      <Flex justifyContent="flex-end" pt={6} mt={4} borderTopWidth="1px" borderColor="gray.200">
        <VStack align="flex-end" spacing={3}>
          <Text fontSize="sm" color="gray.500">Based on comparable sold properties</Text>
          <Flex>
            <Text fontWeight="semibold" fontSize="xl" color="gray.700" mr={2}>After Repair Value: </Text>
            <Text fontWeight="bold" fontSize="xl" color="red.600">{formatCurrency(afterRepairValue)}</Text>
          </Flex>
        </VStack>
      </Flex>
    </Box>
  );
};

export default FlipUnderwriteSliders;
