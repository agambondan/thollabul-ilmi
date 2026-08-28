import { render, screen } from '@testing-library/react';

import MushafAyahList from '@/components/quran/MushafAyahList';

const ayahs = [
  {
    id: 201,
    number: 1,
    surah: {
      number: 2,
      slug: 'al-baqara',
      translation: {
        latin_en: 'Al-Baqara',
      },
    },
    translation: {
      ar: 'الٓمٓ',
      ar_html: '<tajweed class="madda_necessary">الٓمٓ</tajweed>',
      idn: 'Alif laam miim.',
    },
  },
];

const t = (key) => ({
  'mushaf.ayah': 'Ayah',
  'mushaf.ayah_unit': 'ayat',
}[key] ?? key);

describe('MushafAyahList', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('renders Quran font, tajweed HTML, and reader link for public route', () => {
    const { container } = render(
      <MushafAyahList ayahs={ayahs} lang="ID" readerBasePath="/quran/surah" t={t} />,
    );

    expect(screen.getByRole('link', { name: '2. Al-Baqara' })).toHaveAttribute(
      'href',
      '/quran/surah/Al-Baqara#ayah-1',
    );
    expect(container.querySelector('p.font-lpmq')).toHaveStyle({ fontSize: '40px' });
    expect(container.querySelector('tajweed.madda_necessary')).not.toBeNull();
    expect(screen.getByText('Alif laam miim.')).toHaveStyle({ fontSize: '16px' });
  });

  test('uses dashboard reader base path when supplied', () => {
    render(<MushafAyahList ayahs={ayahs} lang="ID" readerBasePath="/dashboard/quran" t={t} />);

    expect(screen.getByRole('link', { name: '2. Al-Baqara' })).toHaveAttribute(
      'href',
      '/dashboard/quran/Al-Baqara#ayah-1',
    );
  });

  test('falls back to top-level surah fields when relation payload is absent', () => {
    render(
      <MushafAyahList
        ayahs={[
          {
            id: 202,
            number: 2,
            surah_number: 2,
            surah_name: 'Al-Baqara',
            translation: {
              ar_html: '<tajweed class="ikhf">هُدًى</tajweed>',
              idn: 'Petunjuk bagi mereka yang bertakwa.',
            },
          },
        ]}
        lang="ID"
        readerBasePath="/quran/surah"
        t={t}
      />,
    );

    expect(screen.getByRole('link', { name: '2. Al-Baqara' })).toHaveAttribute(
      'href',
      '/quran/surah/Al-Baqara#ayah-2',
    );
  });
});
