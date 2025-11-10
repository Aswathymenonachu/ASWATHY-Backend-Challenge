# Backend Engineering Challenge

## Overview

This NestJS backend application contains intentional design issues and missing implementations that need to be addressed. Your task is to identify, analyze, and fix these problems while following best practices and writing comprehensive tests.

## 🎯 Challenge Tasks

### Task 1: Fix SOLID Principle Violations (Required)
**Priority: High** | **File**: `src/order/order.service.ts`

The `OrderService` class violates multiple SOLID principles and needs to be refactored.

---

### Task 2: Implement Rate Limiting (Required)
**Priority: High** | **File**: `src/common/location-rate-limit.guard.ts`

Implement proper rate limiting for order creation based on location to prevent abuse.

#### Requirements:
- [ ] **Rate Limit**: 10 orders per minute per location
- [ ] **HTTP Status Codes**: Return proper error code 
- [ ] **Headers**: Include proper rate limit headers
  
  
### Task 3: Database Querying Issue (Required)
**Priority: High** | **File**: `src/order/order.service.ts` → `createOrder()` method

The order creation process has a query problem that causes performance issues.

### Task 4: Implement Comprehensive Unit Tests (Required)
**Priority: High** | **Files**: Create test files for all new services

Write comprehensive unit tests for all the code you implement.

#### Testing Guidelines:
- Use proper mocking for dependencies
- Test both success and failure scenarios
- Achieve minimum 80% code coverage
- Use descriptive test names and organize with `describe` blocks
- Test integration points between services

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL
- Redis
- Docker (optional)

### Installation
```bash
# Install dependencies
npm install

# Start PostgreSQL and Redis (using Docker)
docker-compose up -d

# Run database migrations and seed data
npm run seed

# Start the application
npm run start:dev
```

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov
```

## 📝 Evaluation Criteria

### Code Quality (40%)
- Clean, readable, and maintainable code
- Proper separation of concerns
- Consistent naming conventions
- Adequate error handling

### Architecture (30%)
- Proper implementation of SOLID principles
- Good use of design patterns
- Scalable and extensible design
- Proper dependency injection

### Performance (20%)
- Efficient database queries
- Proper rate limiting implementation
- Optimized algorithms and data structures

### Testing (10%)
- Comprehensive test coverage
- Well-structured test cases
- Proper mocking and isolation

## 🔍 Helpful Commands

```bash
# Format code
npm run format

# Lint code
npm run lint

# Build application
npm run build

# Run in production mode
npm run start:prod
```

## 💡 Tips for Success

1. **Start with SOLID**: Fix the service layer architecture first
2. **Test Early**: Write tests as you implement features
3. **Performance Matters**: Always consider the performance impact of your solutions
4. **Documentation**: Comment complex business logic and architectural decisions
5. **Error Handling**: Implement proper error handling and validation

Good luck! 🚀