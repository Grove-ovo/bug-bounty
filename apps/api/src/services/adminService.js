const users = [
  {
    id: "usr_client_101",
    name: "Avery Chen",
    email: "avery@example.com",
    role: "client",
    status: "active",
    joinedAt: "2026-05-11T10:00:00.000Z",
    trustScore: 92,
    activeJobs: ["job_201"],
    disputes: ["dsp_301"]
  },
  {
    id: "usr_freelancer_102",
    name: "Maya Patel",
    email: "maya@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-05-18T09:30:00.000Z",
    trustScore: 88,
    activeJobs: ["job_201", "job_202"],
    disputes: []
  },
  {
    id: "usr_client_103",
    name: "Jordan Smith",
    email: "jordan@example.com",
    role: "client",
    status: "suspended",
    joinedAt: "2026-06-02T14:20:00.000Z",
    trustScore: 48,
    activeJobs: [],
    disputes: ["dsp_302"]
  },
  {
    id: "usr_freelancer_104",
    name: "Noah Williams",
    email: "noah@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-06-20T08:45:00.000Z",
    trustScore: 74,
    activeJobs: ["job_203"],
    disputes: ["dsp_302"]
  }
];

const flaggedJobs = [
  {
    id: "job_201",
    title: "Build a support automation dashboard",
    clientId: "usr_client_101",
    status: "flagged",
    reason: "Budget changed after proposal acceptance",
    reports: 2,
    flaggedAt: "2026-07-01T11:00:00.000Z"
  },
  {
    id: "job_202",
    title: "Migrate legacy API to Node.js",
    clientId: "usr_client_101",
    status: "under_review",
    reason: "Automated duplicate listing signal",
    reports: 1,
    flaggedAt: "2026-07-03T16:10:00.000Z"
  },
  {
    id: "job_203",
    title: "Design trust and safety flows",
    clientId: "usr_client_103",
    status: "flagged",
    reason: "User report: unclear deliverables",
    reports: 3,
    flaggedAt: "2026-07-04T12:35:00.000Z"
  }
];

const disputes = [
  {
    id: "dsp_301",
    jobId: "job_201",
    clientId: "usr_client_101",
    freelancerId: "usr_freelancer_102",
    status: "open",
    amount: 1500,
    transactionId: "txn_901",
    thread: [
      "Client requested delivery evidence.",
      "Freelancer uploaded deployment notes and screen recordings."
    ],
    evidence: ["delivery-notes.pdf", "screen-recording.mp4"],
    ruling: null
  },
  {
    id: "dsp_302",
    jobId: "job_203",
    clientId: "usr_client_103",
    freelancerId: "usr_freelancer_104",
    status: "under_review",
    amount: 900,
    transactionId: "txn_902",
    thread: [
      "Freelancer requested milestone release.",
      "Client reported scope mismatch."
    ],
    evidence: ["milestone-chat.txt", "scope-snapshot.png"],
    ruling: null
  }
];

const controls = {
  registrations: {
    key: "registrations",
    label: "New user registrations",
    enabled: true,
    updatedAt: "2026-07-01T00:00:00.000Z",
    updatedBy: "system"
  },
  jobPostings: {
    key: "jobPostings",
    label: "New job postings",
    enabled: true,
    updatedAt: "2026-07-01T00:00:00.000Z",
    updatedBy: "system"
  }
};

const auditLog = [
  {
    id: "aud_100",
    adminId: "system",
    actionType: "bootstrap",
    targetType: "platform",
    targetId: "controls",
    message: "Admin control defaults loaded",
    createdAt: "2026-07-01T00:00:00.000Z"
  }
];

function pageQuery(query) {
  const page = Math.max(Number.parseInt(query.page ?? "1", 10), 1);
  const pageSize = Math.min(Math.max(Number.parseInt(query.pageSize ?? "10", 10), 1), 50);
  return { page, pageSize };
}

function paginate(items, query) {
  const { page, pageSize } = pageQuery(query);
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    pagination: {
      page,
      pageSize,
      total: items.length,
      totalPages: Math.max(Math.ceil(items.length / pageSize), 1)
    }
  };
}

function appendAudit(adminId, actionType, targetType, targetId, message) {
  const entry = {
    id: `aud_${auditLog.length + 101}`,
    adminId,
    actionType,
    targetType,
    targetId,
    message,
    createdAt: new Date().toISOString()
  };
  auditLog.push(entry);
  return entry;
}

function roleMatches(user, role) {
  return !role || user.role === role;
}

function statusMatches(record, status) {
  return !status || record.status === status;
}

function joinDateMatches(user, from, to) {
  const joined = new Date(user.joinedAt).getTime();
  const afterFrom = !from || joined >= new Date(from).getTime();
  const beforeTo = !to || joined <= new Date(to).getTime();
  return afterFrom && beforeTo;
}

function queryMatches(user, q) {
  if (!q) return true;
  const needle = q.toLowerCase();
  return [user.name, user.email, user.id].some((field) => field.toLowerCase().includes(needle));
}

