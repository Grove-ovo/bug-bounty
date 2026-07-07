import autocannon from "autocannon";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const args = new Set(process.argv.slice(2));
const smoke = args.has("--smoke");

const endpoints = JSON.parse(await readFile(path.join(__dirname, "endpoints.json"), "utf8"));
const thresholds = JSON.parse(await readFile(path.join(__dirname, "thresholds.json"), "utf8"));

function envNumber(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return Number(sorted[Math.max(0, Math.min(sorted.length - 1, index))].toFixed(2));
}

function round(value, digits = 2) {
  return Number(Number(value ?? 0).toFixed(digits));
}

function endpointKey(endpoint) {
  return `${endpoint.method.toUpperCase()} ${endpoint.path.split("?")[0]}`;
}

function thresholdFor(endpoint) {
  return {
    ...thresholds.default,
    ...(thresholds.endpoints?.[endpointKey(endpoint)] ?? {})
  };
}

function jsonHeaders(endpoint, token) {
  const headers = {};
  if (endpoint.body) headers["content-type"] = "application/json";
  if (endpoint.auth === "benchmark-admin") headers.authorization = `Bearer ${token}`;
  return headers;
}

async function requestInit(endpoint, token) {
  const init = {
    method: endpoint.method,
    headers: jsonHeaders(endpoint, token)
  };

  if (endpoint.body) {
    init.body = JSON.stringify(endpoint.body);
  }

  if (endpoint.form) {
    const form = new FormData();
    for (const [name, field] of Object.entries(endpoint.form)) {
      if (field.type === "file") {
        const filePath = path.resolve(repoRoot, field.path);
        const contents = await readFile(filePath);
        const blob = new Blob([contents], { type: "application/octet-stream" });
        form.append(name, blob, field.options?.filename ?? path.basename(filePath));
      } else {
        form.append(name, String(field.value ?? ""));
      }
    }
    init.body = form;
    delete init.headers["content-type"];
  }

  return init;
}

function autocannonOptions(endpoint, targetUrl, token, settings) {
  const headers = jsonHeaders(endpoint, token);
  const options = {
    title: endpointKey(endpoint),
    url: new URL(endpoint.path, targetUrl).toString(),
    method: endpoint.method,
    connections: settings.connections,
    amount: settings.amount,
    headers,
    renderProgressBar: false
  };

  if (endpoint.body) {
    options.body = JSON.stringify(endpoint.body);
  }

  if (endpoint.form) {
    options.form = Object.fromEntries(
      Object.entries(endpoint.form).map(([name, field]) => [
        name,
        field.type === "file"
          ? { ...field, path: path.resolve(repoRoot, field.path) }
          : field
      ])
    );
  }

  return options;
}

async function measureSamples(endpoint, targetUrl, token, sampleRequests) {
  const latencies = [];
  const ttfbs = [];
  const statuses = {};

  for (let index = 0; index < sampleRequests; index += 1) {
    const init = await requestInit(endpoint, token);
    const start = performance.now();
    const response = await fetch(new URL(endpoint.path, targetUrl), init);
    const headersReceived = performance.now();
    await response.arrayBuffer();
    const complete = performance.now();

    latencies.push(complete - start);
    ttfbs.push(headersReceived - start);
    statuses[response.status] = (statuses[response.status] ?? 0) + 1;
  }

  return {
    latency: {
      p50: percentile(latencies, 50),
      p95: percentile(latencies, 95),
      p99: percentile(latencies, 99)
    },
    ttfb: {
      p50: percentile(ttfbs, 50),
      p95: percentile(ttfbs, 95),
      p99: percentile(ttfbs, 99)
    },
    statuses
  };
}

async function startLocalServer() {
  process.env.JWT_SECRET = process.env.BENCHMARK_JWT_SECRET ?? process.env.JWT_SECRET ?? "benchmark-secret";
  process.env.BENCHMARK_DISABLE_RATE_LIMIT = process.env.BENCHMARK_DISABLE_RATE_LIMIT ?? "true";

  const { createApp } = await import("../apps/api/src/app.js");
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  return {
    targetUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    })
  };
}

