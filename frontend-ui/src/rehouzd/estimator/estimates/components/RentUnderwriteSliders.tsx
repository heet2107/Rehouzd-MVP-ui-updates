import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Box, Text, Slider, SliderTrack, SliderFilledTrack, SliderThumb, Flex, SimpleGrid, VStack, NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper, HStack } from '@chakra-ui/react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { updateRentValues, setActiveStrategy } from '../../store/underwriteSlice';
import { motion, AnimatePresence } from 'framer-motion';

interface RentUnderwriteSlidersProps {
  initialValues?: {
    rent?: number;
    expense?: number;
    capRate?: number;
    lowRehab?: number;
    highRehab?: number;
  };
  onSliderChange?: (key: string, value: number) => void;
  onValuesChanged?: (values: {
    rent: number;
    expense: number;
    capRate: number;
    lowRehab: number;
    highRehab: number;
  }) => void;
}

const RentUnderwriteSliders: React.FC<RentUnderwriteSlidersProps> = ({ 
  initialValues = {}, 
  onSliderChange = () => {},
  onValuesChanged = () => {}
}) => {
  // Get persisted values from Redux store
  const dispatch = useAppDispatch();
  const persistedValues = useAppSelector(state => state.underwrite.rent);
  
  // Use persisted values or provided initial values
  const [rent, setRent] = useState(
    initialValues.rent ?? persistedValues.rent ?? 1000
  );
  const [expense, setExpense] = useState(
    initialValues.expense ?? persistedValues.expense ?? 35
  );
  const [capRate, setCapRate] = useState(
    initialValues.capRate ?? persistedValues.capRate ?? 6.5
  );
  const [lowRehab, setLowRehab] = useState(
    initialValues.lowRehab ?? persistedValues.lowRehab ?? 30
  );
  const [highRehab, setHighRehab] = useState(
    initialValues.highRehab ?? persistedValues.highRehab ?? 40
  );
  
  // Add temporary input states to handle partial typing
  const [rentInput, setRentInput] = useState(rent.toString());
  const [expenseInput, setExpenseInput] = useState(expense.toString());
  const [capRateInput, setCapRateInput] = useState(capRate.toString());
  const [lowRehabInput, setLowRehabInput] = useState(lowRehab.toString());
  const [highRehabInput, setHighRehabInput] = useState(highRehab.toString());
  
  // Add debounce timeout ref for number inputs
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Dynamic min/max ranges based on initial values
  const [rentRange, setRentRange] = useState({ min: Math.max(0, rent - 500), max: rent + 500 });
  const [expenseRange, setExpenseRange] = useState({ min: Math.max(0, expense - 30), max: expense + 30 });
  const [capRateRange, setCapRateRange] = useState({ min: Math.max(0, capRate - 3), max: capRate + 3 });
  const [lowRehabRange, setLowRehabRange] = useState({ min: Math.max(0, lowRehab - 10000), max: lowRehab + 10000 });
  const [highRehabRange, setHighRehabRange] = useState({ min: Math.max(0, highRehab - 10000), max: highRehab + 10000 });
  
  // Use a ref to track if we're in the middle of an update
  const isUpdatingRef = useRef(false);
  
  // Use a ref to store previous values for comparison
  const prevValuesRef = useRef({
    rent,
    expense,
    capRate,
    lowRehab,
    highRehab,
    afterRepairValue: 0
  });

  // Set the active strategy when this component mounts
  useEffect(() => {
    dispatch(setActiveStrategy('rent'));
  }, [dispatch]);

  // Update state when initialValues change but only if not from internal updates
  useEffect(() => {
    if (isUpdatingRef.current) return;
    
    if (initialValues.rent !== undefined) {
      setRent(initialValues.rent);
      setRentRange({ min: Math.max(0, initialValues.rent - 500), max: initialValues.rent + 500 });
    }
    if (initialValues.expense !== undefined) {
      setExpense(initialValues.expense);
      setExpenseRange({ min: Math.max(0, initialValues.expense - 30), max: initialValues.expense + 30 });
    }
    if (initialValues.capRate !== undefined) {
      setCapRate(initialValues.capRate);
      setCapRateRange({ min: Math.max(0, initialValues.capRate - 3), max: initialValues.capRate + 3 });
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
  }, [initialValues]);

  // Update input states when main values change
  useEffect(() => {
    setRentInput(rent.toString());
    setExpenseInput(expense.toString());
    setCapRateInput(capRate.toString());
    setLowRehabInput(lowRehab.toString());
    setHighRehabInput(highRehab.toString());
  }, [rent, expense, capRate, lowRehab, highRehab]);

  // Calculate ARV dynamically based on slider values
  const afterRepairValue = useMemo(() => {
    const annualRent = rent * 12;
    const operatingExpense = (annualRent * (expense / 100));
    const netOperatingIncome = annualRent - operatingExpense;
    const arv = netOperatingIncome / (capRate / 100);
    return arv;
  }, [rent, capRate, expense]);

  // Update Redux store with calculated ARV when it changes
  useEffect(() => {
    if (!isUpdatingRef.current) {
      const currentValues = {
        rent,
        expense,
        capRate,
        lowRehab,
        highRehab,
        afterRepairValue
      };
      
      dispatch(updateRentValues(currentValues));
    }
  }, [afterRepairValue, dispatch, rent, expense, capRate, lowRehab, highRehab]);

  // Memoize the function that updates Redux and calls onValuesChanged
  const updateValues = useCallback(() => {
    const currentValues = {
      rent,
      expense,
      capRate,
      lowRehab,
      highRehab,
      afterRepairValue
    };
    
    // Only update if values have actually changed
    const prevValues = prevValuesRef.current;
    
    if (
      prevValues.rent !== currentValues.rent ||
      prevValues.expense !== currentValues.expense ||
      prevValues.capRate !== currentValues.capRate ||
      prevValues.lowRehab !== currentValues.lowRehab ||
      prevValues.highRehab !== currentValues.highRehab
    ) {
      // Update the previous values ref
      prevValuesRef.current = { ...currentValues, afterRepairValue };
      
      // Update Redux store
      dispatch(updateRentValues(currentValues));
      
      // Set flag to prevent reacting to the initialValues change
      isUpdatingRef.current = true;
      onValuesChanged(currentValues);
      
      // Reset flag after a timeout
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    }
  }, [rent, expense, capRate, lowRehab, highRehab, afterRepairValue, dispatch, onValuesChanged]);

  // Call updateValues when values change, but use a debounce approach
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateValues();
    }, 100); // Small delay to batch rapid changes
    
    return () => clearTimeout(timeoutId);
  }, [updateValues]);

  // Handle input change without immediately updating state
  const handleInputChange = (key: string, value: string) => {
    switch(key) {
      case 'rent':
        setRentInput(value);
        break;
      case 'expense':
        setExpenseInput(value);
        break;
      case 'capRate':
        setCapRateInput(value);
        break;
      case 'lowRehab':
        setLowRehabInput(value);
        break;
      case 'highRehab':
        setHighRehabInput(value);
        break;
    }
  };

  // Handle direct number input change
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
        case 'rent':
          value = Math.max(rentRange.min, Math.min(rentRange.max, value));
          setRent(value);
          break;
        case 'expense':
          value = Math.max(expenseRange.min, Math.min(expenseRange.max, value));
          setExpense(value);
          break;
        case 'capRate':
          value = Math.max(capRateRange.min, Math.min(capRateRange.max, value));
          setCapRate(value);
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

  // Handle slider change and call parent callback
  const handleSliderChange = (key: string, value: number) => {
    switch(key) {
      case 'rent':
        setRent(value);
        break;
      case 'expense':
        setExpense(value);
        break;
      case 'capRate':
        setCapRate(value);
        break;
      case 'lowRehab':
        setLowRehab(value);
        break;
      case 'highRehab':
        setHighRehab(value);
        break;
    }
    
    // Individual slider change callback
    onSliderChange(key, value);
  };

  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatExpense = (expense: number, rent: number) => {
    return ((rent / expense) * 100).toFixed(0);
  };

  return (
    <>
    <Box py={6} px={8} bg="gray.50" borderRadius="lg">
      {/* Horizontal layout for sliders */}
      <SimpleGrid columns={{base: 2, md: 5}} spacing={4} mb={8}>
        {/* Rent Slider */}
        <Box bg="white" p={4} borderRadius="md" shadow="sm">
          <VStack align="center" spacing={2}>
            <Text fontWeight="semibold" fontSize="lg" color="gray.700">Rent</Text>
            <HStack width="100%" justify="center" mb={5}>
            <Text fontWeight={"bold"}>$</Text>
              <NumberInput 
                value={rentInput}
                min={rentRange.min}
                max={rentRange.max}
                step={5}
                onChange={(valueString) => {
                  handleInputChange('rent', valueString);
                  handleNumberChange('rent', valueString, parseFloat(valueString) || 0);
                }}
                size="sm"
                maxW="120px"
                mx="auto"
                keepWithinRange={false}
                borderRadius="md"
              >
                <NumberInputField fontWeight="bold" fontSize={"lg"}/>
              </NumberInput>
            </HStack>
            <Slider 
              min={rentRange.min} 
              max={rentRange.max} 
              step={5} 
              value={rent} 
              onChange={(val) => handleSliderChange('rent', val)}
              aria-label="Rent"
              colorScheme="green"
            >
              <SliderTrack h="3px">
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb boxSize={4} />
            </Slider>
          </VStack>
        </Box>

        {/* Expense Slider */}
        <Box bg="white" p={4} borderRadius="md" shadow="sm">
          <VStack align="center" spacing={2}>
            <Text fontWeight="semibold" fontSize="lg" color="gray.700">Expense</Text>
              <HStack width="100%" justify="center" mb={5}>
              <NumberInput 
                value={expenseInput}
                min={expenseRange.min}
                max={expenseRange.max}
                step={1}
                onChange={(valueString) => {
                  handleInputChange('expense', valueString);
                  handleNumberChange('expense', valueString, parseFloat(valueString) || 0);
                }}
                size="sm"
                maxW="120px"
                fontWeight={"bold"}
                fontFamily={"text.primary"}
                keepWithinRange={false}
                borderRadius="md"
              >
                <NumberInputField fontWeight="bold" fontSize={"lg"} />
              </NumberInput>
              <Text fontWeight={"bold"}>%</Text>
            </HStack>
            <Slider 
              min={expenseRange.min} 
              max={expenseRange.max} 
              step={1} 
              value={expense} 
              onChange={(val) => handleSliderChange('expense', val)}
              aria-label="Expense"
              colorScheme="green"
            >
              <SliderTrack h="3px">
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb boxSize={4} />
            </Slider>
          </VStack>
        </Box>

        {/* Cap Rate Slider */}
        <Box bg="white" p={4} borderRadius="md" shadow="sm">
          <VStack align="center" spacing={2}>
            <Text fontWeight="semibold" fontSize="lg" color="gray.700">Cap Rate</Text>
            <HStack width="100%" justify="center" mb={5}>
            <Text fontWeight={"bold"} fontFamily={"text.primary"}>$</Text>
              <NumberInput 
                value={capRateInput}
                min={capRateRange.min}
                max={capRateRange.max}
                step={0.5}
                precision={1}
                onChange={(valueString) => {
                  handleInputChange('capRate', valueString);
                  handleNumberChange('capRate', valueString, parseFloat(valueString) || 0);
                }}
                size="sm"
                maxW="120px"
                mx="auto"
                keepWithinRange={false}
                borderRadius="md"
              >
                <NumberInputField fontWeight="bold" fontSize={"lg"} />
              </NumberInput>
              <Text fontWeight={"bold"}>%</Text>
            </HStack>
            <Slider 
              min={capRateRange.min} 
              max={capRateRange.max} 
              step={0.5} 
              value={capRate} 
              onChange={(val) => handleSliderChange('capRate', val)}
              aria-label="Cap Rate"
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
            <Text fontWeight="semibold" fontSize="lg" color="gray.700">Low Rehab</Text>
            {/* <Text as="sub" fontSize="md" color="gray.500" mb={2}></Text> */}
            <HStack width="100%" justify="center" mb={5}>
            <Text fontWeight={"bold"}>$</Text>
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
                mx="auto"
                keepWithinRange={false}
                borderRadius="md"
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
            <Text fontWeight="semibold" fontSize="lg" color="gray.700">High Rehab</Text>
            {/* <Text as="sub" fontSize="md" color="gray.500" mb={2}></Text> */}
            <HStack width="100%" justify="center" mb={5}>
            <Text fontWeight={"bold"}>$</Text>
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
                mx="auto"
                keepWithinRange={false}
                borderRadius="md"
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

      {/* After Repair Value */}
      <Flex justifyContent="flex-end" pt={6} mt={4} borderTopWidth="1px" borderColor="gray.200">
        <Text fontWeight="semibold" fontSize="xl" color="gray.700" mr={2}>After Repair Value: </Text>
        <AnimatePresence mode="wait">
          <motion.div
            key={afterRepairValue}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Text fontWeight="bold" fontSize="xl" color="red.600">{formatCurrency(afterRepairValue)}</Text>
          </motion.div>
        </AnimatePresence>
      </Flex>
    </Box>
    </>
  );
};

export default RentUnderwriteSliders;
