import { createApp } from '@src/App.js';
import "uno.css";

const app = createApp();
const root = document.getElementById('app');

if(root !== null)
{
  root.appendChild(app);
}
