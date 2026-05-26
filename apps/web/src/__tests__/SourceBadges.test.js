import { render, screen } from '@testing-library/react';
import SourceBadges, { parseSource } from '@/components/SourceBadges';

jest.mock('next/link', () => ({ children, href, ...props }) => (
  <a href={href} {...props}>{children}</a>
));

describe('parseSource', () => {
  test('returns empty array for null/undefined', () => {
    expect(parseSource(null)).toEqual([]);
    expect(parseSource(undefined)).toEqual([]);
  });

  test('returns empty array for empty string', () => {
    expect(parseSource('')).toEqual([]);
  });

  test('parses HR hadith source', () => {
    const result = parseSource('HR. Bukhari No. 123');
    expect(result).toHaveLength(1);
    expect(result[0].external).toBe(true);
    expect(result[0].url).toBe('https://sunnah.com/bukhari:123');
    expect(result[0].text).toBe('HR. Bukhari No. 123');
  });

  test('parses QS quran source', () => {
    const result = parseSource('QS. Al-Fatihah: 1');
    expect(result).toHaveLength(1);
    expect(result[0].external).toBe(false);
    expect(result[0].url).toBe('/quran/surah/Al-Fatihah#ayah-1');
  });

  test('parses multiple sources separated by semicolon', () => {
    const result = parseSource('HR. Muslim No. 456; QS. Al-Baqarah: 255');
    expect(result).toHaveLength(2);
    expect(result[0].external).toBe(true);
    expect(result[1].external).toBe(false);
  });

  test('handles unrecognized source', () => {
    const result = parseSource('Some random text');
    expect(result).toHaveLength(1);
    expect(result[0].url).toBeNull();
    expect(result[0].text).toBe('Some random text');
  });

  test('handles known hadith books', () => {
    const books = {
      'Bukhari': 'bukhari',
      'Muslim': 'muslim',
      'Abu Dawud': 'abudawud',
      'Tirmidzi': 'tirmidzi',
      'Ibnu Majah': 'ibnmajah',
      'Nasai': 'nasai',
      'Ahmad': 'ahmad',
    };
    Object.entries(books).forEach(([name, slug]) => {
      const result = parseSource(`HR. ${name} No. 1`);
      expect(result[0].url).toBe(`https://sunnah.com/${slug}:1`);
    });
  });
});

describe('SourceBadges', () => {
  test('renders null for empty source', () => {
    const { container } = render(<SourceBadges />);
    expect(container.innerHTML).toBe('');
  });

  test('renders external link for hadith source', () => {
    render(<SourceBadges source="HR. Bukhari No. 1" />);
    const link = screen.getByText('HR. Bukhari No. 1');
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('https://sunnah.com/bukhari:1');
    expect(link.getAttribute('target')).toBe('_blank');
  });

  test('renders internal link for quran source', () => {
    render(<SourceBadges source="QS. Al-Fatihah: 1" />);
    const link = screen.getByText('QS. Al-Fatihah: 1');
    expect(link.getAttribute('href')).toBe('/quran/surah/Al-Fatihah#ayah-1');
  });

  test('renders plain text for unrecognized source', () => {
    render(<SourceBadges source="Unknown reference" />);
    const el = screen.getByText('Unknown reference');
    expect(el.tagName).toBe('SPAN');
  });
});
