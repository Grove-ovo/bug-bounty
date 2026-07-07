import { AdminPanel } from "../../components/AdminPanel";

function getAdminSession() {
  return {
    id: "usr_admin_1",
    role: "admin"
  };
}

export default function AdminPanelPage() {
  const session = getAdminSession();

  if (session.role !== "admin") {
    return (
      <section className="card" aria-labelledby="forbidden-title">
        <h2 id="forbidden-title">403 Forbidden</h2>
        <p>Your account is not allowed to access the admin panel.</p>
      </section>
    );
  }

  return <AdminPanel adminId={session.id} />;
}
