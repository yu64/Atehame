import ja from "@src/assets/locales/ja/translation.json";
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

// 参考
// https://zenn.dev/mtea/articles/react-i18next
// https://qiita.com/Taira0222/items/09a86ff1113ad4de3304

export const supportedLanguages = {
  // en: "English",
  ja: "日本語",
};

i18n
  // ユーザーの言語設定を検知するため
  .use(LanguageDetector)
  // i18next インスタンスを初期化
  .use(initReactI18next)
  .init({
    // 翻訳リソースの定義。各言語ごとに翻訳ファイルを指定
    resources: {
      // en: {
      //   translation: en,
      // },
      ja: {
        translation: ja,
      },
    },

    // フォールバック言語。指定された言語ファイルがない場合などにこの言語が使用される
    fallbackLng: "ja",
    // 空文字での定義を許可に
    returnEmptyString: false,
    supportedLngs: Object.keys(supportedLanguages),
    // true にすると開発コンソールに i18next が正しく初期化されたことを示す出力が表示される: Object.keys(supportedLanguages),
    debug: true,

    // デフォルトは`escapeValue: true`
    // 18next が翻訳メッセージ内のコードをエスケープし、XSS 攻撃から保護するためのもの
    // React がこのエスケープを行ってくれるので、今回はこれをオフにする
    interpolation: {
      escapeValue: false,
    },
  });

export { i18n };
