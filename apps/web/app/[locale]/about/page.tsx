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
		<>
			<h1>{t('title')}</h1>
			<p>{t('description')}</p>
		</>
	);
}
