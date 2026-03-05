import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import BookMeeting from './components/BookMeeting.tsx';
import './index.css';

// Check if this is a booking page request
const params = new URLSearchParams(window.location.search);
const isBookMeeting = params.get('bookMeeting') === 'true';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isBookMeeting ? (
      <BookMeeting
        email={params.get('email') || ''}
        firstName={params.get('firstName') || ''}
        lastName={params.get('lastName') || ''}
        formId={params.get('formId') || undefined}
        sessionLength={params.get('sessionLength') || undefined}
      />
    ) : (
      <App />
    )}
  </StrictMode>
);
