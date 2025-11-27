import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import TemplateGenerator from '../components/TemplateGenerator';
import { AuthProvider } from '../contexts/AuthContext';

// Mock axios
jest.mock('axios');

// Mock the API
jest.mock('../services/api', () => ({
  ansibleRolesAPI: {
    getAll: jest.fn(() => Promise.resolve({ data: [] }))
  },
  templateAPI: {
    generate: jest.fn()
  }
}));

const MockTemplateGenerator = () => (
  <BrowserRouter>
    <AuthProvider>
      <TemplateGenerator />
    </AuthProvider>
  </BrowserRouter>
);

describe('TemplateGenerator Component', () => {
  test('renders template generator form', () => {
    render(<MockTemplateGenerator />);
    
    expect(screen.getByText(/Ansible Template Generator/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Environment/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/OS Platform/i)).toBeInTheDocument();
  });

  test('renders application details fields', () => {
    render(<MockTemplateGenerator />);
    
    expect(screen.getByLabelText(/METTA_APPLICATION/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/METTA_COMPONENT/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/SHIELD_TEAM/i)).toBeInTheDocument();
  });

  test('renders VM groups section', () => {
    render(<MockTemplateGenerator />);
    
    expect(screen.getByText(/VM Groups and Ansible Roles/i)).toBeInTheDocument();
  });

  test('renders generate button', () => {
    render(<MockTemplateGenerator />);
    
    expect(screen.getByRole('button', { name: /Generate and Download Template/i })).toBeInTheDocument();
  });
});
