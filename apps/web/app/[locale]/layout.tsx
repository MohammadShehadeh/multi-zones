import '../globals.css';

import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, isRtl, type Locale } from '@repo/i18n/config';
import { buildMetadata } from '@repo/seo/metadata';
import { websiteJsonLd } from '@repo/seo/json-ld';
import { Link } from '@repo/microfrontends/next/client';

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
						<Link href={`/${locale}`} style={{ fontWeight: 'bold' }}>🏠 Home</Link>
						<Link href={`/${locale}/about`}>About</Link>
						<Link href={`/${locale}/docs`}>Docs</Link>
						<Link href={`/${locale}/blog`}>Blog</Link>
						<span style={{ marginLeft: 'auto' }}>
							{locales.map((l) => (
								<Link key={l} href={`/${l}`} style={{ marginLeft: '0.5rem', fontWeight: l === locale ? 'bold' : 'normal' }}>
									{l.toUpperCase()}
								</Link>
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
