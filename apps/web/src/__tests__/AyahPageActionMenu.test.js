import { render, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';

jest.mock('@/context/Locale', () => ({
  useLocale: () => ({
    lang: 'ID',
    t: (key) => ({
      'common.more': 'Lainnya',
      'common.share': 'Bagikan',
      'tafsir.title': 'Tafsir Al-Quran',
      'ayah.mufrodat_title': 'Mufrodat (Kosakata)',
      'munasabah.title': 'Ayat Terkait',
    }[key] ?? key),
  }),
}));

jest.mock('@/lib/useQuranFont', () => ({
  useQuranFont: () => ({ arabicFontSize: 32, fontCls: 'font-arabic', translationFontSize: 16 }),
}));

jest.mock('@/lib/useActionPosition', () => ({
  useActionPosition: () => ({ isHidden: false, isMenu: true }),
}));

jest.mock('@/components/BookmarkButton', () => function BookmarkButton() {
  return <button type="button" title="Bookmark">Bookmark</button>;
});

jest.mock('@/components/NoteButton', () => function NoteButton() {
  return <button type="button" title="Catatan">Catatan</button>;
});

jest.mock('@/components/popup/ListImage', () => ({
  PopUpIsCopied: () => null,
  ShareAyah: () => null,
}));

jest.mock('@/lib/api', () => ({
  audioApi: { list: jest.fn() },
  mufrodatApi: { byAyah: jest.fn() },
  munasabahApi: { byAyah: jest.fn() },
  tafsirApi: { byAyah: jest.fn() },
}));

jest.mock('@/lib/const', () => ({ listMasjidImage: [] }));
jest.mock('@/lib/converter', () => ({ NumberToArabic: (value) => String(value) }));
jest.mock('@/lib/copy', () => ({
  CopyImageToClipboard: jest.fn(),
  CopyToClipboard: jest.fn(),
}));
jest.mock('@/lib/translation', () => ({
  getLocalizedTranslation: (translation) => translation?.text ?? '',
}));

const AyahPage = require('@/app/quran/[...slug]/AyahPage').default;

const surah = {
  number: 2,
  translation: {
    latin_en: 'Al-Baqara',
  },
};

const makeAyah = (number) => ({
  id: `ayah-${number}`,
  number,
  arabic: `Ayah ${number}`,
  translation: {
    text: `Terjemahan ${number}`,
    ar_html: `Ayah ${number}`,
    latin_idn: `Latin ${number}`,
  },
});

function ControlledAyahList() {
  const [openActionMenuAyahId, setOpenActionMenuAyahId] = useState(null);

  return (
    <ul>
      {[makeAyah(1), makeAyah(2)].map((ayah) => (
        <AyahPage
          key={ayah.id}
          surah={surah}
          ayah={ayah}
          newLimit={jest.fn()}
          isLast={false}
          isActionMenuOpen={openActionMenuAyahId === ayah.id}
          onActionMenuToggle={(isOpen) => setOpenActionMenuAyahId(isOpen ? ayah.id : null)}
        />
      ))}
    </ul>
  );
}

describe('AyahPage action menu', () => {
  beforeAll(() => {
    global.IntersectionObserver = class IntersectionObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  test('keeps only one ayah action menu open at a time', () => {
    render(<ControlledAyahList />);

    const moreButtons = screen.getAllByTitle('Lainnya');

    fireEvent.click(moreButtons[0]);
    expect(screen.getAllByText('Copy Link')).toHaveLength(1);

    fireEvent.click(moreButtons[1]);
    expect(screen.getAllByText('Copy Link')).toHaveLength(1);
  });
});
