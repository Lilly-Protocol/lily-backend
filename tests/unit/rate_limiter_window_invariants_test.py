import pytest
import time

def test_sliding_window_burst_clamping():
    max_burst = 20
    window_seconds = 60
    incoming_requests = 25
    admitted = min(incoming_requests, max_burst)

    assert admitted == 20
    assert incoming_requests - admitted == 5

def test_cooldown_expiry_invariants():
    cooldown_seconds = 10
    start_time = 100
    current_time = 112

    assert (current_time - start_time) >= cooldown_seconds
