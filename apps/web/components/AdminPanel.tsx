"use client";

import { useMemo, useState } from "react";

type UserStatus = "active" | "suspended" | "banned";
type Role = "client" | "freelancer";
type ModerationStatus = "flagged" | "under_review" | "approved" | "rejected" | "escalated";
type DisputeStatus = "open" | "under_review" | "resolved";

type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  joinedAt: string;
  trustScore: number;
  activeJobs: string[];
  disputes: string[];
};

type FlaggedJob = {
  id: string;
  title: string;
  status: ModerationStatus;
  reason: string;
  reports: number;
  poster: string;
};

type Dispute = {
  id: string;
  job: string;
  status: DisputeStatus;
  amount: string;
  parties: string;
  evidence: string[];
  thread: string[];
  transaction: string;
};

type AuditEntry = {
  id: string;
  adminId: string;
  actionType: string;
  target: string;
  createdAt: string;
};

const initialUsers: User[] = [
  {
    id: "usr_client_101",
    name: "Avery Chen",
    email: "avery@example.com",
    role: "client",
    status: "active",
    joinedAt: "2026-05-11",
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
    joinedAt: "2026-05-18",
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
    joinedAt: "2026-06-02",
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
    joinedAt: "2026-06-20",
    trustScore: 74,
    activeJobs: ["job_203"],
    disputes: ["dsp_302"]
  }
];

const initialJobs: FlaggedJob[] = [
  {
    id: "job_201",
    title: "Build a support automation dashboard",
    status: "flagged",
    reason: "Budget changed after proposal acceptance",
    reports: 2,
    poster: "Avery Chen"
  },
  {
    id: "job_202",
    title: "Migrate legacy API to Node.js",
    status: "under_review",
    reason: "Automated duplicate listing signal",
    reports: 1,
    poster: "Avery Chen"
  },
  {
    id: "job_203",
    title: "Design trust and safety flows",
    status: "flagged",
    reason: "User report: unclear deliverables",
    reports: 3,
    poster: "Jordan Smith"
  }
];

const initialDisputes: Dispute[] = [
  {
    id: "dsp_301",
    job: "Build a support automation dashboard",
    status: "open",
    amount: "$1,500",
    parties: "Avery Chen / Maya Patel",
    evidence: ["delivery-notes.pdf", "screen-recording.mp4"],
    thread: ["Client requested delivery evidence.", "Freelancer uploaded deployment notes."],
    transaction: "txn_901"
  },
  {
    id: "dsp_302",
    job: "Design trust and safety flows",
    status: "under_review",
    amount: "$900",
    parties: "Jordan Smith / Noah Williams",
    evidence: ["milestone-chat.txt", "scope-snapshot.png"],
    thread: ["Freelancer requested milestone release.", "Client reported scope mismatch."],
    transaction: "txn_902"
  }
];

function now() {
  return new Date().toISOString();
}

