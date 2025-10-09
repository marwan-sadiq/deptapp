import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import EntityCard from '../EntityCard'
import { createMockCustomer, createMockCompany, createTestQueryClient } from '../../setupTests'

// Mock the contexts
jest.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    toggleTheme: jest.fn(),
  }),
}))

jest.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    isRTL: false,
  }),
}))

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}))

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient()
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe('EntityCard', () => {
  const mockOnAdjustDebt = jest.fn()
  const mockOnDeleteEntity = jest.fn()
  const mockOnCheckCredit = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Customer Card', () => {
    const mockCustomer = createMockCustomer()

    it('renders customer information correctly', () => {
      render(
        <TestWrapper>
          <EntityCard
            entity={mockCustomer}
            onAdjustDebt={mockOnAdjustDebt}
            type="customer"
            onDeleteEntity={mockOnDeleteEntity}
            onCheckCredit={mockOnCheckCredit}
          />
        </TestWrapper>
      )

      expect(screen.getByText('Test Customer')).toBeInTheDocument()
      expect(screen.getByText('1234567890')).toBeInTheDocument()
      expect(screen.getByText('Test Address')).toBeInTheDocument()
      expect(screen.getByText('1000.000 دينار')).toBeInTheDocument()
    })

    it('shows reputation tag for customers', () => {
      render(
        <TestWrapper>
          <EntityCard
            entity={mockCustomer}
            onAdjustDebt={mockOnAdjustDebt}
            type="customer"
            onDeleteEntity={mockOnDeleteEntity}
            onCheckCredit={mockOnCheckCredit}
          />
        </TestWrapper>
      )

      // The reputation tag should be present
      expect(screen.getByText('good')).toBeInTheDocument()
    })

    it('opens debt modal when adjust debt button is clicked', () => {
      render(
        <TestWrapper>
          <EntityCard
            entity={mockCustomer}
            onAdjustDebt={mockOnAdjustDebt}
            type="customer"
            onDeleteEntity={mockOnDeleteEntity}
            onCheckCredit={mockOnCheckCredit}
          />
        </TestWrapper>
      )

      const adjustButton = screen.getByText('debt.adjustDebt')
      fireEvent.click(adjustButton)

      // Modal should open
      expect(screen.getByText('debt.manageDebt')).toBeInTheDocument()
    })

    it('shows delete confirmation when delete button is clicked', () => {
      render(
        <TestWrapper>
          <EntityCard
            entity={mockCustomer}
            onAdjustDebt={mockOnAdjustDebt}
            type="customer"
            onDeleteEntity={mockOnDeleteEntity}
            onCheckCredit={mockOnCheckCredit}
          />
        </TestWrapper>
      )

      const deleteButton = screen.getByText('buttons.delete')
      fireEvent.click(deleteButton)

      // Delete confirmation should appear
      expect(screen.getByText('buttons.delete Test Customer?')).toBeInTheDocument()
    })

    it('calls onDeleteEntity when delete is confirmed', () => {
      render(
        <TestWrapper>
          <EntityCard
            entity={mockCustomer}
            onAdjustDebt={mockOnAdjustDebt}
            type="customer"
            onDeleteEntity={mockOnDeleteEntity}
            onCheckCredit={mockOnCheckCredit}
          />
        </TestWrapper>
      )

      const deleteButton = screen.getByText('buttons.delete')
      fireEvent.click(deleteButton)

      const confirmButton = screen.getByText('buttons.delete')
      fireEvent.click(confirmButton)

      expect(mockOnDeleteEntity).toHaveBeenCalledTimes(1)
    })

    it('shows overdue warning for customers with overdue payments', () => {
      const overdueCustomer = createMockCustomer({
        earliest_due_date: '2023-01-01', // Past date
        last_payment_date: '2023-01-01', // Old payment
      })

      render(
        <TestWrapper>
          <EntityCard
            entity={overdueCustomer}
            onAdjustDebt={mockOnAdjustDebt}
            type="customer"
            onDeleteEntity={mockOnDeleteEntity}
            onCheckCredit={mockOnCheckCredit}
          />
        </TestWrapper>
      )

      // Should show locked indicator
      expect(screen.getByText('debt.locked')).toBeInTheDocument()
    })
  })

  describe('Company Card', () => {
    const mockCompany = createMockCompany()

    it('renders company information correctly', () => {
      render(
        <TestWrapper>
          <EntityCard
            entity={mockCompany}
            onAdjustDebt={mockOnAdjustDebt}
            type="company"
            onDeleteEntity={mockOnDeleteEntity}
          />
        </TestWrapper>
      )

      expect(screen.getByText('Test Company')).toBeInTheDocument()
      expect(screen.getByText('1234567890')).toBeInTheDocument()
      expect(screen.getByText('Test Address')).toBeInTheDocument()
      expect(screen.getByText('2000.000 دينار')).toBeInTheDocument()
    })

    it('does not show reputation tag for companies', () => {
      render(
        <TestWrapper>
          <EntityCard
            entity={mockCompany}
            onAdjustDebt={mockOnAdjustDebt}
            type="company"
            onDeleteEntity={mockOnDeleteEntity}
          />
        </TestWrapper>
      )

      // Reputation should not be present for companies
      expect(screen.queryByText('good')).not.toBeInTheDocument()
    })
  })

  describe('Debt Modal Integration', () => {
    const mockCustomer = createMockCustomer()

    it('calls onAdjustDebt with correct parameters when form is submitted', async () => {
      render(
        <TestWrapper>
          <EntityCard
            entity={mockCustomer}
            onAdjustDebt={mockOnAdjustDebt}
            type="customer"
            onDeleteEntity={mockOnDeleteEntity}
            onCheckCredit={mockOnCheckCredit}
          />
        </TestWrapper>
      )

      // Open modal
      const adjustButton = screen.getByText('debt.adjustDebt')
      fireEvent.click(adjustButton)

      // Click increase button
      const increaseButton = screen.getByText('debt.increase')
      fireEvent.click(increaseButton)

      // Fill form
      const amountInput = screen.getByPlaceholderText('0.00')
      fireEvent.change(amountInput, { target: { value: '100' } })

      const noteInput = screen.getByPlaceholderText('debt.reasonPlaceholder')
      fireEvent.change(noteInput, { target: { value: 'Test note' } })

      // Submit form
      const submitButton = screen.getByText('debt.increaseDebt')
      fireEvent.click(submitButton)

      expect(mockOnAdjustDebt).toHaveBeenCalledWith('100', 'Test note', true, false)
    })
  })

  describe('Error Handling', () => {
    const mockCustomer = createMockCustomer()

    it('displays debt error when provided', () => {
      render(
        <TestWrapper>
          <EntityCard
            entity={mockCustomer}
            onAdjustDebt={mockOnAdjustDebt}
            type="customer"
            onDeleteEntity={mockOnDeleteEntity}
            onCheckCredit={mockOnCheckCredit}
            debtError="Test error message"
          />
        </TestWrapper>
      )

      // Open modal to see error
      const adjustButton = screen.getByText('debt.adjustDebt')
      fireEvent.click(adjustButton)

      const increaseButton = screen.getByText('debt.increase')
      fireEvent.click(increaseButton)

      expect(screen.getByText('Test error message')).toBeInTheDocument()
    })

    it('shows loading state when isDebtLoading is true', () => {
      render(
        <TestWrapper>
          <EntityCard
            entity={mockCustomer}
            onAdjustDebt={mockOnAdjustDebt}
            type="customer"
            onDeleteEntity={mockOnDeleteEntity}
            onCheckCredit={mockOnCheckCredit}
            isDebtLoading={true}
          />
        </TestWrapper>
      )

      // Open modal
      const adjustButton = screen.getByText('debt.adjustDebt')
      fireEvent.click(adjustButton)

      const increaseButton = screen.getByText('debt.increase')
      fireEvent.click(increaseButton)

      expect(screen.getByText('buttons.processing')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    const mockCustomer = createMockCustomer()

    it('has proper ARIA labels', () => {
      render(
        <TestWrapper>
          <EntityCard
            entity={mockCustomer}
            onAdjustDebt={mockOnAdjustDebt}
            type="customer"
            onDeleteEntity={mockOnDeleteEntity}
            onCheckCredit={mockOnCheckCredit}
          />
        </TestWrapper>
      )

      const nameElement = screen.getByText('Test Customer')
      expect(nameElement).toHaveAttribute('title', 'View Test Customer profile')
    })

    it('supports keyboard navigation', () => {
      render(
        <TestWrapper>
          <EntityCard
            entity={mockCustomer}
            onAdjustDebt={mockOnAdjustDebt}
            type="customer"
            onDeleteEntity={mockOnDeleteEntity}
            onCheckCredit={mockOnCheckCredit}
          />
        </TestWrapper>
      )

      const adjustButton = screen.getByText('debt.adjustDebt')
      expect(adjustButton).toBeInTheDocument()
      
      // Button should be focusable
      adjustButton.focus()
      expect(document.activeElement).toBe(adjustButton)
    })
  })
})
