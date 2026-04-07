import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function AboutPage({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);
	const t = await getTranslations('about');

	return (
		<div style={{ padding: "2rem" }}>
			<div style={{ background: "#e8f4fd", border: "1px solid #90caf9", borderRadius: "8px", padding: "1rem", marginBottom: "1.5rem" }}>
				<p style={{ margin: 0, fontSize: "0.8rem", color: "#666" }}>Zone: <strong>web (main)</strong> · Port 3000 · Locale: <strong>{locale}</strong></p>
			</div>
			<h1>{t('title')}</h1>
			<p>{t('description')}</p>
		</div>
	);
}
