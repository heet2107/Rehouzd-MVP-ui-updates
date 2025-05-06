// Mock for react-router-dom
module.exports = {
    BrowserRouter: () => null,
    Routes: () => null,
    Route: () => null,
    useLocation: () => ({ pathname: '/' })
  };