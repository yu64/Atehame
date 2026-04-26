



export function createApp(): HTMLElement
{
  const el: HTMLElement = document.createElement('div');
  el.textContent = 'Hello World';
  return el;
}
