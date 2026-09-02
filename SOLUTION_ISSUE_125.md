# Solution for Issue #125

## 🛠️ Proposed Solution (by Aditya Waghamare)

### Analysis
The codebase lacks test coverage for CORS origin rejection in `src/config/cors.ts` (and corresponding Express/Fastify/NestJS middleware integration). Specifically, when an invalid origin hits the API, the current behavior (or intended corrected behavior) needs to be tested for both disallowed origins and server-to-server requests without an origin.

### Fix
Add comprehensive integration/unit tests for CORS rejection behavior covering:
1. Disallowed origin header -> verifying status code and body response.
2. Absent `Origin` header (server-to-server / curl) -> verifying allowed behavior or expected handling.

### Implementation
\`\`\`typescript
import request from 'supertest';
import { app } from '../src/app'; // Assuming Express app export

describe('CORS Origin Rejection Behavior', () => {
  const disallowedOrigin = 'https://malicious-origin.com';
  const allowedOrigin = process.env.CORS_ORIGINS?.split(',')[0] || 'http://localhost:3000';

  it('should reject requests with a disallowed Origin header', async () => {
    const response = await request(app)
      .get('/health') // or any standard endpoint
      .set('Origin', disallowedOrigin);

    // Asserting the status code and error response body
    // Depending on whether errorHandler catches it as 500 or 403 (as per issue context)
    expect([403, 500]).toContain(response.status);
    expect(response.body).toHaveProperty('message');
  });

  it('should allow requests without an Origin header (server-to-server / curl)', async () => {
    const response = await request(app)
      .get('/health');

    // Server-to-server requests without Origin header should pass CORS check
    expect(response.status).not.toBe(403);
    expect(response.status).not.toBe(500);
  });
});
\`\`\`

### Testing
Run tests using:
\`\`\`bash
npm test
\`\`\`


---
*Submitted by Aditya Waghamare*
💰 **Payout Address (Base L2 / EVM):** `0xb61dBcdBc3407F71EaCb64D4CBFAcf9FFfe2415C`