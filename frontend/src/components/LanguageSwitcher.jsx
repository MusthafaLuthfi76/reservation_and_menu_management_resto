import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <select 
      value={i18n.language}
      onChange={(e) => {
        i18n.changeLanguage(e.target.value);
        localStorage.setItem('language', e.target.value);
      }}
      className="px-3 py-2 border rounded text-sm"
    >
      <option value="en">English</option>
      <option value="ja">日本語</option>
      <option value="id">Bahasa Indonesia</option>
    </select>
  );
}