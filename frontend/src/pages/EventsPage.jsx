import React, { useState, useEffect } from 'react';
import { eventsAPI } from '../services/api';
import { Navbar } from '../components/Navbar';
import { EventsFilter } from '../components/EventsFilter';
import { EventsList } from '../components/EventsList';
import { TicketModal } from '../components/TicketModal';

export const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({});
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadCategories();
    loadEvents();
  }, [page, filters]);

  const loadCategories = async () => {
    try {
      const response = await eventsAPI.getCategories();
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await eventsAPI.getEvents({
        ...filters,
        page,
        limit: 12
      });
      
      setEvents(response.data.events || []);
      setTotalPages(response.data.pages || 1);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleGetTickets = (event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Sydney Events
          </h1>
          <p className="text-gray-600">
            Discover amazing events happening in and around Sydney
          </p>
        </div>

        <EventsFilter 
          filters={filters} 
          onFilterChange={handleFilterChange}
          categories={categories}
        />

        <EventsList 
          events={events}
          loading={loading}
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={setPage}
          onGetTickets={handleGetTickets}
        />
      </main>

      <TicketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        event={selectedEvent}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};
