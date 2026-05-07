import { Notyf } from 'notyf';
import 'notyf/notyf.min.css';

const ICON_SUCCESS = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`;
const ICON_ERROR = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`;

const notyf = new Notyf({
  duration: 4000,
  position: { x: 'center', y: 'top' },
  types: [
    {
      type: 'success',
      background: '#10b981',
      icon: false
    },
    {
      type: 'error',
      background: '#ef4444',
      icon: false
    }
  ]
});

export const notify = {
  show: (type: 'success' | 'error', msg: string) => {
    const icon = type === 'success' ? ICON_SUCCESS : ICON_ERROR;
    
    notyf.open({
      type,
      message: `
        <div style="display: flex; align-items: center; font-family: sans-serif; font-weight: 500;">
          ${icon}
          <span>${msg}</span>
        </div>
      `
    });
  },

  later: (type: 'success' | 'error', msg: string) => {
    sessionStorage.setItem('pending_notification', JSON.stringify({ type, msg }));
  },

  check: () => {
    const data = sessionStorage.getItem('pending_notification');
    if (data) {
      const { type, msg } = JSON.parse(data);
      notify.show(type, msg);
      sessionStorage.removeItem('pending_notification');
    }
  }
};