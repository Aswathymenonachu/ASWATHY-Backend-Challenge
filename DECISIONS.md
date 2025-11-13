#  Backend Engineering Challenge — Completed Implementation

---

##  **Task 1: Fix SOLID Principle Violations**

**Priority:** High  
**Files:**
- `src/order/order.service.ts`
- `src/order/validator.service.ts`
- `src/order/totals.service.ts`
- `src/shared/domain-events.ts`

###  **Implemented Fixes**
- Refactored **`OrderService`** to follow **Single Responsibility Principle (SRP)**:
  - **`OrderValidator`** → Handles input validation and business rule enforcement.  
  - **`TotalsService`** → Calculates discounts, taxes, and order totals.  
  - **`DomainEvents`** → Manages side effects (emails, notifications, logs).  
- Removed direct side-effects (`sendOrderConfirmationEmail`, `sendShippingNotification`) from `OrderService`.  
- Introduced **`DomainEvents.publish()`** to trigger domain-level notifications.  
- Implemented **Dependency Injection** for modular service composition.  
- Added consistent **error handling** using NestJS’s `BadRequestException`.  

###  **Example**
```ts
await this.events.publish('order.created', {
  orderId: savedOrder.id,
  customerEmail: customer.email,
});

#  Task 2 — Implement Rate Limiting

**Priority:** High  
**File:** `src/common/location-rate-limit.guard.ts`

---

##  Implemented Fixes

- Implemented **location-based rate limiting** to control the number of orders created from the same location.
- Used **Redis** as the in-memory data store for counting requests.
- Configured limit: **10 requests per minute per `locationId`**.
- Returns **HTTP 429 Too Many Requests** when the limit is exceeded.
- Added standard headers for transparency:
  - `X-RateLimit-Limit` → The total allowed requests per window.
  - `X-RateLimit-Remaining` → Remaining requests before hitting the limit.
  - `X-RateLimit-Reset` → Unix timestamp when the window resets.
- Atomic Redis commands (`INCR`, `EXPIRE NX`) ensure consistent counting under concurrency.

---

##  Files Added

- `src/redis/redis.module.ts` → Provides the shared Redis client via `'REDIS'` token.  
- `OrderModule` → Imports `RedisModule` and registers `LocationRateLimitGuard`.

---

##  Example Response

```bash
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1731392640
{
  "message": "Rate limit exceeded for this location"
}


---

##  **`TASK3_DBOptimization.md`**

```markdown
#  Task 3 — Database Query Optimization

**Priority:** High  
**File:** `src/order/order.service.ts` → `createOrder()`  

---

##  Implemented Fixes

- **Eliminated N+1 Query Issue**
  - Replaced per-item product lookups with a single bulk fetch:
    ```ts
    const products = await this.productRepository.find({ where: { id: In(productIds) } });
    ```
- **Introduced Transactional Workflow**
  - All operations (stock updates, order save, and item save) now run within one `DataSource.transaction()` block:
    ```ts
    return this.ds.transaction(async manager => {
      // update stock, create order, create order items atomically
    });
    ```
- **Ensured Atomicity**
  - If any operation fails, the entire transaction rolls back.
- **Reduced Database Round-Trips**
  - Before: Multiple queries per product and per save.
  - After: One bulk fetch + one transaction commit.

---

##  Performance Comparison

| Operation | Before | After |
|------------|---------|--------|
| Product Fetch | N queries (1 per item) | Single bulk query |
| Writes | Multiple separate saves | One atomic transaction |
| Consistency | Partial commits possible | All-or-nothing guaranteed |

---

##  Benefits

- Reduced query overhead → faster order creation.
- Guaranteed data consistency even on partial failure.
- Improved scalability for high-volume order traffic.
- Clear, maintainable transaction boundaries.

#  Task 4 — Unit & Integration Testing

**Priority:** High  
**Files:**
- `src/order/order.service.spec.ts`
- `src/order/totals.service.spec.ts`
- `src/order/validator.service.spec.ts`

---

##  Implemented Tests

- Added **unit** and **integration** tests for all order-related services.
- Mocked dependencies (TypeORM repositories, Redis client, DomainEvents).
- Covered both **success** and **error** cases:
  -  Successful order creation  
  - Insufficient stock  
  -  Invalid customer/location IDs  
  -  Restricted updates on delivered/cancelled orders  

---

##  Example Mock Setup

```ts
jest.mock('../shared/domain-events', () => ({
  DomainEvents: jest.fn().mockImplementation(() => ({
    publish: jest.fn(),
  })),
}));
