import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Spacer,
  Button,
  Image,
  HStack,
  Link,
  Container,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  Text,
  Icon,
  useToast
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthModal from '../../auth/AuthModal';
import { FiDollarSign, FiBarChart2 } from 'react-icons/fi';
import { setUserData, clearUserData } from '../../store/userSlice';
import { removeProperty } from '../../store/propertySlice';
import { useAppDispatch } from '../../store/hooks';
import { clearAddressData } from "../../store/addressSlice";
import { IconType } from 'react-icons';

// Define icon types more explicitly
interface NavItem {
  name: string;
  icon: IconType;
  path: string;
}

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const logoPath = '/rehouzd-logo.png';
  const { isOpen, onOpen, onClose } = useDisclosure(); // For mobile drawer
  const toast = useToast();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | undefined>(undefined);

  // Navbar styles using brand colors from the theme
  const navBg = 'background.primary'; // white
  const navShadow = 'sm';
  const navTextColor = 'text.primary'; // gray.700
  const activeNavItemBg = 'tag.light'; // light green for active items
  const activeNavItemColor = 'brand.500'; // brand color

  // Menu styling
  const menuBg = 'background.primary'; // white
  const menuColor = 'text.primary'; // gray.800
  const menuHoverBg = 'background.secondary'; // gray.100
  const menuBorderColor = 'border.primary'; // gray.200

  // Check for user authentication
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedEmail = localStorage.getItem('email');
    if (storedToken && storedEmail) {
      setIsLoggedIn(true);
      setUserEmail(storedEmail);
    }
  }, []);
  
  // Check for plan selection in URL query params
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const plan = queryParams.get('plan');
    
    if (plan) {
      // If a plan is specified in the query params, open the auth modal with that plan
      if (plan === 'free') {
        onAuthOpen('Free Plan ($0/month)');
      } else if (plan === 'professional') {
        onAuthOpen('Professional Plan ($49.99/month)');
      }
      
      // Remove the query parameter to avoid reopening the modal on refresh
      navigate(location.pathname, { replace: true });
    }
  }, [location.search, navigate]);

  const onAuthOpen = (plan?: string) => {
    setSelectedPlan(plan);
    setShowForgotPassword(false);
    setIsAuthOpen(true);
  };

  const onAuthClose = () => {
    setIsAuthOpen(false);
    setShowForgotPassword(false);
    setSelectedPlan(undefined);
  };

  // Handler for login
  const handleLogin = async (email: string, password: string, rememberMe: boolean) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Login failed');
      }
      const data = await res.json();
      dispatch(
        setUserData({
          user_id: data.user.user_id,
          email: data.user.email,
          fname: data.user.fname,
          lname: data.user.lname,
          mobile: data.user.mobile,
          token: data.token,
        })
      );
      localStorage.setItem('token', data.token);
      localStorage.setItem('email', data.user.email);
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: data.user.id,
          email: data.user.email,
          fname: data.user.fname,
          lname: data.user.lname,
          mobile: data.user.mobile,
          token: data.token,
        })
      );
      setIsLoggedIn(true);
      setUserEmail(data.user.email);
      onAuthClose();
      navigate('/estimate');
    } catch (error: any) {
      throw error;
    }
  };

  // Handler for sign-up
  const handleSignUp = async (firstName: string, lastName: string, email: string, password: string, confirm: string) => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, password }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Sign-up failed');
      }
      
      // Show success toast instead of alert
      toast({
        title: "Account created!",
        description: "You've successfully signed up. Welcome to Rehouzd!",
        status: "success",
        duration: 4000,
        isClosable: true,
      });
      
      // Automatically switch to login form after successful signup
      setShowSignUp(false);
      
      // Pre-fill the login form with the email they just used to sign up
      if (document.querySelector('#login-email')) {
        (document.querySelector('#login-email') as HTMLInputElement).value = email;
      }
    } catch (error: any) {
      toast({
        title: "Sign-up failed",
        description: error.message || "An error occurred during sign-up",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      throw error;
    }
  };

  // Google login
  const handleGoogleLogin = () => {
    // Open Google login page in a new tab
    window.open('/api/auth/google', '_blank');
  };

  const handleLogout = () => {
    localStorage.clear();
    dispatch(clearUserData());
    dispatch(removeProperty(0));
    dispatch(clearAddressData());
    setIsLoggedIn(false);
    setUserEmail('');
    navigate('/');
  };

  const handleForgotPasswordSubmit = () => {
    setShowForgotPassword(false);
    toast({
      title: "Password reset email sent",
      description: "Please check your email for further instructions.",
      status: "success",
      duration: 5000,
      isClosable: true,
    });
  };

  // Check if the current route is active
  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };
  
  // Handle opening auth modal with no parameters
  const handleOpenAuthModal = () => {
    onAuthOpen();
  };

  return (
    <Box 
      as="header" 
      position="sticky" 
      top="0" 
      zIndex="1200" 
      bg="white" 
      py={4}
      width="100%"
    >
      <Container maxW="container.xl">
        <Flex align="center" justify="space-between">
          {/* Logo */}
          <Box>
            <Image
              src={logoPath}
              alt="ReHouzd Logo"
              height="60px"
              width="120px"
              cursor="pointer"
              onClick={() => navigate('/')}
            />
          </Box>
          
          <Spacer />
          
          {/* Desktop Navigation Links */}
          <HStack spacing={8} fontFamily="heading">
          {isLoggedIn && (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/estimate')}
                    fontWeight="bold"
                    fontSize="md"
                    color={isActiveRoute('/estimate') ? 'brand.500' : 'text.primary'}
                    _hover={{ color: 'brand.500' }}
                    fontFamily="heading"
                    px={4}
                  >
                    Get Estimate & Find Buyers
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/saved-estimates')}
                    fontWeight="bold"
                    fontSize="md"
                    color={isActiveRoute('/saved-estimates') ? 'brand.500' : 'text.primary'}
                    _hover={{ color: 'brand.500' }}
                    fontFamily="heading"
                    px={4}
                  >
                    Saved Estimates
                  </Button>
                </>
              )}
            <Button
              variant="ghost"
              onClick={() => navigate('/pricing')}
              fontWeight="bold"
              fontSize="md"
              color={isActiveRoute('/pricing') ? 'brand.500' : 'text.primary'}
              _hover={{ color: 'brand.500' }}
              fontFamily="heading"
              px={4}
            >
              Pricing
            </Button>
            
            {isLoggedIn ? (
              <Menu>
                <MenuButton>
                  <Avatar size="sm" name={userEmail} cursor="pointer" />
                </MenuButton>
                <MenuList bg={menuBg} color={menuColor} borderColor={menuBorderColor}>
                  <Text px={3} py={2} fontSize="sm" fontWeight="semibold" fontFamily="body">{userEmail}</Text>
                  <MenuItem
                    _hover={{ bg: menuHoverBg }}
                    onClick={() => navigate('/account')}
                    fontFamily="body"
                  >
                    Account Settings
                  </MenuItem>
                  <MenuItem
                    _hover={{ bg: menuHoverBg }}
                    onClick={handleLogout}
                    fontFamily="body"
                  >
                    Logout
                  </MenuItem>
                </MenuList>
              </Menu>
            ) : (
              <Button
                variant="ghost"
                onClick={handleOpenAuthModal}
                fontWeight="bold"
                fontSize="md"
                color="text.primary"
                colorScheme="brand"
                fontFamily="heading"
              >
                Login
              </Button>
            )}
          </HStack>
          
          {/* Mobile menu button */}
          <IconButton
            aria-label="Open menu"
            icon={<HamburgerIcon />}
            variant="ghost"
            display={{ base: 'flex', md: 'none' }}
            onClick={onOpen}
          />
        </Flex>
      </Container>
      
      {/* Mobile drawer */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="xs">
        <DrawerOverlay />
        <DrawerContent bg={menuBg}>
          <DrawerCloseButton color={menuColor} />
          <DrawerHeader borderBottomWidth="1px" borderColor={menuBorderColor}>
            <Image
              src={logoPath}
              alt="ReHouzd Logo"
              height="40px"
              width="auto"
            />
          </DrawerHeader>
          <DrawerBody>
            <VStack spacing={4} align="start" mt={4}>
              <Button
                variant="ghost"
                onClick={() => {
                  navigate('/estimate');
                  onClose();
                }}
                fontWeight="bold"
                fontSize="md"
                color={isActiveRoute('/estimate') ? 'brand.500' : 'text.primary'}
                justifyContent="flex-start"
                width="100%"
                fontFamily="heading"
              >
                Get Estimate & Find Buyers
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => {
                  navigate('/saved-estimates');
                  onClose();
                }}
                fontWeight="bold"
                fontSize="md"
                color={isActiveRoute('/saved-estimates') ? 'brand.500' : 'text.primary'}
                justifyContent="flex-start"
                width="100%"
                fontFamily="heading"
              >
                Saved Estimates
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => {
                  navigate('/pricing');
                  onClose();
                }}
                fontWeight="bold"
                fontSize="md"
                color={isActiveRoute('/pricing') ? 'brand.500' : 'text.primary'}
                justifyContent="flex-start"
                width="100%"
                fontFamily="heading"
              >
                Pricing
              </Button>
              
              {!isLoggedIn ? (
                <Button
                  variant="ghost"
                  fontWeight="bold"
                  fontSize="md"
                  color="text.primary"
                  justifyContent="flex-start"
                  width="100%"
                  fontFamily="heading"
                  onClick={() => {
                    onClose();
                    onAuthOpen();
                  }}
                >
                  Login
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  fontWeight="medium"
                  color="text.primary"
                  justifyContent="flex-start" 
                  width="100%"
                  onClick={() => {
                    onClose();
                    handleLogout();
                  }}
                >
                  Logout
                </Button>
              )}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthOpen}
        onClose={onAuthClose}
        onLogin={handleLogin}
        onSignUp={handleSignUp}
        onGoogleLogin={handleGoogleLogin}
        showForgotPassword={showForgotPassword}
        setShowForgotPassword={setShowForgotPassword}
        onForgotPasswordSubmit={handleForgotPasswordSubmit}
        showSignUp={showSignUp}
        setShowSignUp={setShowSignUp}
        planInfo={selectedPlan}
      />
    </Box>
  );
};

export default Navbar;
