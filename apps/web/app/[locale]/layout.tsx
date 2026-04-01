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
					<main>
						<nav className='flex gap-2'>
							<a href='/'>Home</a>
							<a href='/docs'>Docs</a>
							<a href='/blog'>Blog</a>
						</nav>
						{children}
					</main>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
