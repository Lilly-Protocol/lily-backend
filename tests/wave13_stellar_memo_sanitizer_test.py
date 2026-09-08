import unittest

class TestWave13StellarMemoSanitizer(unittest.TestCase):
    def test_stellar_text_memo_byte_length_clamping(self):
        max_memo_bytes = 28 # Stellar MEMO_TEXT max length

        def sanitize_memo(text: str) -> str:
            encoded = text.encode('utf-8')
            if len(encoded) <= max_memo_bytes:
                return text
            return encoded[:max_memo_bytes].decode('utf-8', errors='ignore')

        valid_memo = "BountyGrid Wave 13"
        self.assertEqual(sanitize_memo(valid_memo), valid_memo)

        long_memo = "This is an extremely long transaction memo text that exceeds 28 bytes"
        sanitized = sanitize_memo(long_memo)
        self.assertTrue(len(sanitized.encode('utf-8')) <= 28)

    def test_memo_id_uint64_bounds(self):
        max_uint64 = (1 << 64) - 1

        def is_valid_memo_id(num: int) -> bool:
            return 0 <= num <= max_uint64

        self.assertTrue(is_valid_memo_id(123456789))
        self.assertFalse(is_valid_memo_id(-1))
        self.assertFalse(is_valid_memo_id(max_uint64 + 1))

if __name__ == '__main__':
    unittest.main()
