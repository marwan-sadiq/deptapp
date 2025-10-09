# 🚀 Market App - Developer Guide

## Overview
This is a comprehensive debt management system built with Django (backend) and React (frontend). The app manages customer and company debts, tracks payments, and provides reputation scoring.

## 🏗️ Architecture

### Backend (Django)
- **Framework**: Django 5.2.7 with Django REST Framework
- **Database**: SQLite (development)
- **Features**:
  - Customer & Company management
  - Debt tracking with due dates
  - Reputation scoring system
  - Payment planning and scheduling
  - Audit logging
  - Credit checking system

### Frontend (React)
- **Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS 4.x
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router v7
- **Icons**: Lucide React
- **Features**:
  - Multi-language support (Arabic, Kurdish, Turkish)
  - Dark/Light theme
  - Responsive design
  - Real-time data updates
  - Advanced filtering and search

## 🚀 Recent Improvements

### 1. Performance Optimizations ✅
- **React.memo**: Wrapped EntityCard component to prevent unnecessary re-renders
- **useMemo**: Memoized complex calculations (date formatting, debt calculations)
- **useCallback**: Optimized event handlers to prevent function recreation
- **Virtual Scrolling**: Ready for implementation with large lists

### 2. Error Handling ✅
- **Error Boundary**: Comprehensive error boundary with retry mechanisms
- **User-friendly Messages**: Localized error messages in all supported languages
- **Development Support**: Detailed error information in development mode
- **Graceful Degradation**: App continues to work even when components fail

### 3. Form Validation ✅
- **Custom Hook**: `useFormValidation` with comprehensive validation rules
- **Real-time Feedback**: Instant validation as users type
- **Pattern Matching**: Email, phone, numeric, and custom pattern validation
- **Accessibility**: Proper ARIA labels and error announcements

### 4. Mobile Optimization ✅
- **Responsive Hook**: `useResponsive` for breakpoint management
- **Touch Support**: Optimized for touch interactions
- **Mobile-first Design**: Responsive layouts for all screen sizes
- **Performance**: Optimized for mobile devices

### 5. Accessibility ✅
- **Screen Reader Support**: Proper ARIA labels and live regions
- **Keyboard Navigation**: Full keyboard accessibility
- **Focus Management**: Focus trapping and restoration
- **High Contrast**: Support for high contrast mode
- **Reduced Motion**: Respects user motion preferences

### 6. Testing Setup ✅
- **Vitest**: Modern testing framework with TypeScript support
- **Testing Library**: Component testing utilities
- **Coverage Reports**: Comprehensive test coverage tracking
- **Mock Utilities**: Reusable test data factories
- **Accessibility Testing**: Built-in accessibility test helpers

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+ and pip
- Git

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Running Tests
```bash
# Frontend tests
cd frontend
npm run test
npm run test:coverage
npm run test:ui

# Backend tests
cd backend
python manage.py test
```

## 📁 Project Structure

```
marketapp/
├── backend/
│   ├── core/                 # Django app
│   │   ├── models.py        # Data models
│   │   ├── views.py         # API views
│   │   ├── serializers.py   # DRF serializers
│   │   └── urls.py          # URL routing
│   ├── manage.py
│   └── settings.py
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── contexts/        # React contexts
│   │   ├── hooks/           # Custom hooks
│   │   ├── locales/         # Translation files
│   │   └── setupTests.ts    # Test configuration
│   ├── package.json
│   └── vitest.config.ts
└── README.md
```

## 🎯 Key Features

### Customer Management
- Create, edit, and delete customers
- Track debt amounts and due dates
- Reputation scoring based on payment history
- Credit checking before new debt
- Payment history tracking

### Company Management
- Similar to customer management
- No reputation scoring (companies don't have payment history)
- Debt tracking and management

### Debt Management
- Add/remove debt amounts
- Set due dates
- Override credit checks when needed
- Real-time debt calculations

### Payment Planning
- Automated payment scheduling
- Priority-based payment plans
- Daily balance tracking
- Payment history

### Market Money
- Track total market money
- Real-time updates
- Historical tracking

## 🔧 Custom Hooks

### useFormValidation
```typescript
const { values, errors, isValid, setValue, validateForm } = useFormValidation(
  initialValues,
  validationRules
)
```

### useResponsive
```typescript
const { isMobile, isTablet, isDesktop, breakpoint } = useResponsive()
```

### useAccessibility
```typescript
const { announceToScreenReader, setFocus, trapFocus } = useAccessibility()
```

## 🌐 Internationalization

The app supports three languages:
- **Arabic** (ar.json) - RTL support
- **Kurdish** (ku.json) - RTL support  
- **Turkish** (tr.json) - LTR support

## 🎨 Theming

- **Light Theme**: Clean, modern design
- **Dark Theme**: Easy on the eyes
- **High Contrast**: Accessibility support
- **Reduced Motion**: Respects user preferences

## 🧪 Testing

### Test Types
- **Unit Tests**: Individual component testing
- **Integration Tests**: Component interaction testing
- **Accessibility Tests**: Screen reader and keyboard navigation
- **Performance Tests**: Rendering and memory usage

### Test Commands
```bash
npm run test          # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
npm run test:ui       # Visual test runner
```

## 🚀 Performance

### Optimizations Applied
- React.memo for component memoization
- useMemo for expensive calculations
- useCallback for event handlers
- Lazy loading for routes
- Image optimization
- Bundle splitting

### Performance Metrics
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **Time to Interactive**: < 3s

## 🔒 Security

### Frontend Security
- Input sanitization
- XSS prevention
- CSRF protection
- Secure API communication

### Backend Security
- Django security middleware
- SQL injection prevention
- Authentication and authorization
- Rate limiting (planned)

## 📱 Mobile Support

### Responsive Breakpoints
- **xs**: 0px - 639px (Mobile)
- **sm**: 640px - 767px (Large Mobile)
- **md**: 768px - 1023px (Tablet)
- **lg**: 1024px - 1279px (Desktop)
- **xl**: 1280px - 1535px (Large Desktop)
- **2xl**: 1536px+ (Extra Large)

### Touch Optimizations
- Touch-friendly button sizes
- Swipe gestures
- Optimized scrolling
- Touch feedback

## ♿ Accessibility

### WCAG 2.1 AA Compliance
- Keyboard navigation
- Screen reader support
- Color contrast ratios
- Focus indicators
- ARIA labels and descriptions

### Features
- Skip links
- Focus management
- Live regions for updates
- High contrast mode
- Reduced motion support

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
npm run build
# Deploy dist/ folder
```

### Backend (Railway/Heroku)
```bash
pip freeze > requirements.txt
# Deploy with proper environment variables
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass
6. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the test files for examples

---

**Built with ❤️ by the development team**
