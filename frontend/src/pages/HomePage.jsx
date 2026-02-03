import React, { useState, useEffect } from 'react';
import { eventsAPI } from '../services/api';
import { EventCard } from '../components/EventCard';
import { TicketModal } from '../components/TicketModal';

export const HomePage = () => {
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    loadFeaturedEvents();
  }, []);

  const loadFeaturedEvents = async () => {
    try {
      setLoading(true);
      const response = await eventsAPI.getFeaturedEvents();
      setFeaturedEvents(response.data.events || []);
    } catch (error) {
      console.error('Error loading featured events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetTickets = (event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleModalSuccess = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold mb-6">
              Discover Sydney's Best Events
            </h1>
            <p className="text-xl text-primary-100 mb-8">
              Find concerts, festivals, workshops, and more happening in and around Sydney. 
              Never miss an event that matters to you.
            </p>
            <button 
              onClick={() => window.location.href = '/events'}
              className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
            >
              Browse All Events
            </button>
          </div>
        </div>
      </header>

      {showSuccess && (
        <div className="fixed top-4 right-4 bg-green-100 text-green-800 px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          Successfully registered! Redirecting to event page...
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Featured Events
          </h2>
          <p className="text-gray-600">
            Handpicked events happening soon in Sydney
          </p>
        </div>

        {featuredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredEvents.map((event) => (
              <EventCard 
                key={event._id} 
                event={event} 
                onGetTickets={handleGetTickets}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading featured events...</p>
          </div>
        )}
      </main>

      <TicketModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        event={selectedEvent}
        onSuccess={handleModalSuccess}
      />

      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Louder World</h3>
              <p className="text-gray-400">
                Your go-to platform for discovering the best events in Sydney
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/events" className="hover:text-white">Browse Events</a></li>
                <li><a href="/categories" className="hover:text-white">Categories</a></li>
                <li><a href="/about" className="hover:text-white">About Us</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <p className="text-gray-400">
                Stay updated with the latest events
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2026 Louder World. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
