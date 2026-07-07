const settingsGroups = [
  {
    title: "Account and profile",
    description: "Public identity, profile status, and marketplace visibility.",
    status: "Visible",
    action: "Review profile",
    items: ["Grove Chen", "Client account", "Profile completeness 82%"]
  },
  {
    title: "Notifications",
    description: "Proposal, message, billing, and project milestone alerts.",
    status: "Email on",
    action: "Tune alerts",
    items: ["Unread message alerts", "Proposal updates", "Weekly project digest"]
  },
  {
    title: "Security",
    description: "Sign-in posture, active session review, and account recovery.",
    status: "Needs review",
    action: "Open security",
    items: ["Password updated 28 days ago", "2FA not enabled", "1 active device"]
  },
  {
    title: "Billing and payouts",
    description: "Default billing contact, payout preference, and tax profile state.",
    status: "Draft",
    action: "Check billing",
    items: ["USD billing", "Payout method pending", "Tax profile incomplete"]
  }
];

export default function SettingsPage() {
  return (
    <section>
      <div className="card settings-hero">
        <p className="eyebrow">Account controls</p>
        <h2>Settings</h2>
        <p>
          Review account visibility, notification defaults, security posture,
          and billing or payout readiness from one page.
        </p>
      </div>

      <div className="grid">
        {settingsGroups.map((group) => (
          <article className="card settings-card" key={group.title}>
            <div className="settings-card__header">
              <h3>{group.title}</h3>
              <span className="status-chip">{group.status}</span>
            </div>
            <p>{group.description}</p>
            <ul className="settings-list">
              {group.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <button className="settings-action" type="button">
              {group.action}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
