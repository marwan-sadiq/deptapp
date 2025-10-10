import React, { createContext, useContext, useState, useEffect } from 'react'
import kuTranslations from '../locales/ku.json'
import trTranslations from '../locales/tr.json'
import arTranslations from '../locales/ar.json'

type Language = 'en' | 'ku' | 'tr' | 'ar'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
  isRTL: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

interface LanguageProviderProps {
  children: React.ReactNode
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('shop-app-language')
    return (saved as Language) || 'en'
  })

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('shop-app-language', lang)
  }

  const isRTL = language === 'ku' || language === 'ar'

  const t = (key: string): string => {
    if (language === 'en') {
      // English translations as nested object
      const enTranslations = {
        app: {
          title: 'Shop Manager',
          subtitle: 'Track debts and manage relationships'
        },
        navigation: {
          dashboard: 'Dashboard',
          customers: 'Customers',
          companies: 'Companies',
          payments: 'Company Payments',
          history: 'History'
        },
        dashboard: {
          customerDebt: 'Customer Debt',
          companyDebt: 'Company Debt',
          totalAccounts: 'Total Accounts',
          withDebt: 'with debt',
          topCustomerDebts: 'Top Customer Debts',
          topCompanyDebts: 'Top Company Debts'
        },
        shopMoney: {
          title: 'Shop Money',
          subtitle: 'Current shop amount',
          currentAmount: 'Current Amount',
          setAmount: 'Set Amount',
          edit: 'Edit',
          cancel: 'Cancel',
          save: 'Save'
        },
        customer: {
          title: 'Customers',
          addCustomer: 'Add Customer',
          customerProfile: 'Customer Profile',
          customerHistory: 'Customer History',
          name: 'Name',
          phone: 'Phone',
          address: 'Address',
          currentDebt: 'Current Debt',
          totalPaid: 'Total Paid',
          activeDebts: 'Active Debts',
          overdue: 'Overdue',
          dueSoon: 'Due Soon',
          noDebt: 'No Debt',
          daysLeft: 'days left',
          daysOverdue: 'days overdue',
          created: 'Created',
          lastPayment: 'Last Payment',
          paidInLast30Days: 'Paid in last 30 days',
          profileHistory: 'Customer Profile & History',
          paymentHistory: 'Payment History',
          customerPaymentHistory: 'Customer Payment History',
          transactions: 'transactions',
          printHistory: 'Print History',
          debtHistory: 'Debt History',
          noDebtHistory: 'No debt history yet',
          reputation: 'Reputation',
          never: 'Never'
        },
        company: {
          title: 'Companies',
          addCompany: 'Add Company',
          companyProfile: 'Company Profile',
          companyHistory: 'Company History',
          profileHistory: 'Company Profile & History',
          paymentHistory: 'Payment History',
          companyPaymentHistory: 'Company Payment History',
          transactions: 'transactions',
          printHistory: 'Print History',
          debtHistory: 'Debt History',
          noDebtHistory: 'No debt history yet',
          name: 'Company Name',
          phone: 'Phone',
          address: 'Address',
          created: 'Created',
          earliestDueDate: 'Earliest Due Date',
          noDueDate: 'No due date'
        },
        debt: {
          manageDebt: 'Manage Debt',
          adjustDebt: 'Adjust Debt',
          increase: 'Increase',
          decrease: 'Decrease',
          amount: 'Amount',
          note: 'Note',
          dueDate: 'Due Date',
          daysToPay: 'Days to Pay',
          whatToDo: 'What to do?',
          addToDebt: 'Add to Debt',
          reduceDebt: 'Reduce Debt',
          amountToAdd: 'Amount to Add',
          amountToSubtract: 'Amount to Subtract',
          reasonForAdjustment: 'Reason for adjustment...',
          back: 'Back',
          increaseDebt: 'Increase Debt',
          decreaseDebt: 'Decrease Debt',
          processing: 'Processing...',
          cannotIncreaseDebt: 'Cannot increase debt',
          managerCanOverride: 'Manager can override this limit',
          overrideAndContinue: 'Override and Continue',
          overrideMode: 'Override Mode',
          creditControlOverridden: 'Credit control overridden by manager',
          checking: 'Checking...',
          verifyingCredit: 'Verifying credit...',
          increasing: 'Increasing',
          decreasing: 'Decreasing',
          debt: 'debt',
          amountTo: 'Amount to',
          add: 'add',
          subtract: 'subtract',
          noteOptional: 'Note (optional)',
          reasonPlaceholder: 'Reason for adjustment...',
          overrideIncrease: 'Override & Increase Debt',
          cannotIncrease: 'Cannot Increase Debt',
          managerOverride: 'Manager can override this restriction if needed.',
          overrideContinue: 'Override & Continue',
          creditOverride: 'Credit control has been overridden by manager',
          locked: 'Locked',
          addDebt: 'Add Debt',
          debtAdded: 'Debt Added',
          paymentMade: 'Payment Made',
          noDescription: 'No description',
          due: 'Due'
        },
        history: {
          title: 'Activity History',
          noActivity: 'No activity yet'
        },
        payment: {
          title: 'Company Payment Planner',
          subtitle: 'Plan daily payments to companies based on shop money and priority',
          generateSchedule: 'Generate Schedule',
          hideGenerator: 'Hide Generator',
          shopMoney: 'Shop Money',
          safetyMargin: 'Safety Margin',
          maxDailyPayment: 'Max Daily Payment',
          dateRange: 'Date Range',
          startDate: 'Start Date',
          endDate: 'End Date',
          totalCompanyDebt: 'Total Company Debt',
          availableMoney: 'Available Money',
          dailyBudget: 'Daily Budget',
          safetyMarginPercent: 'Safety Margin (%)',
          generatedSchedule: 'Generated Payment Schedule',
          existingSchedules: 'Existing Payment Schedules',
          total: 'Total',
          priority: 'Priority',
          urgent: 'Urgent',
          high: 'High',
          normal: 'Normal',
          paid: 'Paid',
          markAsPaid: 'Mark as Paid',
          confirmPayment: 'Confirm Payment',
          actualAmount: 'Actual Amount',
          scheduledAmount: 'Scheduled Amount',
          savePayment: 'Save Payment'
        },
        filters: {
          title: 'Filters',
          debtRange: 'Debt Range',
          allDebts: 'All Debts',
          noDebt: 'No Debt',
          low: 'Low (0-1,000 IQD)',
          medium: 'Medium (1,000-5,000 IQD)',
          high: 'High (5,000+ IQD)',
          reputation: 'Reputation',
          allReputations: 'All Reputations',
          excellent: 'Excellent',
          good: 'Good',
          fair: 'Fair',
          poor: 'Poor',
          bad: 'Bad',
          paymentStatus: 'Payment Status',
          allStatus: 'All Status',
          paidRecently: 'Paid Recently (30 days)',
          overdue: 'Overdue',
          noPayments: 'No Payments',
          sortBy: 'Sort By',
          name: 'Name',
          debtAmount: 'Debt Amount',
          createdDate: 'Created Date',
          dueDate: 'Due Date',
          dueSoon: 'Due Soon (7 days)',
          noDueDate: 'No Due Date',
          allDueDates: 'All Due Dates',
          showing: 'Showing',
          of: 'of',
          clearFilters: 'Clear Filters'
        },
        search: {
          customers: 'Search customers...',
          companies: 'Search companies...'
        },
        buttons: {
          add: 'Add',
          edit: 'Edit',
          delete: 'Delete',
          save: 'Save',
          cancel: 'Cancel',
          close: 'Close',
          back: 'Back',
          print: 'Print',
          refresh: 'Refresh',
          retry: 'Retry',
          done: 'Done',
          saving: 'Saving...',
          saveSchedule: 'Save Schedule',
          clearSchedule: 'Clear Schedule',
          processing: 'Processing...'
        },
        status: {
          loading: 'Loading...',
          error: 'Error',
          success: 'Success',
          noData: 'No data',
          noCustomers: 'No customers',
          noCompanies: 'No companies',
          noActivity: 'No activity',
          connectionError: 'Connection Error',
          unableToConnect: 'Unable to connect to the server. Please make sure the backend is running.'
        },
        time: {
          daysAgo: 'days ago',
          created: 'Created',
          lastPayment: 'Last Payment',
          daysLeft: 'days left',
          daysOverdue: 'days overdue',
          paidInLast30Days: 'Paid in last 30 days'
        },
        currency: {
          iqd: 'IQD',
          usd: 'USD',
          mixed: 'Mixed'
        },
      auth: {
        signIn: 'Sign In',
        signInSubtitle: 'Sign in to your account',
        username: 'Username',
        usernamePlaceholder: 'Enter your username',
        email: 'Email',
        emailPlaceholder: 'Enter your email',
        password: 'Password',
        passwordPlaceholder: 'Enter your password',
        signingIn: 'Signing in...',
        profile: 'Profile',
        logout: 'Logout',
        welcome: 'Welcome',
        userProfile: 'User Profile',
        editProfile: 'Edit Profile',
        saveChanges: 'Save Changes',
        cancel: 'Cancel',
        profileUpdated: 'Profile updated successfully'
      },
        common: {
          required: 'Required',
          optional: 'Optional',
          total: 'Total',
          amount: 'Amount',
          date: 'Date',
          time: 'Time',
          note: 'Note',
          description: 'Description',
          action: 'Action',
          entity: 'Entity',
          transactions: 'Transactions',
          cannotBeUndone: 'Cannot be undone',
          status: 'Status',
          pending: 'Pending',
          completed: 'Completed',
          unknown: 'Unknown',
          at: 'at'
        }
      }

      // Navigate through nested object
      const keys = key.split('.')
      let value: any = enTranslations
      for (const k of keys) {
        value = value?.[k]
      }
      return value || key
    }

    // For other languages, use the translations
    const keys = key.split('.')
    let value: any
    
    if (language === 'ku') {
      value = kuTranslations
    } else if (language === 'tr') {
      value = trTranslations
    } else if (language === 'ar') {
      value = arTranslations
    } else {
      return key
    }
    
    for (const k of keys) {
      value = value?.[k]
    }
    return value || key
  }

  // Set document direction based on language
  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr'
    document.documentElement.lang = language
  }, [language, isRTL])

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    isRTL
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}
