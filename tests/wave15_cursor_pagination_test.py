import unittest
import base64

class TestWave15CursorPagination(unittest.TestCase):
    def test_cursor_encoding_and_decoding(self):
        def encode_cursor(record_id: int, timestamp: int) -> str:
            raw = f"{record_id}:{timestamp}"
            return base64.b64encode(raw.encode('utf-8')).decode('utf-8')

        def decode_cursor(cursor: str) -> tuple[int, int]:
            decoded = base64.b64decode(cursor.encode('utf-8')).decode('utf-8')
            r_id, ts = decoded.split(':')
            return int(r_id), int(ts)

        cursor = encode_cursor(42, 1788743000)
        rec_id, ts_val = decode_cursor(cursor)

        self.assertEqual(rec_id, 42)
        self.assertEqual(ts_val, 1788743000)

    def test_page_limit_clamping(self):
        def clamp_limit(limit: int, max_limit: int = 100, default_limit: int = 20) -> int:
            if limit <= 0:
                return default_limit
            return min(limit, max_limit)

        self.assertEqual(clamp_limit(0), 20)
        self.assertEqual(clamp_limit(50), 50)
        self.assertEqual(clamp_limit(500), 100)

if __name__ == '__main__':
    unittest.main()
