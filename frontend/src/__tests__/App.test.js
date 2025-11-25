import { render } from '@testing-library/react';
import App from '../App';

// Mock components
jest.mock('../components/Login', () => () => <div>Login Component</div>);
jest.mock('../components/TemplateGenerator', () => () => <div>Template Generator</div>);
jest.mock('../components/AdminPanel', () => () => <div>Admin Panel</div>);

describe('App Component', () => {
  test('renders without crashing', () => {
    render(<App />);
  });
});
