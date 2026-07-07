# API Benchmarks

This suite covers every current route mounted under `/api/` and writes both
machine-readable JSON and a Markdown summary to `benchmarks/results/`.

## Commands

```bash
npm run benchmark
npm run benchmark:smoke
```

`npm run benchmark` runs a local API server automatically unless
`BENCHMARK_TARGET_URL` is set. `npm run benchmark:smoke` uses lower request
counts for CI and pull-request checks.

## Configuration

Copy `benchmarks/.env.benchmark.example` when benchmarking an existing server:

```bash
BENCHMARK_TARGET_URL=http://127.0.0.1:4000 npm run benchmark
```

Relevant variables:

- `BENCHMARK_TARGET_URL`: target host. Omit it to auto-start the local Express app.
- `BENCHMARK_CONNECTIONS`: concurrent autocannon connections.
- `BENCHMARK_AMOUNT_PER_ENDPOINT`: autocannon request count per endpoint.
- `BENCHMARK_SAMPLE_REQUESTS`: direct fetch samples used to calculate p50, p95, p99, and TTFB.
- `BENCHMARK_JWT_SECRET`: secret used for the benchmark-only admin JWT.
- `BENCHMARK_DISABLE_RATE_LIMIT`: set to `true` for local benchmark runs that should not trip the development limiter.

## Outputs

- `benchmarks/results/latest.json`
- `benchmarks/results/latest.md`

The JSON report includes per-endpoint latency, TTFB, sustained RPS, peak RPS,
status counts, error rate, and gate status. Thresholds live in
`benchmarks/thresholds.json` so reviewers can tune them without changing the
runner.
