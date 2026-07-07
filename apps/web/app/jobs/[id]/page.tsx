import { jobs } from "../../../lib/mock";

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const job = jobs.find((listing) => listing.id === params.id);

  if (!job) {
    return (
      <section className="card">
        <h2>Job Not Found</h2>
        <p>No job listing matches <strong>{params.id}</strong>.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>{job.title}</h2>
      <p>{job.budget}</p>
      <p>Responsibilities, milestones, and proposals are available for this listing.</p>
    </section>
  );
}
