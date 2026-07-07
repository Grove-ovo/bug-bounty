# API Benchmark Summary - 2026-07-07T01:50:42.464Z

Mode: full
Target: http://127.0.0.1:61245
Connections: 5
Autocannon requests per endpoint: 40
Latency sample requests per endpoint: 20

## Environment

- CPU: Apple M5 Pro
- Cores: 15
- Memory: 48 GB total, 3.59 GB free
- OS: Darwin 25.5.0 arm64
- Node.js: v22.22.3

## Results

| Endpoint | p50 ms | p95 ms | p99 ms | TTFB p95 ms | Sustained RPS | Peak RPS | Error % | Gate |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| POST /api/auth/register | 0.61 | 2.15 | 22.37 | 2.02 | 40 | 40 | 0 | pass |
| POST /api/auth/login | 0.59 | 1.05 | 1.98 | 0.98 | 40 | 40 | 0 | pass |
| GET /api/auth/oauth/github/callback | 0.48 | 1.34 | 3.06 | 1.24 | 40 | 40 | 0 | pass |
| POST /api/auth/refresh | 0.58 | 1.12 | 2.75 | 1.06 | 40 | 40 | 0 | pass |
| GET /api/users | 0.38 | 0.77 | 4.31 | 0.71 | 40 | 40 | 0 | pass |
| POST /api/users | 0.65 | 1.28 | 2.34 | 1.23 | 40 | 40 | 0 | pass |
| GET /api/jobs | 0.49 | 1.23 | 1.9 | 1.13 | 40 | 40 | 0 | pass |
| POST /api/jobs | 0.63 | 1.58 | 3.16 | 1.51 | 40 | 40 | 0 | pass |
| GET /api/proposals | 0.42 | 1.01 | 1.93 | 0.93 | 40 | 40 | 0 | pass |
| POST /api/proposals | 0.57 | 1.33 | 2.16 | 1.27 | 40 | 40 | 0 | pass |
| POST /api/payments | 0.55 | 1.42 | 2.42 | 1.33 | 40 | 40 | 0 | pass |
| GET /api/reviews | 0.52 | 1.09 | 2.06 | 1.01 | 40 | 40 | 0 | pass |
| POST /api/reviews | 0.53 | 2.65 | 3.24 | 2.51 | 40 | 40 | 0 | pass |
| GET /api/messages | 0.42 | 1.17 | 2.29 | 1.07 | 40 | 40 | 0 | pass |
| POST /api/messages | 0.55 | 1.3 | 2.82 | 1.23 | 40 | 40 | 0 | pass |
| GET /api/notifications | 0.42 | 1.24 | 2.43 | 1.19 | 40 | 40 | 0 | pass |
| POST /api/notifications | 0.61 | 1.66 | 2.3 | 1.54 | 40 | 40 | 0 | pass |
| POST /api/uploads | 0.85 | 1.88 | 7.25 | 1.82 | 40 | 40 | 0 | pass |
| GET /api/search | 0.47 | 2.3 | 2.33 | 2.2 | 40 | 40 | 0 | pass |
| GET /api/admin/metrics | 0.46 | 2.7 | 3.43 | 2.61 | 40 | 40 | 0 | pass |

## Gate Details

Default threshold: p99 <= 1500 ms and error rate <= 1%.

- PASS: POST /api/auth/register p99=22.37 ms, error=0% (threshold p99<=1500 ms, error<=1%).
- PASS: POST /api/auth/login p99=1.98 ms, error=0% (threshold p99<=1500 ms, error<=1%).
- PASS: GET /api/auth/oauth/github/callback p99=3.06 ms, error=0% (threshold p99<=1500 ms, error<=1%).
- PASS: POST /api/auth/refresh p99=2.75 ms, error=0% (threshold p99<=1500 ms, error<=1%).
- PASS: GET /api/users p99=4.31 ms, error=0% (threshold p99<=1500 ms, error<=1%).
- PASS: POST /api/users p99=2.34 ms, error=0% (threshold p99<=1500 ms, error<=1%).
- PASS: GET /api/jobs p99=1.9 ms, error=0% (threshold p99<=1500 ms, error<=1%).
- PASS: POST /api/jobs p99=3.16 ms, error=0% (threshold p99<=1500 ms, error<=1%).
- PASS: GET /api/proposals p99=1.93 ms, error=0% (threshold p99<=1500 ms, error<=1%).
- PASS: POST /api/proposals p99=2.16 ms, error=0% (threshold p99<=1500 ms, error<=1%).
- PASS: POST /api/payments p99=2.42 ms, error=0% (threshold p99<=1500 ms, error<=1%).
- PASS: GET /api/reviews p99=2.06 ms, error=0% (threshold p99<=1500 ms, error<=1%).
- PASS: POST /api/reviews p99=3.24 ms, error=0% (threshold p99<=1500 ms, error<=1%).
- PASS: GET /api/messages p99=2.29 ms, error=0% (threshold p99<=1500 ms, error<=1%).
- PASS: POST /api/messages p99=2.82 ms, error=0% (threshold p99<=1500 ms, error<=1%).
- PASS: GET /api/notifications p99=2.43 ms, error=0% (threshold p99<=1500 ms, error<=1%).
- PASS: POST /api/notifications p99=2.3 ms, error=0% (threshold p99<=1500 ms, error<=1%).
- PASS: POST /api/uploads p99=7.25 ms, error=0% (threshold p99<=2500 ms, error<=1%).
- PASS: GET /api/search p99=2.33 ms, error=0% (threshold p99<=1500 ms, error<=1%).
- PASS: GET /api/admin/metrics p99=3.43 ms, error=0% (threshold p99<=1500 ms, error<=1%).
