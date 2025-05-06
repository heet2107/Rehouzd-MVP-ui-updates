import { Box } from '@chakra-ui/react';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';

const LandingPage = () => {
  
  const heroStyle = {
    background: 'linear-gradient(to bottom, #104911, #0a3c34)',
    minHeight: '90vh',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    paddingTop: '2rem',
    paddingBottom: '4rem',
  };

  return (
    <Box sx={heroStyle}  minH="100vh">
      <Hero />
      <br />
      <br />
      <HowItWorks />
    </Box>
  );
};

export default LandingPage; 
