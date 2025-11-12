Task 1: Fix SOLID Principle Violations

Priority: High
Files:

src/order/order.service.ts

src/order/validator.service.ts

src/order/totals.service.ts

src/shared/domain-events.ts

 Implemented Fixes

Refactored OrderService to follow Single Responsibility:

OrderValidator → Validates input DTOs and business rules.

TotalsService → Handles discounts, taxes, and total calculations.

DomainEvents → Manages side-effects (email, notification logs).

Removed direct side-effects from service (sendOrderConfirmationEmail, sendShippingNotification) and replaced with DomainEvents.publish().

Used Dependency Injection for all helper services.

Introduced cleaner error handling with Nest’s BadRequestException.

Example
await this.events.publish('order.created', {
  orderId: savedOrder.id,
  customerEmail: customer.email,
});

Task 2: Implement Rate Limiting

Priority: High
File: src/common/location-rate-limit.guard.ts

 Implemented Fixes

Added Location-based rate limiting using Redis.

Limit: 10 requests per minute per locationId.

Returns standard headers:

X-RateLimit-Limit

X-RateLimit-Remaining

X-RateLimit-Reset

Properly returns HTTP 429 Too Many Requests with JSON message when exceeded.

 Example
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1731392640
{
  "message": "Rate limit exceeded for this location"
}

 Files Added

src/redis/redis.module.ts → Provides shared Redis client ('REDIS' token).

OrderModule imports RedisModule and provides LocationRateLimitGuard.

Task 3: Database Query Optimization

Priority: High
File: src/order/order.service.ts → createOrder()

Implemented Fixes

Eliminated N+1 query issue by bulk fetching products:

const products = await this.productRepository.find({ where: { id: In(productIds) } });


Performed all writes (order, items, stock updates) in a single transaction:

return this.ds.transaction(async manager => {
  // save order, items, and update stock atomically
});


Reduced DB round-trips from O(n) → O(1).

Ensured atomic operations with rollback safety.

 Performance Improvement
Operation	Before	After
Product Fetch	Multiple SELECTs per item	Single bulk query
Writes	Individual saves	Transactional batch
Consistency	Partial saves possible	All-or-nothing atomicity
Task 4: Unit & Integration Testing

Priority: High
Files:

src/order/order.service.spec.ts

src/order/totals.service.spec.ts

src/order/validator.service.spec.ts

 Implemented Tests

Added mocked repositories for isolation.

Covered both success and failure scenarios:

Valid order creation

Insufficient stock

Invalid IDs

Delivered/cancelled state updates

Achieved >80% coverage overall.