function markdownReport(report) {
  const lines = [
    `# API Benchmark Summary - ${report.startedAt}`,
    "",
    `Mode: ${report.mode}`,
    `Target: ${report.targetUrl}`,
    `Connections: ${report.settings.connections}`,
    `Autocannon requests per endpoint: ${report.settings.amount}`,
    `Latency sample requests per endpoint: ${report.settings.sampleRequests}`,
    "",
    "## Environment",
    "",
    `- CPU: ${report.environment.cpu}`,
    `- Cores: ${report.environment.cores}`,
    `- Memory: ${report.environment.memoryGb} GB total, ${report.environment.freeMemoryGb} GB free`,
    `- OS: ${report.environment.os}`,
    `- Node.js: ${report.environment.node}`,
    "",
    "## Results",
    "",
    "| Endpoint | p50 ms | p95 ms | p99 ms | TTFB p95 ms | Sustained RPS | Peak RPS | Error % | Gate |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |"
  ];

  for (const row of report.results) {
    lines.push(
      `| ${row.key} | ${row.latency.p50} | ${row.latency.p95} | ${row.latency.p99} | ${row.ttfb.p95} | ${row.requests.sustainedRps} | ${row.requests.peakRps} | ${row.errorRatePercent} | ${row.gate.passed ? "pass" : "fail"} |`
    );
  }

  lines.push(
    "",
    "## Gate Details",
    "",
    `Default threshold: p99 <= ${report.thresholds.default.p99LatencyMs} ms and error rate <= ${report.thresholds.default.errorRatePercent}%.`,
    "",
    ...report.results.map((row) => {
      const status = row.gate.passed ? "PASS" : "FAIL";
      return `- ${status}: ${row.key} p99=${row.latency.p99} ms, error=${row.errorRatePercent}% (threshold p99<=${row.gate.threshold.p99LatencyMs} ms, error<=${row.gate.threshold.errorRatePercent}%).`;
    })
  );

  return `${lines.join("\n")}\n`;
}

let localServer;
let targetUrl = process.env.BENCHMARK_TARGET_URL?.replace(/\/$/, "");
if (!targetUrl) {
  localServer = await startLocalServer();
  targetUrl = localServer.targetUrl;
} else {
  process.env.JWT_SECRET = process.env.BENCHMARK_JWT_SECRET ?? process.env.JWT_SECRET ?? "benchmark-secret";
}

const { signAccessToken } = await import("../apps/api/src/utils/jwt.js");
const benchmarkToken = signAccessToken({
  sub: "usr_benchmark_admin",
  role: "admin",
  scope: "benchmark"
});

const settings = {
  connections: envNumber("BENCHMARK_CONNECTIONS", smoke ? 1 : 5),
  amount: envNumber("BENCHMARK_AMOUNT_PER_ENDPOINT", smoke ? 5 : 40),
  sampleRequests: envNumber("BENCHMARK_SAMPLE_REQUESTS", smoke ? 3 : 20)
};

const startedAt = new Date().toISOString();
const results = [];

try {
  for (const endpoint of endpoints) {
    const key = endpointKey(endpoint);
    const samples = await measureSamples(endpoint, targetUrl, benchmarkToken, settings.sampleRequests);
    const cannon = await autocannon(autocannonOptions(endpoint, targetUrl, benchmarkToken, settings));
    const totalRequests = Number(cannon.requests?.total ?? settings.amount);
    const failures = Number(cannon.errors ?? 0) + Number(cannon.timeouts ?? 0) + Number(cannon.non2xx ?? 0);
    const errorRatePercent = totalRequests > 0 ? round((failures / totalRequests) * 100, 4) : 0;
    const threshold = thresholdFor(endpoint);
    const passed = samples.latency.p99 <= threshold.p99LatencyMs && errorRatePercent <= threshold.errorRatePercent;

    results.push({
      key,
      name: endpoint.name,
      description: endpoint.description,
      latency: samples.latency,
      ttfb: samples.ttfb,
      requests: {
        total: totalRequests,
        sustainedRps: round(cannon.requests?.average),
        peakRps: round(cannon.requests?.max)
      },
      errors: {
        connectionErrors: Number(cannon.errors ?? 0),
        timeouts: Number(cannon.timeouts ?? 0),
        non2xx: Number(cannon.non2xx ?? 0),
        statuses: samples.statuses
      },
      errorRatePercent,
      gate: {
        passed,
        threshold
      }
    });
  }
} finally {
  if (localServer) {
    await localServer.close();
  }
}

const report = {
  issue: 30,
  mode: smoke ? "smoke" : "full",
  startedAt,
  finishedAt: new Date().toISOString(),
  targetUrl,
  settings,
  thresholds,
  environment: {
    cpu: os.cpus()[0]?.model ?? "unknown",
    cores: os.cpus().length,
    memoryGb: round(os.totalmem() / 1024 / 1024 / 1024),
    freeMemoryGb: round(os.freemem() / 1024 / 1024 / 1024),
    os: `${os.type()} ${os.release()} ${os.arch()}`,
    node: process.version
  },
  results
};

const resultsDir = path.join(__dirname, "results");
await mkdir(resultsDir, { recursive: true });
await writeFile(path.join(resultsDir, "latest.json"), `${JSON.stringify(report, null, 2)}\n`);
await writeFile(path.join(resultsDir, "latest.md"), markdownReport(report));

const failed = results.filter((row) => !row.gate.passed);
if (failed.length > 0) {
  console.error(`Benchmark gate failed for ${failed.length} endpoint(s): ${failed.map((row) => row.key).join(", ")}`);
  process.exitCode = 1;
} else {
  console.log(`Benchmark gate passed for ${results.length} endpoint(s).`);
  console.log(`Wrote ${path.relative(repoRoot, path.join(resultsDir, "latest.json"))}`);
  console.log(`Wrote ${path.relative(repoRoot, path.join(resultsDir, "latest.md"))}`);
}
