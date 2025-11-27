import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';
import { AuthProvider } from '../contexts/AuthContext';

// Mock components
jest.mock('../components/Login', () => () => <div>Login Component</div>);
jest.mock('../components/TemplateGenerator', () => () => <div>Template Generator</div>);
jest.mock('../components/AdminPanel', () => () => <div>Admin Panel</div>);

const MockApp = () => (
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);

describe('App Component', () => {
  test('renders without crashing', () => {
    render(<MockApp />);
  });
});