function trustDistribution() {
  return [
    { label: "0-49", count: users.filter((user) => user.trustScore < 50).length },
    { label: "50-79", count: users.filter((user) => user.trustScore >= 50 && user.trustScore < 80).length },
    { label: "80-100", count: users.filter((user) => user.trustScore >= 80).length }
  ];
}

export async function getAdminMetrics() {
  return {
    totalUsers: users.length,
    activeJobs: flaggedJobs.filter((job) => job.status !== "rejected").length,
    openDisputes: disputes.filter((dispute) => dispute.status !== "resolved").length,
    flaggedListings: flaggedJobs.filter((job) => job.status === "flagged").length,
    revenueCurrentPeriod: 128900,
    trustDistribution: trustDistribution()
  };
}

export async function getUsers(query = {}) {
  const filtered = users
    .filter((user) => roleMatches(user, query.role))
    .filter((user) => statusMatches(user, query.status))
    .filter((user) => joinDateMatches(user, query.joinedFrom, query.joinedTo))
    .filter((user) => queryMatches(user, query.q));

  return paginate(filtered, query);
}

export async function getUserDetail(id) {
  const user = users.find((entry) => entry.id === id);
  if (!user) return null;

  return {
    ...user,
    jobs: flaggedJobs.filter((job) => user.activeJobs.includes(job.id)),
    disputeHistory: disputes.filter((dispute) => user.disputes.includes(dispute.id))
  };
}

export async function setUserStatus(id, status, adminId) {
  const allowed = new Set(["active", "suspended", "banned"]);
  if (!allowed.has(status)) {
    throw new Error("Unsupported user status");
  }

  const user = users.find((entry) => entry.id === id);
  if (!user) return null;

  user.status = status;
  const audit = appendAudit(adminId, "user_status_updated", "user", id, `User ${id} set to ${status}`);
  return { user, audit };
}

export async function getJobModerationQueue(query = {}) {
  const filtered = flaggedJobs.filter((job) => statusMatches(job, query.status));
  return paginate(filtered, query);
}

export async function setJobModerationStatus(id, payload, adminId) {
  const allowed = new Set(["approved", "rejected", "escalated", "under_review"]);
  if (!allowed.has(payload.status)) {
    throw new Error("Unsupported moderation status");
  }

  const job = flaggedJobs.find((entry) => entry.id === id);
  if (!job) return null;

  job.status = payload.status;
  job.resolutionReason = payload.reason ?? "";
  const audit = appendAudit(adminId, "job_moderation_updated", "job", id, `Job ${id} set to ${payload.status}`);
  const notification = payload.status === "rejected"
    ? {
        userId: job.clientId,
        type: "listing_rejected",
        message: payload.reason ?? "Your listing was rejected by platform moderation."
      }
    : null;

  return { job, audit, notification };
}

export async function getDisputes(query = {}) {
  const filtered = disputes.filter((dispute) => statusMatches(dispute, query.status));
  return paginate(filtered, query);
}

export async function getDispute(id) {
  return disputes.find((entry) => entry.id === id) ?? null;
}

export async function setDisputeRuling(id, payload, adminId) {
  const allowed = new Set(["client", "freelancer", "refund", "senior_admin"]);
  if (!allowed.has(payload.ruling)) {
    throw new Error("Unsupported dispute ruling");
  }

  const dispute = disputes.find((entry) => entry.id === id);
  if (!dispute) return null;

  dispute.status = payload.ruling === "senior_admin" ? "under_review" : "resolved";
  dispute.ruling = {
    outcome: payload.ruling,
    reason: payload.reason ?? "",
    ruledBy: adminId,
    ruledAt: new Date().toISOString()
  };

  const audit = appendAudit(adminId, "dispute_ruled", "dispute", id, `Dispute ${id} ruled ${payload.ruling}`);
  const notifications = [dispute.clientId, dispute.freelancerId].map((userId) => ({
    userId,
    type: "dispute_ruling",
    message: `Dispute ${id} was updated by platform moderation.`
  }));

  return { dispute, audit, notifications };
}

export async function getControl(key) {
  return controls[key] ?? null;
}

export async function setControl(key, payload, adminId) {
  const control = controls[key];
  if (!control) return null;
  if (payload.confirm !== true) {
    throw new Error("Confirmation is required before changing platform controls.");
  }

  control.enabled = Boolean(payload.enabled);
  control.updatedAt = new Date().toISOString();
  control.updatedBy = adminId;
  const audit = appendAudit(adminId, "platform_control_updated", "control", key, `${control.label} set to ${control.enabled}`);
  return { control, audit };
}

export async function getAuditLog(query = {}) {
  const filtered = auditLog
    .filter((entry) => !query.adminId || entry.adminId === query.adminId)
    .filter((entry) => !query.actionType || entry.actionType === query.actionType)
    .filter((entry) => !query.from || new Date(entry.createdAt).getTime() >= new Date(query.from).getTime())
    .filter((entry) => !query.to || new Date(entry.createdAt).getTime() <= new Date(query.to).getTime());

  return paginate(filtered, query);
}
