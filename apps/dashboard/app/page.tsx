import { getApplication } from '@repo/microfrontends/config';

export default function DashboardPage() {
	const web = getApplication('web');

	return (
		<main style={{ padding: '2rem' }}>
			<div style={{ background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
				<p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>
					App: <strong>dashboard</strong> · Standalone (own host, not proxied by web)
				</p>
			</div>
			<h1>Dashboard</h1>
			<p>
				<a href={web.url}>← Back to site</a>
			</p>
		</main>
	);
}
