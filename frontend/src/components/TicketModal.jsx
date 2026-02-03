import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { Modal } from './Modal';
import { Input } from './Input';
import { Button } from './Button';
import { eventsAPI } from '../services/api';

export const TicketModal = ({ isOpen, onClose, event, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    if (!consent) {
      setError('Please agree to receive emails');
      return;
    }

    setLoading(true);

    try {
      const response = await eventsAPI.createLead(email, consent, event._id);
      
      if (response.data.redirectUrl) {
        onSuccess();
        window.open(response.data.redirectUrl, '_blank');
      }
      
      onClose();
      setEmail('');
      setConsent(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!event) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Get Tickets">
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-1">{event.title}</h3>
          <p className="text-sm text-gray-600">
            {new Date(event.dateTime).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error && !email ? 'Email is required' : ''}
              disabled={loading}
            />
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              disabled={loading}
            />
            <span className="text-sm text-gray-600">
              I consent to receive emails about this event and future events from Louder World
            </span>
          </label>

          {error && (
            <div className="bg-red-50 text-red-800 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Processing...' : 'Continue to Event'}
            </Button>
          </div>
        </form>

        <p className="text-xs text-gray-500 text-center">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </Modal>
  );
};
