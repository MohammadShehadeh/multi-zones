import '../globals.css';

import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, isRtl, type Locale } from '@repo/i18n/config';
import { buildMetadata } from '@repo/seo/metadata';
import { websiteJsonLd } from '@repo/seo/json-ld';

export function generateStaticParams() {
	return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	return buildMetadata({
		locale: locale as Locale,
		title: 'Example',
		description: 'Your site description',
		path: '',
	});
}

export default async function RootLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;

	if (!locales.includes(locale as Locale)) {
		notFound();
	}

	setRequestLocale(locale);
	const messages = await getMessages();

	return (
		<html
			lang={locale}
			dir={isRtl(locale as Locale) ? 'rtl' : 'ltr'}
		>
			<head>
				<script
					type='application/ld+json'
					dangerouslySetInnerHTML={{
						__html: JSON.stringify(websiteJsonLd()),
					}}
				/>
			</head>
			<body>
				<NextIntlClientProvider messages={messages}>
					<nav style={{ display: 'flex', gap: '1rem', padding: '1rem', borderBottom: '1px solid #eee', background: '#f9f9f9' }}>
						<a href={`/${locale}`} style={{ fontWeight: 'bold' }}>🏠 Home</a>
						<a href={`/${locale}/about`}>About</a>
						<a href={`/${locale}/docs`}>Docs</a>
						<a href={`/${locale}/blog`}>Blog</a>
						<span style={{ marginLeft: 'auto' }}>
							{locales.map((l) => (
								<a key={l} href={`/${l}`} style={{ marginLeft: '0.5rem', fontWeight: l === locale ? 'bold' : 'normal' }}>
									{l.toUpperCase()}
								</a>
							))}
						</span>
					</nav>
					<main>
						{children}
					</main>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
