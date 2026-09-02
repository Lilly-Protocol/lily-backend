# Solution for Issue #123

## 🛠️ Proposed Solution (by Aditya Waghamare)

### Analysis
The issue requests adding integration/E2E test cases using `supertest` to ensure that posting malformed JSON bodies to `POST /api/v1/agents` and `POST /api/v1/payments/quote` correctly returns a `400 Bad Request` status along with the standard error response envelope (`success: false`, etc.) handled by `errorHandler`.

### Fix
Add test cases in the test suite (e.g., `src/__tests__/agents.test.ts` or `src/common/http/error.middleware.spec.ts`) validating malformed JSON handling.

### Implementation
```typescript
import request from 'supertest';
import app from '../app'; // Adjust path as appropriate

describe('Malformed JSON body handling', () => {
  it('should return 400 for malformed JSON on POST /api/v1/agents', async () => {
    const res = await request(app)
      .post('/api/v1/agents')
      .set('Content-Type', 'application/json')
      .send('{"name": "test"'); // missing closing brace

    expect(res.status).toBe(400);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: false,
      })
    );
  });

  it('should return 400 for malformed JSON on POST /api/v1/payments/quote', async () => {
    const res = await request(app)
      .post('/api/v1/payments/quote')
      .set('Content-Type', 'application/json')
      .send('{"amount": 100'); // missing closing brace

    expect(res.status).toBe(400);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: false,
      })
    );
  });
});
```

### Testing
Run `npm test` to verify that malformed JSON payloads correctly trigger a 400 response with the standard API error response format.


---
*Submitted by Aditya Waghamare*
💰 **Payout Address (Base L2 / EVM):** `0xb61dBcdBc3407F71EaCb64D4CBFAcf9FFfe2415C`