function paginate<T>(items: T[], page: number, pageSize = 3) {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function AdminPanel({ adminId }: { adminId: string }) {
  const [users, setUsers] = useState(initialUsers);
  const [jobs, setJobs] = useState(initialJobs);
  const [disputes, setDisputes] = useState(initialDisputes);
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | UserStatus>("all");
  const [search, setSearch] = useState("");
  const [joinedFrom, setJoinedFrom] = useState("");
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [panelError, setPanelError] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(initialUsers[0].id);
  const [auditAdminFilter, setAuditAdminFilter] = useState("");
  const [auditActionFilter, setAuditActionFilter] = useState("");
  const [auditFrom, setAuditFrom] = useState("");
  const [auditTo, setAuditTo] = useState("");
  const [controls, setControls] = useState({ registrations: true, jobPostings: true });
  const [audit, setAudit] = useState<AuditEntry[]>([
    {
      id: "aud_100",
      adminId: "system",
      actionType: "bootstrap",
      target: "controls",
      createdAt: "2026-07-01T00:00:00.000Z"
    }
  ]);

  const filteredUsers = useMemo(() => {
    const needle = search.toLowerCase();
    return users
      .filter((user) => roleFilter === "all" || user.role === roleFilter)
      .filter((user) => statusFilter === "all" || user.status === statusFilter)
      .filter((user) => !joinedFrom || user.joinedAt >= joinedFrom)
      .filter((user) => [user.name, user.email, user.id].some((value) => value.toLowerCase().includes(needle)));
  }, [joinedFrom, roleFilter, search, statusFilter, users]);

  const totalPages = Math.max(Math.ceil(filteredUsers.length / 3), 1);
  const userPage = paginate(filteredUsers, Math.min(page, totalPages));
  const selectedUser = users.find((user) => user.id === selectedUserId) ?? users[0];
  const selectedUserJobs = jobs.filter((job) => selectedUser.activeJobs.includes(job.id));
  const selectedUserDisputes = disputes.filter((dispute) => selectedUser.disputes.includes(dispute.id));
  const filteredAudit = useMemo(() => audit.filter((entry) => {
    const afterFrom = !auditFrom || entry.createdAt >= auditFrom;
    const beforeTo = !auditTo || entry.createdAt <= `${auditTo}T23:59:59.999Z`;
    const adminMatch = !auditAdminFilter || entry.adminId.includes(auditAdminFilter);
    const actionMatch = !auditActionFilter || entry.actionType === auditActionFilter;
    return afterFrom && beforeTo && adminMatch && actionMatch;
  }), [audit, auditActionFilter, auditAdminFilter, auditFrom, auditTo]);
  const openDisputes = disputes.filter((dispute) => dispute.status !== "resolved").length;
  const flaggedListings = jobs.filter((job) => job.status === "flagged").length;
  const revenue = "$128.9k";

  function log(actionType: string, target: string) {
    setAudit((entries) => [
      {
        id: `aud_${entries.length + 101}`,
        adminId,
        actionType,
        target,
        createdAt: now()
      },
      ...entries
    ]);
  }

  function updateUser(id: string, status: UserStatus) {
    setUsers((entries) => entries.map((user) => (user.id === id ? { ...user, status } : user)));
    log("user_status_updated", id);
  }

  function updateJob(id: string, status: ModerationStatus) {
    setJobs((entries) => entries.map((job) => (job.id === id ? { ...job, status } : job)));
    log("job_moderation_updated", id);
  }

  function ruleDispute(id: string, outcome: "client" | "freelancer" | "refund" | "senior_admin") {
    setDisputes((entries) => entries.map((dispute) => (
      dispute.id === id
        ? { ...dispute, status: outcome === "senior_admin" ? "under_review" : "resolved" }
        : dispute
    )));
    log("dispute_ruled", `${id}:${outcome}`);
  }

  function toggleControl(key: "registrations" | "jobPostings") {
    const label = key === "registrations" ? "new user registrations" : "new job postings";
    if (!window.confirm(`Confirm change to ${label}?`)) {
      return;
    }

    setControls((current) => ({ ...current, [key]: !current[key] }));
    log("platform_control_updated", key);
  }

  function refreshData() {
    setPanelError("");
    setRefreshing(true);
    window.setTimeout(() => {
      setRefreshing(false);
      log("manual_refresh", "dashboard");
    }, 250);
  }

  return (
    <div className="admin-panel">
      <section className="card admin-hero" aria-labelledby="admin-title">
        <div>
          <h2 id="admin-title">Admin Panel</h2>
          <p>Signed in as {adminId}</p>
        </div>
        <button type="button" onClick={refreshData} disabled={refreshing} aria-label="Refresh admin data">
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </section>
      {refreshing && <p className="state-note" role="status">Loading latest admin data...</p>}
      {panelError && <p className="state-note error" role="alert">{panelError}</p>}

      <section className="admin-metrics" aria-label="Trust and platform metrics">
        <article className="card"><strong>{users.length}</strong><span>Total users</span></article>
        <article className="card"><strong>{jobs.length}</strong><span>Active jobs</span></article>
        <article className="card"><strong>{openDisputes}</strong><span>Open disputes</span></article>
        <article className="card"><strong>{flaggedListings}</strong><span>Flagged listings</span></article>
        <article className="card"><strong>{revenue}</strong><span>Revenue</span></article>
      </section>

      <section className="card" aria-labelledby="trust-title">
        <h3 id="trust-title">Trust Score Distribution</h3>
        <div className="trust-bars">
          {[
            ["0-49", users.filter((user) => user.trustScore < 50).length],
            ["50-79", users.filter((user) => user.trustScore >= 50 && user.trustScore < 80).length],
            ["80-100", users.filter((user) => user.trustScore >= 80).length]
          ].map(([label, count]) => (
            <div key={label} className="trust-row">
              <span>{label}</span>
              <meter min={0} max={users.length} value={Number(count)} aria-label={`Trust score ${label}`} />
              <strong>{count}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="card" aria-labelledby="users-title">
        <div className="admin-section-head">
          <h3 id="users-title">User Management</h3>
          <span>{filteredUsers.length} matching users</span>
        </div>
        <div className="admin-filters" aria-label="User filters">
          <label>
            Search
            <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
          </label>
          <label>
            Role
            <select value={roleFilter} onChange={(event) => { setRoleFilter(event.target.value as "all" | Role); setPage(1); }}>
              <option value="all">All</option>
              <option value="client">Client</option>
              <option value="freelancer">Freelancer</option>
            </select>
          </label>
          <label>
            Status
            <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value as "all" | UserStatus); setPage(1); }}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>
          </label>
          <label>
            Joined after
            <input type="date" value={joinedFrom} onChange={(event) => { setJoinedFrom(event.target.value); setPage(1); }} />
          </label>
        </div>
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Trust</th>
                <th>Profile</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {userPage.length === 0 && (
                <tr>
                  <td colSpan={7}>No users match the current filters.</td>
                </tr>
              )}
              {userPage.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}<br /><small>{user.email}</small></td>
                  <td>{user.role}</td>
                  <td>{user.status}</td>
                  <td>{user.joinedAt}</td>
                  <td>{user.trustScore}</td>
                  <td>{user.activeJobs.length} jobs / {user.disputes.length} disputes</td>
                  <td>
                    <button type="button" onClick={() => setSelectedUserId(user.id)}>View</button>
                    <button type="button" onClick={() => updateUser(user.id, "suspended")}>Suspend</button>
                    <button type="button" onClick={() => updateUser(user.id, "active")}>Reinstate</button>
                    <button type="button" onClick={() => updateUser(user.id, "banned")}>Ban</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pagination" aria-label="User table pagination">
          <button type="button" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Previous</button>
          <span>Page {Math.min(page, totalPages)} of {totalPages}</span>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>Next</button>
        </div>
        <aside className="detail-panel" aria-labelledby="profile-title">
          <h4 id="profile-title">{selectedUser.name}</h4>
          <p>{selectedUser.email} / {selectedUser.role} / {selectedUser.status}</p>
          <p>Active jobs: {selectedUserJobs.length ? selectedUserJobs.map((job) => job.title).join(", ") : "None"}</p>
          <p>Dispute history: {selectedUserDisputes.length ? selectedUserDisputes.map((dispute) => dispute.id).join(", ") : "None"}</p>
        </aside>
      </section>

      <section className="grid admin-queues">
        <article className="card" aria-labelledby="moderation-title">
          <h3 id="moderation-title">Job Moderation</h3>
          {jobs.length === 0 && <p>No flagged listings are waiting for review.</p>}
          {jobs.map((job) => (
            <div className="queue-item" key={job.id}>
              <strong>{job.title}</strong>
              <p>{job.reason}</p>
              <small>{job.reports} reports by {job.poster} / {job.status}</small>
              <div>
                <button type="button" onClick={() => updateJob(job.id, "approved")}>Approve</button>
                <button type="button" onClick={() => updateJob(job.id, "rejected")}>Reject</button>
                <button type="button" onClick={() => updateJob(job.id, "escalated")}>Escalate</button>
              </div>
            </div>
          ))}
        </article>

        <article className="card" aria-labelledby="disputes-title">
          <h3 id="disputes-title">Dispute Resolution</h3>
          {disputes.length === 0 && <p>No open disputes are waiting for review.</p>}
          {disputes.map((dispute) => (
            <div className="queue-item" key={dispute.id}>
              <strong>{dispute.job}</strong>
              <p>{dispute.parties} / {dispute.amount} / {dispute.transaction}</p>
              <small>{dispute.status} / evidence: {dispute.evidence.join(", ")}</small>
              <small>thread: {dispute.thread.join(" | ")}</small>
              <div>
                <button type="button" onClick={() => ruleDispute(dispute.id, "client")}>Client</button>
                <button type="button" onClick={() => ruleDispute(dispute.id, "freelancer")}>Freelancer</button>
                <button type="button" onClick={() => ruleDispute(dispute.id, "refund")}>Refund</button>
                <button type="button" onClick={() => ruleDispute(dispute.id, "senior_admin")}>Escalate</button>
              </div>
            </div>
          ))}
        </article>
      </section>

      <section className="grid admin-queues">
        <article className="card" aria-labelledby="controls-title">
          <h3 id="controls-title">Platform Controls</h3>
          <label className="switch-row">
            <input type="checkbox" checked={controls.registrations} onChange={() => toggleControl("registrations")} />
            New user registrations
          </label>
          <label className="switch-row">
            <input type="checkbox" checked={controls.jobPostings} onChange={() => toggleControl("jobPostings")} />
            New job postings
          </label>
        </article>

        <article className="card" aria-labelledby="audit-title">
          <h3 id="audit-title">Audit Log</h3>
          <div className="admin-filters audit-filters" aria-label="Audit filters">
            <label>
              Admin
              <input value={auditAdminFilter} onChange={(event) => setAuditAdminFilter(event.target.value)} />
            </label>
            <label>
              Action
              <select value={auditActionFilter} onChange={(event) => setAuditActionFilter(event.target.value)}>
                <option value="">All</option>
                <option value="bootstrap">Bootstrap</option>
                <option value="manual_refresh">Refresh</option>
                <option value="user_status_updated">User status</option>
                <option value="job_moderation_updated">Job moderation</option>
                <option value="dispute_ruled">Dispute ruling</option>
                <option value="platform_control_updated">Platform control</option>
              </select>
            </label>
            <label>
              From
              <input type="date" value={auditFrom} onChange={(event) => setAuditFrom(event.target.value)} />
            </label>
            <label>
              To
              <input type="date" value={auditTo} onChange={(event) => setAuditTo(event.target.value)} />
            </label>
          </div>
          <div className="audit-list">
            {filteredAudit.length === 0 && <p>No audit entries match the current filters.</p>}
            {filteredAudit.map((entry) => (
              <div key={entry.id} className="audit-entry">
                <strong>{entry.actionType}</strong>
                <span>{entry.target}</span>
                <small>{entry.adminId} / {entry.createdAt}</small>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
