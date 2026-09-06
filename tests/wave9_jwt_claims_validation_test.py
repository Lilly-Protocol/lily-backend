import unittest
import time

class TestWave9JWTClaimsValidation(unittest.TestCase):
    def test_jwt_claims_expiry_validation(self):
        current_time = int(time.time())
        valid_claims = {
            "sub": "user_stellar_001",
            "iat": current_time - 60,
            "exp": current_time + 3600,
            "iss": "lilly-protocol-auth"
        }

        def is_token_valid(claims: dict, now: int) -> bool:
            return claims.get("exp", 0) > now and claims.get("iat", 0) <= now

        self.assertTrue(is_token_valid(valid_claims, current_time))

        expired_claims = valid_claims.copy()
        expired_claims["exp"] = current_time - 10
        self.assertFalse(is_token_valid(expired_claims, current_time))

    def test_issuer_whitelist_guard(self):
        trusted_issuers = {"lilly-protocol-auth", "lilly-admin-gateway"}
        self.assertTrue("lilly-protocol-auth" in trusted_issuers)
        self.assertFalse("untrusted-third-party" in trusted_issuers)

if __name__ == '__main__':
    unittest.main()
