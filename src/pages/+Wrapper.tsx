import React from 'react';
import "uno.css";
import "@src/store/i18n.js";

export default function Wrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}